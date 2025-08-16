import { Compute } from '@google-cloud/compute';
import { Container } from '@google-cloud/container';
import { Storage } from '@google-cloud/storage';
import { logger } from '../../utils/logger';

export interface GCPConfig {
  projectId: string;
  credentials?: any;
  region: string;
}

export interface GCPInstance {
  id: string;
  name: string;
  status: string;
  machineType: string;
  region: string;
  zone: string;
  endpoint?: string;
  costPerHour: number;
}

export interface GCPGPUPricing {
  machineType: string;
  pricePerHour: number;
  region: string;
  gpuType: string;
  gpuCount: number;
  availability: 'high' | 'medium' | 'low';
}

export class GCPService {
  private compute: Compute;
  private container: Container;
  private storage: Storage;
  private projectId: string;
  private region: string;

  constructor(config?: GCPConfig) {
    this.projectId = config?.projectId || process.env.GCP_PROJECT_ID || '';
    this.region = config?.region || 'us-central1';

    if (!this.projectId) {
      throw new Error('GCP project ID is required');
    }

    const clientConfig = config?.credentials 
      ? { projectId: this.projectId, credentials: config.credentials }
      : { projectId: this.projectId };

    this.compute = new Compute(clientConfig);
    this.container = new Container(clientConfig);
    this.storage = new Storage(clientConfig);
  }

