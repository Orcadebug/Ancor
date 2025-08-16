import AWS from 'aws-sdk';
import { logger } from '../../utils/logger';

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface AWSInstance {
  id: string;
  name: string;
  status: string;
  instanceType: string;
  region: string;
  endpoint?: string;
  costPerHour: number;
}

export interface AWSGPUPricing {
  instanceType: string;
  pricePerHour: number;
  region: string;
  gpuType: string;
  gpuCount: number;
  availability: 'high' | 'medium' | 'low';
}

export class AWSService {
  private ec2: AWS.EC2;
  private eks: AWS.EKS;
  private s3: AWS.S3;
  private region: string;

  constructor(config?: AWSConfig) {
    const awsConfig = {
      accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
      region: config?.region || process.env.AWS_REGION || 'us-east-1'
    };

    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
      throw new Error('AWS credentials are required');
    }

    AWS.config.update(awsConfig);
    
    this.ec2 = new AWS.EC2();
    this.eks = new AWS.EKS();
    this.s3 = new AWS.S3();
    this.region = awsConfig.region;
  }

  async calculateCost(gpuType: string, gpuCount: number, region: string): Promise<number> {
    try {
      // AWS GPU instance pricing (as of 2024)
      const pricing: Record<string, Record<string, number>> = {
        'us-east-1': {
          'p4d.24xlarge': 32.77,   // 8x A100 40GB
          'p4de.24xlarge': 40.97,  // 8x A100 80GB
          'p3.2xlarge': 3.06,      // 1x V100
          'p3.8xlarge': 12.24,     // 4x V100
          'p3.16xlarge': 24.48,    // 8x V100
          'g5.xlarge': 1.006,      // 1x A10G
          'g5.12xlarge': 5.672,    // 4x A10G
          'g5.48xlarge': 16.288,   // 8x A10G
        },
        'us-west-2': {
          'p4d.24xlarge': 32.77,
          'p4de.24xlarge': 40.97,
          'p3.2xlarge': 3.06,
          'p3.8xlarge': 12.24,
          'p3.16xlarge': 24.48,
          'g5.xlarge': 1.006,
          'g5.12xlarge': 5.672,
          'g5.48xlarge': 16.288,
        }
      };

      const instanceType = this.getInstanceTypeForGPU(gpuType, gpuCount);
      const regionPricing = pricing[region] || pricing['us-east-1'];
      const hourlyRate = regionPricing[instanceType] || 32.77;

      logger.info('AWS cost calculated', {
        gpuType,
        gpuCount,
        region,
        instanceType,
        hourlyRate
      });

      return hourlyRate;
    } catch (error) {
      logger.error('AWS cost calculation failed', { error, gpuType, gpuCount, region });
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
    const instanceType = this.getInstanceTypeForGPU(gpuType, gpuCount);

    return {
      provider: {
        aws: {
          region: region,
          access_key: '${var.aws_access_key_id}',
          secret_key: '${var.aws_secret_access_key}'
        }
      },
      resources: {
        aws_vpc: {
          main: {
            cidr_block: '10.0.0.0/16',
            enable_dns_hostnames: true,
            enable_dns_support: true,
            tags: {
              Name: `ai-platform-${deploymentId.substring(0, 8)}`,
              DeploymentId: deploymentId
            }
          }
        },
        aws_subnet: {
          private: {
            count: 3,
            vpc_id: '${aws_vpc.main.id}',
            cidr_block: '10.0.${count.index + 1}.0/24',
            availability_zone: `${region}${['a', 'b', 'c'][0]}`,
            tags: {
              Name: `ai-platform-private-${deploymentId.substring(0, 8)}-${region}a`,
              Type: 'private'
            }
          },
          public: {
            count: 3,
            vpc_id: '${aws_vpc.main.id}',
            cidr_block: '10.0.${count.index + 101}.0/24',
            availability_zone: `${region}${['a', 'b', 'c'][0]}`,
            map_public_ip_on_launch: true,
            tags: {
              Name: `ai-platform-public-${deploymentId.substring(0, 8)}-${region}a`,
              Type: 'public'
            }
          }
        },
        aws_eks_cluster: {
          main: {
            name: `ai-platform-${deploymentId.substring(0, 8)}`,
            role_arn: '${aws_iam_role.eks_cluster.arn}',
            version: '1.28',
            vpc_config: {
              subnet_ids: '${aws_subnet.private[*].id}',
              endpoint_private_access: true,
              endpoint_public_access: true
            },
            depends_on: ['aws_iam_role_policy_attachment.eks_cluster_policy']
          }
        },
        aws_eks_node_group: {
          gpu_nodes: {
            cluster_name: '${aws_eks_cluster.main.name}',
            node_group_name: 'gpu-nodes',
            node_role_arn: '${aws_iam_role.eks_node_group.arn}',
            subnet_ids: '${aws_subnet.private[*].id}',
            instance_types: [instanceType],
            scaling_config: {
              desired_size: 1,
              max_size: 3,
              min_size: 1
            },
            update_config: {
              max_unavailable: 1
            },
            remote_access: {
              ec2_ssh_key: '${aws_key_pair.main.key_name}'
            },
            tags: {
              Name: `ai-platform-gpu-${deploymentId.substring(0, 8)}`,
              DeploymentId: deploymentId
            },
            depends_on: [
              'aws_iam_role_policy_attachment.eks_worker_node_policy',
              'aws_iam_role_policy_attachment.eks_cni_policy',
              'aws_iam_role_policy_attachment.eks_container_registry_policy'
            ]
          }
        },
        aws_s3_bucket: {
          documents: {
            bucket: `ai-platform-${deploymentId}-documents`,
            tags: {
              DeploymentId: deploymentId,
              Purpose: 'document-storage'
            }
          },
          models: {
            bucket: `ai-platform-${deploymentId}-models`,
            tags: {
              DeploymentId: deploymentId,
              Purpose: 'model-storage'
            }
          }
        },
        aws_s3_bucket_versioning: {
          documents: {
            bucket: '${aws_s3_bucket.documents.id}',
            versioning_configuration: {
              status: 'Enabled'
            }
          }
        },
        aws_s3_bucket_server_side_encryption_configuration: {
          documents: {
            bucket: '${aws_s3_bucket.documents.id}',
            rule: {
              apply_server_side_encryption_by_default: {
                sse_algorithm: 'AES256'
              }
            }
          },
          models: {
            bucket: '${aws_s3_bucket.models.id}',
            rule: {
              apply_server_side_encryption_by_default: {
                sse_algorithm: 'AES256'
              }
            }
          }
        }
      }
    };
  }

  async listAvailableRegions(): Promise<string[]> {
    try {
      const response = await this.ec2.describeRegions().promise();
      return response.Regions?.map(region => region.RegionName || '') || [];
    } catch (error) {
      logger.error('Failed to list AWS regions', { error });
      throw error;
    }
  }

  async listAvailableGPUs(region: string): Promise<AWSGPUPricing[]> {
    try {
      // AWS GPU instance types and pricing
      const gpus: AWSGPUPricing[] = [
        {
          instanceType: 'p4d.24xlarge',
          pricePerHour: 32.77,
          region,
          gpuType: 'A100-40GB',
          gpuCount: 8,
          availability: 'high'
        },
        {
          instanceType: 'p4de.24xlarge',
          pricePerHour: 40.97,
          region,
          gpuType: 'A100-80GB',
          gpuCount: 8,
          availability: 'medium'
        },
        {
          instanceType: 'p3.2xlarge',
          pricePerHour: 3.06,
          region,
          gpuType: 'V100',
          gpuCount: 1,
          availability: 'high'
        },
        {
          instanceType: 'p3.8xlarge',
          pricePerHour: 12.24,
          region,
          gpuType: 'V100',
          gpuCount: 4,
          availability: 'high'
        },
        {
          instanceType: 'g5.xlarge',
          pricePerHour: 1.006,
          region,
          gpuType: 'A10G',
          gpuCount: 1,
          availability: 'high'
        },
        {
          instanceType: 'g5.12xlarge',
          pricePerHour: 5.672,
          region,
          gpuType: 'A10G',
          gpuCount: 4,
          availability: 'high'
        }
      ];

      return gpus;
    } catch (error) {
      logger.error('Failed to list AWS GPUs', { error, region });
      throw error;
    }
  }

  async createEKSCluster(config: {
    name: string;
    region: string;
    deploymentId: string;
    instanceType: string;
  }): Promise<any> {
    try {
      const clusterParams: AWS.EKS.CreateClusterRequest = {
        name: config.name,
        version: '1.28',
        roleArn: await this.getOrCreateEKSServiceRole(),
        resourcesVpcConfig: {
          subnetIds: await this.getSubnetIds(config.region)
        },
        tags: {
          DeploymentId: config.deploymentId,
          ManagedBy: 'ai-platform'
        }
      };

      const response = await this.eks.createCluster(clusterParams).promise();
      
      logger.info('AWS EKS cluster created', { 
        clusterName: config.name, 
        clusterArn: response.cluster?.arn 
      });

      return response.cluster;
    } catch (error) {
      logger.error('AWS EKS cluster creation failed', { error, config });
      throw error;
    }
  }

  async deleteEKSCluster(clusterName: string): Promise<void> {
    try {
      await this.eks.deleteCluster({ name: clusterName }).promise();
      logger.info('AWS EKS cluster deleted', { clusterName });
    } catch (error) {
      logger.error('AWS EKS cluster deletion failed', { error, clusterName });
      throw error;
    }
  }

  async getClusterStatus(clusterName: string): Promise<string> {
    try {
      const response = await this.eks.describeCluster({ name: clusterName }).promise();
      return response.cluster?.status || 'UNKNOWN';
    } catch (error) {
      logger.error('Failed to get AWS EKS cluster status', { error, clusterName });
      throw error;
    }
  }

  async createS3Bucket(bucketName: string, region: string): Promise<void> {
    try {
      await this.s3.createBucket({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: region !== 'us-east-1' ? region : undefined
        }
      }).promise();

      // Enable versioning
      await this.s3.putBucketVersioning({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      }).promise();

      // Enable encryption
      await this.s3.putBucketEncryption({
        Bucket: bucketName,
        ServerSideEncryptionConfiguration: {
          Rules: [{
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      }).promise();

      logger.info('AWS S3 bucket created', { bucketName, region });
    } catch (error) {
      logger.error('AWS S3 bucket creation failed', { error, bucketName, region });
      throw error;
    }
  }

  async deleteS3Bucket(bucketName: string): Promise<void> {
    try {
      // Delete all objects first
      const objects = await this.s3.listObjectsV2({ Bucket: bucketName }).promise();
      if (objects.Contents && objects.Contents.length > 0) {
        await this.s3.deleteObjects({
          Bucket: bucketName,
          Delete: {
            Objects: objects.Contents.map(obj => ({ Key: obj.Key! }))
          }
        }).promise();
      }

      // Delete bucket
      await this.s3.deleteBucket({ Bucket: bucketName }).promise();
      logger.info('AWS S3 bucket deleted', { bucketName });
    } catch (error) {
      logger.error('AWS S3 bucket deletion failed', { error, bucketName });
      throw error;
    }
  }

  private getInstanceTypeForGPU(gpuType: string, gpuCount: number): string {
    const mapping: Record<string, Record<number, string>> = {
      'A100-40GB': {
        8: 'p4d.24xlarge'
      },
      'A100-80GB': {
        8: 'p4de.24xlarge'
      },
      'V100': {
        1: 'p3.2xlarge',
        4: 'p3.8xlarge',
        8: 'p3.16xlarge'
      },
      'A10G': {
        1: 'g5.xlarge',
        4: 'g5.12xlarge',
        8: 'g5.48xlarge'
      }
    };

    return mapping[gpuType]?.[gpuCount] || 'p4d.24xlarge';
  }

  private async getOrCreateEKSServiceRole(): Promise<string> {
    // This would create or retrieve the EKS service role ARN
    // For now, return a placeholder
    return 'arn:aws:iam::123456789012:role/eksServiceRole';
  }

  private async getSubnetIds(region: string): Promise<string[]> {
    // This would get or create subnet IDs for the region
    // For now, return placeholder IDs
    return ['subnet-12345', 'subnet-67890'];
  }
}