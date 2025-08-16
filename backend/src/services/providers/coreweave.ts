import axios from 'axios';
import { logger } from '../../utils/logger';

export interface CoreWeaveConfig {
  apiKey: string;
  orgId?: string;
  region: string;
}

export interface CoreWeaveInstance {
  id: string;
  name: string;
  status: string;
  gpuType: string;
  gpuCount: number;
  region: string;
  endpoint?: string;
  costPerHour: number;
}

export interface CoreWeaveGPUPricing {
  gpuType: string;
  pricePerHour: number;
  region: string;
  availability: 'high' | 'medium' | 'low';
}

export class CoreWeaveService {
  private apiKey: string;
  private orgId?: string;
  private baseURL: string;

  constructor(config?: CoreWeaveConfig) {
    this.apiKey = config?.apiKey || process.env.COREWEAVE_API_KEY || '';
    this.orgId = config?.orgId || process.env.COREWEAVE_ORG_ID;
    this.baseURL = 'https://api.coreweave.com/v1';
    
    if (!this.apiKey) {
      throw new Error('CoreWeave API key is required');
    }
  }

  async calculateCost(gpuType: string, gpuCount: number, region: string): Promise<number> {
    try {
      // CoreWeave pricing (as of 2024)
      const pricing: Record<string, number> = {
        'A100-40GB': 1.60,
        'A100-80GB': 2.20,
        'A40': 1.20,
        'RTX-A6000': 0.80,
        'H100': 4.00,
        'H100-80GB': 4.50,
      };

      const basePrice = pricing[gpuType] || pricing['A100-80GB'];
      const totalCost = basePrice * gpuCount;

      // Apply regional pricing adjustments
      const regionMultiplier = this.getRegionMultiplier(region);
      
      logger.info('CoreWeave cost calculated', {
        gpuType,
        gpuCount,
        region,
        basePrice,
        totalCost: totalCost * regionMultiplier
      });

      return totalCost * regionMultiplier;
    } catch (error) {
      logger.error('CoreWeave cost calculation failed', { error, gpuType, gpuCount, region });
      throw error;
    }
  }

  async generateTerraformConfig(params: {
    region: string;
    gpuType: string;
    gpuCount: number;
    modelSize: string;
    deploymentId: string;
  }): Promise<any> {
    const { region, gpuType, gpuCount, modelSize, deploymentId } = params;

    return {
      provider: {
        coreweave: {
          api_key: this.apiKey,
          org_id: this.orgId,
          region: region
        }
      },
      resources: {
        coreweave_instance: {
          main: {
            name: `ai-platform-${deploymentId.substring(0, 8)}`,
            gpu_type: gpuType,
            gpu_count: gpuCount,
            region: region,
            disk_size: this.getStorageSize(modelSize),
            image: 'ubuntu-20.04-cuda-11.8',
            instance_type: this.getInstanceType(gpuType, gpuCount),
            tags: {
              deployment_id: deploymentId,
              managed_by: 'ai-platform',
              model_size: modelSize
            }
          }
        },
        coreweave_storage: {
          documents: {
            name: `ai-platform-${deploymentId}-docs`,
            size: '1000Gi',
            storage_class: 'ssd',
            region: region
          },
          models: {
            name: `ai-platform-${deploymentId}-models`,
            size: this.getModelStorageSize(modelSize),
            storage_class: 'ssd',
            region: region
          }
        }
      }
    };
  }

  async listAvailableRegions(): Promise<string[]> {
    try {
      // CoreWeave available regions
      return [
        'ord1', // Chicago
        'las1', // Las Vegas
        'lga1', // New York
        'ewr1', // Newark
      ];
    } catch (error) {
      logger.error('Failed to list CoreWeave regions', { error });
      throw error;
    }
  }

  async listAvailableGPUs(region: string): Promise<CoreWeaveGPUPricing[]> {
    try {
      // CoreWeave GPU availability and pricing
      const gpus: CoreWeaveGPUPricing[] = [
        {
          gpuType: 'A100-40GB',
          pricePerHour: 1.60,
          region,
          availability: 'high'
        },
        {
          gpuType: 'A100-80GB',
          pricePerHour: 2.20,
          region,
          availability: 'high'
        },
        {
          gpuType: 'A40',
          pricePerHour: 1.20,
          region,
          availability: 'high'
        },
        {
          gpuType: 'RTX-A6000',
          pricePerHour: 0.80,
          region,
          availability: 'medium'
        },
        {
          gpuType: 'H100',
          pricePerHour: 4.00,
          region,
          availability: 'medium'
        },
        {
          gpuType: 'H100-80GB',
          pricePerHour: 4.50,
          region,
          availability: 'low'
        }
      ];

      return gpus;
    } catch (error) {
      logger.error('Failed to list CoreWeave GPUs', { error, region });
      throw error;
    }
  }