  async calculateCost(gpuType: string, gpuCount: number, region: string): Promise<number> {
    try {
      // GCP GPU pricing (as of 2024)
      const pricing: Record<string, Record<string, number>> = {
        'us-central1': {
          'nvidia-tesla-a100-40gb': 2.93,
          'nvidia-tesla-a100-80gb': 3.67,
          'nvidia-tesla-v100': 2.48,
          'nvidia-tesla-t4': 0.35,
          'nvidia-tesla-k80': 0.45,
          'nvidia-l4': 0.60,
        },
        'us-west1': {
          'nvidia-tesla-a100-40gb': 3.22,
          'nvidia-tesla-a100-80gb': 4.04,
          'nvidia-tesla-v100': 2.73,
          'nvidia-tesla-t4': 0.39,
          'nvidia-tesla-k80': 0.50,
          'nvidia-l4': 0.66,
        },
        'europe-west4': {
          'nvidia-tesla-a100-40gb': 3.52,
          'nvidia-tesla-a100-80gb': 4.40,
          'nvidia-tesla-v100': 2.98,
          'nvidia-tesla-t4': 0.42,
          'nvidia-tesla-k80': 0.54,
          'nvidia-l4': 0.72,
        }
      };

      const gcpGpuType = this.mapGpuTypeToGCP(gpuType);
      const regionPricing = pricing[region] || pricing['us-central1'];
      const gpuPricePerHour = regionPricing[gcpGpuType] || 3.67;

      // Add compute instance cost (rough estimate based on accompanying CPU/memory)
      const instanceCost = this.getInstanceCost(gpuType, region);
      const totalCost = (gpuPricePerHour * gpuCount) + instanceCost;

      logger.info('GCP cost calculated', {
        gpuType,
        gcpGpuType,
        gpuCount,
        region,
        gpuCost: gpuPricePerHour * gpuCount,
        instanceCost,
        totalCost
      });

      return totalCost;
    } catch (error) {
      logger.error('GCP cost calculation failed', { error, gpuType, gpuCount, region });
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
    const machineType = this.getMachineTypeForGPU(gpuType, gpuCount);
    const gcpGpuType = this.mapGpuTypeToGCP(gpuType);

    return {
      provider: {
        google: {
          project: this.projectId,
          region: region,
          credentials: '${var.gcp_credentials}'
        }
      },
      resources: {
        google_compute_network: {
          main: {
            name: `ai-platform-${deploymentId.substring(0, 8)}`,
            auto_create_subnetworks: false,
            delete_default_routes_on_create: false
          }
        },
        google_compute_subnetwork: {
          private: {
            name: `ai-platform-private-${deploymentId.substring(0, 8)}`,
            ip_cidr_range: '10.0.1.0/24',
            region: region,
            network: '${google_compute_network.main.id}',
            secondary_ip_range: [
              {
                range_name: 'services-range',
                ip_cidr_range: '192.168.1.0/24'
              },
              {
                range_name: 'pod-ranges',
                ip_cidr_range: '192.168.64.0/22'
              }
            ]
          }
        },
        google_container_cluster: {
          main: {
            name: `ai-platform-${deploymentId.substring(0, 8)}`,
            location: region,
            remove_default_node_pool: true,
            initial_node_count: 1,
            network: '${google_compute_network.main.name}',
            subnetwork: '${google_compute_subnetwork.private.name}',
            networking_mode: 'VPC_NATIVE',
            ip_allocation_policy: {
              cluster_secondary_range_name: 'pod-ranges',
              services_secondary_range_name: 'services-range'
            },
            private_cluster_config: {
              enable_private_nodes: true,
              enable_private_endpoint: false,
              master_ipv4_cidr_block: '172.16.0.0/28'
            },
            workload_identity_config: {
              workload_pool: `${this.projectId}.svc.id.goog`
            }
          }
        },
        google_container_node_pool: {
          gpu_nodes: {
            name: 'gpu-nodes',
            location: region,
            cluster: '${google_container_cluster.main.name}',
            initial_node_count: 1,
            autoscaling: {
              min_node_count: 1,
              max_node_count: 3
            },
            management: {
              auto_repair: true,
              auto_upgrade: true
            },
            node_config: {
              preemptible: false,
              machine_type: machineType,
              guest_accelerator: [
                {
                  type: gcpGpuType,
                  count: gpuCount,
                  gpu_partition_size: null
                }
              ],
              disk_size_gb: this.getDiskSize(modelSize),
              disk_type: 'pd-ssd',
              image_type: 'COS_CONTAINERD',
              oauth_scopes: [
                'https://www.googleapis.com/auth/cloud-platform'
              ],
              metadata: {
                'disable-legacy-endpoints': 'true'
              },
              labels: {
                'deployment-id': deploymentId,
                'gpu-type': gpuType.toLowerCase().replace(/[^a-z0-9]/g, '-')
              },
              tags: ['gpu-node', `deployment-${deploymentId.substring(0, 8)}`]
            }
          }
        },
        google_storage_bucket: {
          documents: {
            name: `ai-platform-${deploymentId}-documents`,
            location: this.getStorageLocation(region),
            uniform_bucket_level_access: true,
            versioning: {
              enabled: true
            },
            encryption: {
              default_kms_key_name: null
            },
            labels: {
              'deployment-id': deploymentId,
              'purpose': 'document-storage'
            }
          },
          models: {
            name: `ai-platform-${deploymentId}-models`,
            location: this.getStorageLocation(region),
            uniform_bucket_level_access: true,
            versioning: {
              enabled: true
            },
            labels: {
              'deployment-id': deploymentId,
              'purpose': 'model-storage'
            }
          }
        },
        google_storage_bucket_iam_policy: {
          documents: {
            bucket: '${google_storage_bucket.documents.name}',
            policy_data: '${data.google_iam_policy.bucket_policy.policy_data}'
          }
        }
      }
    };
  }

  async listAvailableRegions(): Promise<string[]> {
    try {
      const [regions] = await this.compute.getRegions();
      return regions.map(region => region.name || '').filter(Boolean);
    } catch (error) {
      logger.error('Failed to list GCP regions', { error });
      throw error;
    }
  }

  async listAvailableGPUs(region: string): Promise<GCPGPUPricing[]> {
    try {
      // GCP GPU types and pricing
      const gpus: GCPGPUPricing[] = [
        {
          machineType: 'a2-highgpu-1g',
          pricePerHour: 3.67,
          region,
          gpuType: 'A100-40GB',
          gpuCount: 1,
          availability: 'medium'
        },
        {
          machineType: 'a2-highgpu-2g',
          pricePerHour: 7.34,
          region,
          gpuType: 'A100-40GB',
          gpuCount: 2,
          availability: 'medium'
        },
        {
          machineType: 'a2-highgpu-4g',
          pricePerHour: 14.68,
          region,
          gpuType: 'A100-40GB',
          gpuCount: 4,
          availability: 'low'
        },
        {
          machineType: 'a2-highgpu-8g',
          pricePerHour: 29.36,
          region,
          gpuType: 'A100-40GB',
          gpuCount: 8,
          availability: 'low'
        },
        {
          machineType: 'n1-standard-4',
          pricePerHour: 2.83, // Base + 1 V100
          region,
          gpuType: 'V100',
          gpuCount: 1,
          availability: 'high'
        },
        {
          machineType: 'n1-standard-8',
          pricePerHour: 5.66, // Base + 2 V100
          region,
          gpuType: 'V100',
          gpuCount: 2,
          availability: 'high'
        },
        {
          machineType: 'n1-standard-4',
          pricePerHour: 0.54, // Base + 1 T4
          region,
          gpuType: 'T4',
          gpuCount: 1,
          availability: 'high'
        }
      ];

      return gpus;
    } catch (error) {
      logger.error('Failed to list GCP GPUs', { error, region });
      throw error;
    }
  }

  async createGKECluster(config: {
    name: string;
    region: string;
    deploymentId: string;
    machineType: string;
    gpuType: string;
    gpuCount: number;
  }): Promise<any> {
    try {
      const [operation] = await this.container.createCluster({
        parent: `projects/${this.projectId}/locations/${config.region}`,
        cluster: {
          name: config.name,
          initialNodeCount: 1,
          nodeConfig: {
            machineType: config.machineType,
            accelerators: [
              {
                acceleratorCount: config.gpuCount,
                acceleratorType: this.mapGpuTypeToGCP(config.gpuType)
              }
            ],
            diskSizeGb: 100,
            oauthScopes: [
              'https://www.googleapis.com/auth/cloud-platform'
            ]
          },
          locations: [`${config.region}-a`, `${config.region}-b`, `${config.region}-c`],
          network: 'default',
          subnetwork: 'default'
        }
      });

      logger.info('GCP GKE cluster creation started', { 
        clusterName: config.name, 
        operationName: operation.name 
      });

      return operation;
    } catch (error) {
      logger.error('GCP GKE cluster creation failed', { error, config });
      throw error;
    }
  }

  async deleteGKECluster(clusterName: string, region: string): Promise<void> {
    try {
      await this.container.deleteCluster({
        name: `projects/${this.projectId}/locations/${region}/clusters/${clusterName}`
      });
      logger.info('GCP GKE cluster deleted', { clusterName, region });
    } catch (error) {
      logger.error('GCP GKE cluster deletion failed', { error, clusterName, region });
      throw error;
    }
  }

  async getClusterStatus(clusterName: string, region: string): Promise<string> {
    try {
      const [cluster] = await this.container.getCluster({
        name: `projects/${this.projectId}/locations/${region}/clusters/${clusterName}`
      });
      return cluster.status || 'UNKNOWN';
    } catch (error) {
      logger.error('Failed to get GCP GKE cluster status', { error, clusterName, region });
      throw error;
    }
  }

  async createStorageBucket(bucketName: string, region: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      await bucket.create({
        location: this.getStorageLocation(region),
        uniformBucketLevelAccess: true,
        versioning: {
          enabled: true
        }
      });

      logger.info('GCP Storage bucket created', { bucketName, region });
    } catch (error) {
      logger.error('GCP Storage bucket creation failed', { error, bucketName, region });
      throw error;
    }
  }

