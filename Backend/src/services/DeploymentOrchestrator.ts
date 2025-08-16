import { EventEmitter } from 'events';
import { prisma } from '@/config/database.js';
import { logger } from '@/utils/logger.js';
import { 
  Deployment, 
  DeploymentStatus, 
  DeploymentProgress,
  InfrastructureConfig,
  DeploymentEndpoints
} from '@/types/index.js';
import { CoreWeaveService } from './CoreWeaveService.js';
import { DockerService } from './DockerService.js';
import { N8nService } from './N8nService.js';
import { SecurityService } from './SecurityService.js';

export class DeploymentOrchestrator extends EventEmitter {
  private coreweave: CoreWeaveService;
  private docker: DockerService;
  private n8n: N8nService;
  private security: SecurityService;

  constructor() {
    super();
    this.coreweave = new CoreWeaveService();
    this.docker = new DockerService();
    this.n8n = new N8nService();
    this.security = new SecurityService();
  }

  /**
   * Deploy complete AI infrastructure stack
   */
  async deployInfrastructure(deployment: Deployment): Promise<void> {
    const deploymentId = deployment.id;
    logger.info(`Starting deployment for ${deploymentId}`);

    try {
      await this.updateDeploymentStatus(deploymentId, DeploymentStatus.PROVISIONING);
      
      // Step 1: Provision CoreWeave GPU Infrastructure
      await this.logProgress(deploymentId, 1, 8, 'Provisioning CoreWeave GPU instances...', 10);
      const gpuInstance = await this.coreweave.provisionGPUInstance({
        region: deployment.region,
        modelSize: await this.getModelSize(deployment.modelId),
        compliance: deployment.compliance
      });

      // Step 2: Set up GPU environment with vLLM
      await this.logProgress(deploymentId, 2, 8, 'Setting up vLLM with quantized model...', 25);
      await this.docker.deployLLMContainer({
        instanceId: gpuInstance.id,
        modelId: deployment.modelId,
        quantization: true
      });

      // Step 3: Deploy ChromaDB cluster for vector storage
      await this.logProgress(deploymentId, 3, 8, 'Deploying ChromaDB vector storage cluster...', 40);
      const chromaEndpoint = await this.docker.deployChromaDB({
        instanceId: gpuInstance.id,
        persistentStorage: true
      });

      // Step 4: Set up LlamaIndex RAG pipeline
      await this.logProgress(deploymentId, 4, 8, 'Configuring LlamaIndex RAG pipeline...', 55);
      const ragEndpoint = await this.docker.deployRAGPipeline({
        instanceId: gpuInstance.id,
        chromaEndpoint,
        industry: deployment.industry,
        useCase: deployment.useCase
      });

      // Step 5: Deploy n8n workflow automation
      await this.logProgress(deploymentId, 5, 8, 'Setting up n8n workflow automation...', 70);
      const n8nEndpoint = await this.n8n.deployWorkflowEngine({
        instanceId: gpuInstance.id,
        templates: this.getWorkflowTemplates(deployment.industry)
      });

      // Step 6: Deploy Streamlit chat interface
      await this.logProgress(deploymentId, 6, 8, 'Deploying Streamlit chat interface...', 85);
      const chatEndpoint = await this.docker.deployStreamlitUI({
        instanceId: gpuInstance.id,
        ragEndpoint,
        organizationName: deployment.name,
        branding: await this.getBrandingConfig(deployment.organizationId)
      });

      // Step 7: Configure security and compliance
      await this.logProgress(deploymentId, 7, 8, 'Configuring security and compliance...', 95);
      await this.security.setupCompliance({
        instanceId: gpuInstance.id,
        complianceType: deployment.compliance,
        endpoints: [chatEndpoint, ragEndpoint, n8nEndpoint]
      });

      // Step 8: Finalize deployment
      await this.logProgress(deploymentId, 8, 8, 'Finalizing deployment...', 100);
      
      const endpoints: DeploymentEndpoints = {
        chatUI: chatEndpoint,
        apiEndpoint: ragEndpoint,
        n8nWorkflows: n8nEndpoint,
        adminDashboard: `${chatEndpoint}/admin`
      };

      await this.finalizeDeployment(deploymentId, endpoints, gpuInstance);
      
      logger.info(`Deployment ${deploymentId} completed successfully`);
      this.emit('deploymentComplete', deploymentId);

    } catch (error) {
      logger.error(`Deployment ${deploymentId} failed:`, error);
      await this.updateDeploymentStatus(deploymentId, DeploymentStatus.FAILED, error.message);
      this.emit('deploymentFailed', deploymentId, error);
      throw error;
    }
  }