  async createInstance(config: {
    name: string;
    gpuType: string;
    gpuCount: number;
    region: string;
    deploymentId: string;
  }): Promise<CoreWeaveInstance> {
    try {
      const response = await axios.post(
        `${this.baseURL}/instances`,
        {
          name: config.name,
          gpu_type: config.gpuType,
          gpu_count: config.gpuCount,
          region: config.region,
          image: 'ubuntu-20.04-cuda-11.8',
          instance_type: this.getInstanceType(config.gpuType, config.gpuCount),
          disk_size: 100,
          metadata: {
            deployment_id: config.deploymentId,
            managed_by: 'ai-platform'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const instance: CoreWeaveInstance = {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        gpuType: config.gpuType,
        gpuCount: config.gpuCount,
        region: config.region,
        endpoint: response.data.public_ip ? `http://${response.data.public_ip}` : undefined,
        costPerHour: await this.calculateCost(config.gpuType, config.gpuCount, config.region)
      };

      logger.info('CoreWeave instance created', { instanceId: instance.id, config });
      return instance;
    } catch (error) {
      logger.error('CoreWeave instance creation failed', { error, config });
      throw error;
    }
  }

  async getInstance(instanceId: string): Promise<CoreWeaveInstance | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/instances/${instanceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        id: response.data.id,
        name: response.data.name,
        status: response.data.status,
        gpuType: response.data.gpu_type,
        gpuCount: response.data.gpu_count,
        region: response.data.region,
        endpoint: response.data.public_ip ? `http://${response.data.public_ip}` : undefined,
        costPerHour: response.data.cost_per_hour || 0
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get CoreWeave instance', { error, instanceId });
      throw error;
    }
  }

  async deleteInstance(instanceId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/instances/${instanceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      logger.info('CoreWeave instance deleted', { instanceId });
    } catch (error) {
      logger.error('CoreWeave instance deletion failed', { error, instanceId });
      throw error;
    }
  }

  async getInstanceLogs(instanceId: string, lines: number = 100): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/instances/${instanceId}/logs`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: { lines }
        }
      );

      return response.data.logs || [];
    } catch (error) {
      logger.error('Failed to get CoreWeave instance logs', { error, instanceId });
      throw error;
    }
  }

  async getInstanceMetrics(instanceId: string, timeRange: string = '1h'): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/instances/${instanceId}/metrics`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          params: { time_range: timeRange }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to get CoreWeave instance metrics', { error, instanceId });
      throw error;
    }
  }

  private getRegionMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      'ord1': 1.0,  // Chicago - base price
      'las1': 1.05, // Las Vegas
      'lga1': 1.1,  // New York
      'ewr1': 1.08, // Newark
    };
    
    return multipliers[region] || 1.0;
  }

  private getInstanceType(gpuType: string, gpuCount: number): string {
    // Map GPU types to CoreWeave instance types
    const baseTypes: Record<string, string> = {
      'A100-40GB': 'gpu.a100.40gb',
      'A100-80GB': 'gpu.a100.80gb',
      'A40': 'gpu.a40',
      'RTX-A6000': 'gpu.rtx-a6000',
      'H100': 'gpu.h100',
      'H100-80GB': 'gpu.h100.80gb'
    };

    const baseType = baseTypes[gpuType] || baseTypes['A100-80GB'];
    return gpuCount > 1 ? `${baseType}.${gpuCount}x` : baseType;
  }

  private getStorageSize(modelSize: string): string {
    const sizes: Record<string, string> = {
      '8b': '100Gi',
      '70b': '500Gi',
      '405b': '2000Gi'
    };
    
    return sizes[modelSize] || sizes['70b'];
  }

  private getModelStorageSize(modelSize: string): string {
    const sizes: Record<string, string> = {
      '8b': '50Gi',
      '70b': '200Gi',
      '405b': '1000Gi'
    };
    
    return sizes[modelSize] || sizes['70b'];
  }
}