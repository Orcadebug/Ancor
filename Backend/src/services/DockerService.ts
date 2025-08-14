import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/utils/logger.js';
import { Industry } from '@/types/index.js';

const execAsync = promisify(exec);

interface ContainerConfig {
  instanceId: string;
  image: string;
  name: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  command?: string;
}

export class DockerService {
  
  /**
   * Deploy LLM container with vLLM and quantized model
   */
  async deployLLMContainer(config: {
    instanceId: string;
    modelId: string;
    quantization: boolean;
  }): Promise<string> {
    try {
      logger.info(`Deploying LLM container for instance ${config.instanceId}`);

      const modelName = await this.getModelName(config.modelId);
      const containerName = `llm-${config.instanceId}`;
      
      const containerConfig: ContainerConfig = {
        instanceId: config.instanceId,
        image: 'vllm/vllm-openai:latest',
        name: containerName,
        ports: ['8000:8000'],
        environment: {
          'MODEL_NAME': modelName,
          'QUANTIZATION': config.quantization ? 'awq' : 'none',
          'GPU_MEMORY_UTILIZATION': '0.85',
          'MAX_MODEL_LEN': '4096',
          'TENSOR_PARALLEL_SIZE': '2'
        },
        volumes: [
          '/models:/models:ro',
          '/cache:/cache'
        ],
        command: `--model ${modelName} --port 8000 --host 0.0.0.0`
      };

      await this.deployContainer(containerConfig);
      
      // Wait for model to load
      await this.waitForContainerHealthy(containerName, 600000); // 10 minutes
      
      const endpoint = `http://${config.instanceId}:8000`;
      logger.info(`LLM container deployed successfully at ${endpoint}`);
      
      return endpoint;

    } catch (error) {
      logger.error('Failed to deploy LLM container:', error);
      throw error;
    }
  }

  /**
   * Deploy ChromaDB vector database
   */
  async deployChromaDB(config: {
    instanceId: string;
    persistentStorage: boolean;
  }): Promise<string> {
    try {
      logger.info(`Deploying ChromaDB for instance ${config.instanceId}`);

      const containerName = `chromadb-${config.instanceId}`;
      
      const containerConfig: ContainerConfig = {
        instanceId: config.instanceId,
        image: 'chromadb/chroma:latest',
        name: containerName,
        ports: ['8001:8000'],
        environment: {
          'CHROMA_SERVER_HOST': '0.0.0.0',
          'CHROMA_SERVER_HTTP_PORT': '8000',
          'IS_PERSISTENT': config.persistentStorage ? 'TRUE' : 'FALSE',
          'PERSIST_DIRECTORY': '/chroma/data'
        },
        volumes: config.persistentStorage ? ['/chroma-data:/chroma/data'] : []
      };

      await this.deployContainer(containerConfig);
      await this.waitForContainerHealthy(containerName);
      
      const endpoint = `http://${config.instanceId}:8001`;
      logger.info(`ChromaDB deployed successfully at ${endpoint}`);
      
      return endpoint;

    } catch (error) {
      logger.error('Failed to deploy ChromaDB:', error);
      throw error;
    }
  }

  /**
   * Deploy RAG pipeline with LlamaIndex
   */
  async deployRAGPipeline(config: {
    instanceId: string;
    chromaEndpoint: string;
    industry: Industry;
    useCase: string;
  }): Promise<string> {
    try {
      logger.info(`Deploying RAG pipeline for instance ${config.instanceId}`);

      const containerName = `rag-pipeline-${config.instanceId}`;
      
      const containerConfig: ContainerConfig = {
        instanceId: config.instanceId,
        image: 'ancor/rag-pipeline:latest', // Custom image with LlamaIndex
        name: containerName,
        ports: ['8002:8000'],
        environment: {
          'CHROMA_ENDPOINT': config.chromaEndpoint,
          'LLM_ENDPOINT': `http://${config.instanceId}:8000`,
          'INDUSTRY': config.industry,
          'USE_CASE': config.useCase,
          'CHUNK_SIZE': '1024',
          'CHUNK_OVERLAP': '200',
          'EMBEDDING_MODEL': 'sentence-transformers/all-MiniLM-L6-v2'
        },
        volumes: [
          '/rag-config:/app/config',
          '/documents:/app/documents'
        ]
      };

      await this.deployContainer(containerConfig);
      await this.waitForContainerHealthy(containerName);
      
      const endpoint = `http://${config.instanceId}:8002`;
      logger.info(`RAG pipeline deployed successfully at ${endpoint}`);
      
      return endpoint;

    } catch (error) {
      logger.error('Failed to deploy RAG pipeline:', error);
      throw error;
    }
  }

