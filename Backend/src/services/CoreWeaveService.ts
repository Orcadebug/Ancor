import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger.js';
import { Region, ComplianceType, InfrastructureConfig } from '@/types/index.js';

interface GPUInstanceConfig {
  region: Region;
  modelSize: string; // "8B", "70B", "405B"
  compliance: ComplianceType;
}

interface GPUInstance {
  id: string;
  status: string;
  ipAddress: string;
  gpuType: string;
  gpuCount: number;
  memoryGB: number;
  region: string;
  endpoints: {
    ssh: string;
    api: string;
  };
}

export class CoreWeaveService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COREWEAVE_API_KEY!;
    
    if (!this.apiKey) {
      throw new Error('CoreWeave API key not configured');
    }

    this.client = axios.create({
      baseURL: process.env.COREWEAVE_API_URL || 'https://api.coreweave.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Provision GPU instance optimized for AI model deployment
   */
  async provisionGPUInstance(config: GPUInstanceConfig): Promise<GPUInstance> {
    try {
      logger.info(`Provisioning GPU instance for ${config.modelSize} model in ${config.region}`);

      const instanceSpec = this.getOptimalInstanceSpec(config.modelSize);
      
      const requestPayload = {
        region: this.mapRegion(config.region),
        instanceType: instanceSpec.instanceType,
        gpuType: instanceSpec.gpuType,
        gpuCount: instanceSpec.gpuCount,
        cpu: instanceSpec.cpu,
        memory: instanceSpec.memory,
        storage: instanceSpec.storage,
        network: instanceSpec.network,
        compliance: this.mapComplianceSettings(config.compliance),
        tags: {
          purpose: 'ai-document-processing',
          modelSize: config.modelSize,
          compliance: config.compliance,
          managedBy: 'ancor-platform'
        }
      };

      const response = await this.client.post('/compute/instances', requestPayload);
      
      const instance = response.data;
      
      // Wait for instance to be ready
      await this.waitForInstanceReady(instance.id);
      
      logger.info(`GPU instance ${instance.id} provisioned successfully`);
      
      return {
        id: instance.id,
        status: instance.status,
        ipAddress: instance.ipAddress,
        gpuType: instance.gpuType,
        gpuCount: instance.gpuCount,
        memoryGB: instance.memoryGB,
        region: instance.region,
        endpoints: {
          ssh: `ssh://core@${instance.ipAddress}:22`,
          api: `https://${instance.ipAddress}:8000`
        }
      };

    } catch (error) {
      logger.error('Failed to provision GPU instance:', error);
      throw new Error(`CoreWeave provisioning failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Scale existing GPU instance
   */
  async scaleInstance(deploymentId: string, newConfig: InfrastructureConfig): Promise<void> {
    try {
      logger.info(`Scaling instance for deployment ${deploymentId}`);

      const response = await this.client.patch(`/compute/instances/${deploymentId}/scale`, {
        gpuCount: newConfig.gpuCount,
        memory: `${newConfig.memoryGB}Gi`,
        storage: `${newConfig.storageGB}Gi`
      });

      logger.info(`Instance ${deploymentId} scaled successfully`);

    } catch (error) {
      logger.error(`Failed to scale instance ${deploymentId}:`, error);
      throw error;
    }
  }

  /**
   * Terminate GPU instance
   */
  async terminateInstance(instanceId: string): Promise<void> {
    try {
      logger.info(`Terminating instance ${instanceId}`);

      await this.client.delete(`/compute/instances/${instanceId}`);
      
      logger.info(`Instance ${instanceId} terminated successfully`);

    } catch (error) {
      logger.error(`Failed to terminate instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Get instance status and metrics
   */
  async getInstanceMetrics(instanceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/compute/instances/${instanceId}/metrics`);
      return response.data;

    } catch (error) {
      logger.error(`Failed to get metrics for instance ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * List all instances for the account
   */
  async listInstances(): Promise<any[]> {
    try {
      const response = await this.client.get('/compute/instances');
      return response.data.instances || [];

    } catch (error) {
      logger.error('Failed to list instances:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private getOptimalInstanceSpec(modelSize: string) {
    const specs = {
      '8B': {
        instanceType: 'gpu.a40.1x',
        gpuType: 'A40',
        gpuCount: 1,
        cpu: '8',
        memory: '32Gi',
        storage: '100Gi',
        network: '10Gbps'
      },
      '70B': {
        instanceType: 'gpu.a100.2x',
        gpuType: 'A100-80GB',
        gpuCount: 2,
        cpu: '16',
        memory: '128Gi',
        storage: '500Gi',
        network: '100Gbps'
      },
      '405B': {
        instanceType: 'gpu.a100.4x',
        gpuType: 'A100-80GB',
        gpuCount: 4,
        cpu: '32',
        memory: '256Gi',
        storage: '1Ti',
        network: '200Gbps'
      }
    };

    return specs[modelSize as keyof typeof specs] || specs['70B'];
  }

  private mapRegion(region: Region): string {
    const regionMap = {
      [Region.US_EAST]: 'us-east-1',
      [Region.US_WEST]: 'us-west-2',
      [Region.EU_CENTRAL]: 'eu-central-1'
    };

    return regionMap[region] || 'us-east-1';
  }

  private mapComplianceSettings(compliance: ComplianceType) {
    const settings = {
      [ComplianceType.SOC2]: {
        encryption: 'aes-256',
        logging: 'enhanced',
        networkIsolation: true,
        accessControls: 'strict'
      },
      [ComplianceType.HIPAA]: {
        encryption: 'fips-140-2',
        logging: 'comprehensive',
        networkIsolation: true,
        accessControls: 'hipaa-compliant',
        auditLogging: true
      },
      [ComplianceType.LEGAL]: {
        encryption: 'aes-256',
        logging: 'legal-grade',
        networkIsolation: true,
        accessControls: 'attorney-client-privilege',
        dataResidency: 'required'
      },
      [ComplianceType.GDPR]: {
        encryption: 'aes-256',
        logging: 'gdpr-compliant',
        networkIsolation: true,
        accessControls: 'gdpr-strict',
        dataResidency: 'eu-only',
        rightToErasure: true
      }
    };

    return settings[compliance] || settings[ComplianceType.SOC2];
  }

  private async waitForInstanceReady(instanceId: string, maxWaitTime = 600000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await this.client.get(`/compute/instances/${instanceId}`);
        const status = response.data.status;

        if (status === 'running') {
          logger.info(`Instance ${instanceId} is ready`);
          return;
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(`Instance ${instanceId} failed to start: ${response.data.error}`);
        }

        logger.info(`Instance ${instanceId} status: ${status}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (error.response?.status === 404) {
          // Instance not found yet, continue waiting
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }

    throw new Error(`Instance ${instanceId} did not become ready within ${maxWaitTime / 1000} seconds`);
  }

  /**
   * Get current pricing for different instance types
   */
  async getPricingInfo(): Promise<any> {
    try {
      const response = await this.client.get('/pricing/compute');
      return response.data;

    } catch (error) {
      logger.error('Failed to get pricing info:', error);
      // Return default pricing if API fails
      return {
        'gpu.a40.1x': { hourly: 0.80, monthly: 576 },
        'gpu.a100.2x': { hourly: 3.20, monthly: 2304 },
        'gpu.a100.4x': { hourly: 6.40, monthly: 4608 }
      };
    }
  }
}