  /**
   * Stop and cleanup deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    logger.info(`Stopping deployment ${deploymentId}`);
    
    try {
      await this.updateDeploymentStatus(deploymentId, DeploymentStatus.STOPPING);
      
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId }
      });

      if (!deployment) {
        throw new Error('Deployment not found');
      }

      // Stop all services
      await this.docker.stopAllContainers(deploymentId);
      await this.coreweave.terminateInstance(deploymentId);
      
      await this.updateDeploymentStatus(deploymentId, DeploymentStatus.STOPPED);
      
      logger.info(`Deployment ${deploymentId} stopped successfully`);
      this.emit('deploymentStopped', deploymentId);

    } catch (error) {
      logger.error(`Failed to stop deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Scale deployment resources
   */
  async scaleDeployment(deploymentId: string, newConfig: InfrastructureConfig): Promise<void> {
    logger.info(`Scaling deployment ${deploymentId}`);
    
    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId }
      });

      if (!deployment) {
        throw new Error('Deployment not found');
      }

      // Scale GPU instances
      await this.coreweave.scaleInstance(deploymentId, newConfig);
      
      // Update database
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          infrastructureConfig: newConfig as any,
          updatedAt: new Date()
        }
      });

      logger.info(`Deployment ${deploymentId} scaled successfully`);
      this.emit('deploymentScaled', deploymentId);

    } catch (error) {
      logger.error(`Failed to scale deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get deployment health status
   */
  async getDeploymentHealth(deploymentId: string): Promise<any> {
    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId }
      });

      if (!deployment) {
        throw new Error('Deployment not found');
      }

      // Check all service health
      const health = await Promise.all([
        this.docker.checkContainerHealth(deploymentId, 'llm'),
        this.docker.checkContainerHealth(deploymentId, 'chromadb'),
        this.docker.checkContainerHealth(deploymentId, 'rag-pipeline'),
        this.docker.checkContainerHealth(deploymentId, 'streamlit'),
        this.n8n.checkWorkflowHealth(deploymentId)
      ]);

      return {
        deploymentId,
        status: deployment.status,
        services: {
          llm: health[0],
          chromadb: health[1],
          ragPipeline: health[2],
          streamlit: health[3],
          n8nWorkflows: health[4]
        },
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to get health for deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async updateDeploymentStatus(
    deploymentId: string, 
    status: DeploymentStatus, 
    errorMessage?: string
  ): Promise<void> {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        errorMessage,
        updatedAt: new Date()
      }
    });
  }

  private async logProgress(
    deploymentId: string,
    step: number,
    totalSteps: number,
    currentTask: string,
    progress: number
  ): Promise<void> {
    const logEntry = {
      deploymentId,
      step,
      totalSteps,
      currentTask,
      progress,
      logs: [currentTask],
      status: 'running',
      createdAt: new Date()
    };

    await prisma.deploymentLog.create({
      data: logEntry
    });

    // Emit progress event for real-time updates
    this.emit('deploymentProgress', {
      deploymentId,
      step,
      totalSteps,
      currentTask,
      progress,
      timestamp: new Date()
    });

    logger.info(`Deployment ${deploymentId} - Step ${step}/${totalSteps}: ${currentTask} (${progress}%)`);
  }

  private async getModelSize(modelId: string): Promise<string> {
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId }
    });
    
    if (!model) {
      throw new Error('Model not found');
    }
    
    return model.parameters; // e.g., "70B", "405B"
  }

  private getWorkflowTemplates(industry: string): string[] {
    const baseTemplates = [
      'document-auto-processing',
      'daily-digest',
      'question-routing'
    ];

    const industryTemplates: Record<string, string[]> = {
      'LEGAL': ['contract-analysis', 'compliance-monitoring', 'case-research'],
      'HEALTHCARE': ['patient-records', 'clinical-research', 'hipaa-compliance'],
      'FINANCE': ['financial-analysis', 'risk-assessment', 'regulatory-compliance'],
      'PROFESSIONAL': ['proposal-generation', 'client-management', 'knowledge-base']
    };

    return [...baseTemplates, ...(industryTemplates[industry] || [])];
  }

  private async getBrandingConfig(organizationId: string): Promise<any> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    return {
      organizationName: organization?.name || 'AI Document Processing',
      primaryColor: '#2563eb',
      logo: null, // TODO: Add logo support
      customDomain: null // TODO: Add custom domain support
    };
  }

  private async finalizeDeployment(
    deploymentId: string,
    endpoints: DeploymentEndpoints,
    instanceInfo: any
  ): Promise<void> {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.RUNNING,
        endpoints: endpoints as any,
        updatedAt: new Date()
      }
    });

    // Create initial system health record
    await prisma.systemHealth.create({
      data: {
        deploymentId,
        metricName: 'deployment_status',
        value: 1,
        status: 'healthy',
        metadata: {
          endpoints,
          instanceInfo
        }
      }
    });
  }
}