  /**
   * Deploy Streamlit chat interface
   */
  async deployStreamlitUI(config: {
    instanceId: string;
    ragEndpoint: string;
    organizationName: string;
    branding: any;
  }): Promise<string> {
    try {
      logger.info(`Deploying Streamlit UI for instance ${config.instanceId}`);

      const containerName = `streamlit-${config.instanceId}`;
      
      const containerConfig: ContainerConfig = {
        instanceId: config.instanceId,
        image: 'ancor/streamlit-chat:latest', // Custom Streamlit app
        name: containerName,
        ports: ['8003:8501'],
        environment: {
          'RAG_ENDPOINT': config.ragEndpoint,
          'ORGANIZATION_NAME': config.organizationName,
          'PRIMARY_COLOR': config.branding.primaryColor || '#2563eb',
          'STREAMLIT_SERVER_PORT': '8501',
          'STREAMLIT_SERVER_ADDRESS': '0.0.0.0'
        },
        volumes: [
          '/streamlit-config:/app/.streamlit',
          '/branding:/app/branding'
        ]
      };

      await this.deployContainer(containerConfig);
      await this.waitForContainerHealthy(containerName);
      
      const endpoint = `http://${config.instanceId}:8003`;
      logger.info(`Streamlit UI deployed successfully at ${endpoint}`);
      
      return endpoint;

    } catch (error) {
      logger.error('Failed to deploy Streamlit UI:', error);
      throw error;
    }
  }

  /**
   * Stop all containers for a deployment
   */
  async stopAllContainers(deploymentId: string): Promise<void> {
    try {
      logger.info(`Stopping all containers for deployment ${deploymentId}`);

      const containerNames = [
        `llm-${deploymentId}`,
        `chromadb-${deploymentId}`,
        `rag-pipeline-${deploymentId}`,
        `streamlit-${deploymentId}`
      ];

      await Promise.all(
        containerNames.map(name => this.stopContainer(name))
      );

      logger.info(`All containers stopped for deployment ${deploymentId}`);

    } catch (error) {
      logger.error(`Failed to stop containers for deployment ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Check container health
   */
  async checkContainerHealth(deploymentId: string, service: string): Promise<any> {
    try {
      const containerName = `${service}-${deploymentId}`;
      
      const { stdout } = await execAsync(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
      );
      
      const healthStatus = stdout.trim();
      
      return {
        containerName,
        service,
        status: healthStatus === 'healthy' ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        containerName: `${service}-${deploymentId}`,
        service,
        status: 'not_found',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(deploymentId: string, service: string, lines = 100): Promise<string> {
    try {
      const containerName = `${service}-${deploymentId}`;
      
      const { stdout } = await execAsync(
        `docker logs --tail ${lines} ${containerName}`
      );
      
      return stdout;

    } catch (error) {
      logger.error(`Failed to get logs for ${service}-${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async deployContainer(config: ContainerConfig): Promise<void> {
    try {
      // Build docker run command
      let dockerCommand = `docker run -d --name ${config.name} --restart unless-stopped`;
      
      // Add ports
      config.ports.forEach(port => {
        dockerCommand += ` -p ${port}`;
      });
      
      // Add environment variables
      Object.entries(config.environment).forEach(([key, value]) => {
        dockerCommand += ` -e ${key}="${value}"`;
      });
      
      // Add volumes
      config.volumes.forEach(volume => {
        dockerCommand += ` -v ${volume}`;
      });
      
      // Add GPU support for LLM containers
      if (config.name.includes('llm')) {
        dockerCommand += ' --gpus all';
      }
      
      // Add image and command
      dockerCommand += ` ${config.image}`;
      if (config.command) {
        dockerCommand += ` ${config.command}`;
      }

      logger.info(`Executing: ${dockerCommand}`);
      
      const { stdout, stderr } = await execAsync(dockerCommand);
      
      if (stderr && !stderr.includes('WARNING')) {
        logger.warn(`Docker deployment warning: ${stderr}`);
      }
      
      logger.info(`Container ${config.name} deployed successfully`);

    } catch (error) {
      logger.error(`Failed to deploy container ${config.name}:`, error);
      throw error;
    }
  }

  private async stopContainer(containerName: string): Promise<void> {
    try {
      await execAsync(`docker stop ${containerName}`);
      await execAsync(`docker rm ${containerName}`);
      logger.info(`Container ${containerName} stopped and removed`);

    } catch (error) {
      logger.warn(`Failed to stop container ${containerName}:`, error.message);
      // Don't throw error, just log warning
    }
  }

  private async waitForContainerHealthy(
    containerName: string, 
    maxWaitTime = 120000
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const { stdout } = await execAsync(
          `docker inspect --format='{{.State.Status}}' ${containerName}`
        );
        
        const status = stdout.trim();
        
        if (status === 'running') {
          // Check if container has health check
          try {
            const { stdout: healthOutput } = await execAsync(
              `docker inspect --format='{{.State.Health.Status}}' ${containerName}`
            );
            
            const healthStatus = healthOutput.trim();
            if (healthStatus === 'healthy' || healthStatus === '<no value>') {
              logger.info(`Container ${containerName} is healthy`);
              return;
            }
          } catch {
            // No health check defined, assume healthy if running
            logger.info(`Container ${containerName} is running (no health check)`);
            return;
          }
        }

        if (status === 'exited') {
          throw new Error(`Container ${containerName} exited unexpectedly`);
        }

        logger.info(`Container ${containerName} status: ${status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error.message.includes('No such container')) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Container ${containerName} did not become healthy within ${maxWaitTime / 1000} seconds`);
  }

  private async getModelName(modelId: string): Promise<string> {
    // Map model IDs to actual model names/paths
    const modelMap: Record<string, string> = {
      'llama-3-8b': 'meta-llama/Llama-3-8B-Instruct',
      'llama-3-70b': 'meta-llama/Llama-3-70B-Instruct',
      'llama-3-405b': 'meta-llama/Llama-3-405B-Instruct'
    };

    return modelMap[modelId] || 'meta-llama/Llama-3-70B-Instruct';
  }
}