  async deleteStorageBucket(bucketName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(bucketName);
      
      // Delete all objects first
      await bucket.deleteFiles();
      
      // Delete bucket
      await bucket.delete();
      
      logger.info('GCP Storage bucket deleted', { bucketName });
    } catch (error) {
      logger.error('GCP Storage bucket deletion failed', { error, bucketName });
      throw error;
    }
  }

  private mapGpuTypeToGCP(gpuType: string): string {
    const mapping: Record<string, string> = {
      'A100-40GB': 'nvidia-tesla-a100',
      'A100-80GB': 'nvidia-tesla-a100-80gb',
      'V100': 'nvidia-tesla-v100',
      'T4': 'nvidia-tesla-t4',
      'K80': 'nvidia-tesla-k80',
      'L4': 'nvidia-l4'
    };
    
    return mapping[gpuType] || 'nvidia-tesla-a100';
  }

  private getMachineTypeForGPU(gpuType: string, gpuCount: number): string {
    // A100 instances
    if (gpuType.includes('A100')) {
      switch (gpuCount) {
        case 1: return 'a2-highgpu-1g';
        case 2: return 'a2-highgpu-2g';
        case 4: return 'a2-highgpu-4g';
        case 8: return 'a2-highgpu-8g';
        default: return 'a2-highgpu-1g';
      }
    }
    
    // V100 and T4 instances
    if (gpuCount <= 2) {
      return 'n1-standard-4';
    } else if (gpuCount <= 4) {
      return 'n1-standard-8';
    } else {
      return 'n1-standard-16';
    }
  }

  private getInstanceCost(gpuType: string, region: string): number {
    // Rough estimate of the compute instance cost (CPU + memory)
    const baseCosts: Record<string, number> = {
      'us-central1': 0.30,
      'us-west1': 0.33,
      'europe-west4': 0.36
    };
    
    return baseCosts[region] || baseCosts['us-central1'];
  }

  private getDiskSize(modelSize: string): number {
    const sizes: Record<string, number> = {
      '8b': 100,
      '70b': 500,
      '405b': 2000
    };
    
    return sizes[modelSize] || 500;
  }

  private getStorageLocation(region: string): string {
    // Map compute regions to storage locations
    const mapping: Record<string, string> = {
      'us-central1': 'US-CENTRAL1',
      'us-west1': 'US-WEST1',
      'us-east1': 'US-EAST1',
      'europe-west1': 'EUROPE-WEST1',
      'europe-west4': 'EUROPE-WEST4',
      'asia-southeast1': 'ASIA-SOUTHEAST1'
    };
    
    return mapping[region] || 'US-CENTRAL1';
  }
}