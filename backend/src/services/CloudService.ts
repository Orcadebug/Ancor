import { 
  EC2Client, 
  RunInstancesCommand, 
  DescribeInstancesCommand, 
  StartInstancesCommand, 
  StopInstancesCommand, 
  TerminateInstancesCommand,
  DescribeRegionsCommand,
  Instance 
} from '@aws-sdk/client-ec2';
import { 
  CloudWatchClient, 
  GetMetricStatisticsCommand,
  Datapoint 
} from '@aws-sdk/client-cloudwatch';
import { fromEnv } from '@aws-sdk/credential-providers';
import { logger } from '@/utils/logger';
import { Deployment, CloudProvider } from '@/models/types';

export interface DeploymentConfig {
  deployment: Deployment;
  cloudProvider: CloudProvider;
  userApiKeys: Record<string, string>;
}

export interface InstanceStatus {
  id: string;
  status: 'pending' | 'running' | 'stopped' | 'terminated' | 'failed';
  publicIp?: string;
  privateIp?: string;
  endpoint?: string;
  launchTime?: Date;
  instanceType: string;
  region: string;
}

export class CloudService {
  private ec2Client: EC2Client;
  private cloudWatchClient: CloudWatchClient;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    const clientConfig = {
      region,
      credentials: fromEnv(), // Automatically uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    };

    this.ec2Client = new EC2Client(clientConfig);
    this.cloudWatchClient = new CloudWatchClient(clientConfig);
  }

  // Deploy AI model instance to AWS
  async deployToAWS(config: DeploymentConfig): Promise<string | null> {
    try {
      const { deployment } = config;

      // Create user data script for AI model setup
      const userData = this.generateUserDataScript(deployment);

      // EC2 instance parameters
      const runInstancesCommand = new RunInstancesCommand({
        ImageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI (update as needed)
        InstanceType: deployment.instance_type as any,
        MinCount: 1,
        MaxCount: 1,
        UserData: Buffer.from(userData).toString('base64'),
        SecurityGroups: ['ai-infra-platform-sg'], // Create security group beforehand
        TagSpecifications: [{
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: `ai-model-${deployment.name}` },
            { Key: 'DeploymentId', Value: deployment.id },
            { Key: 'UserId', Value: deployment.user_id },
            { Key: 'AIModel', Value: deployment.ai_model_id },
            { Key: 'Project', Value: 'ai-infra-platform' }
          ]
        }]
      });

      const result = await this.ec2Client.send(runInstancesCommand);
      
      if (!result.Instances || result.Instances.length === 0) {
        throw new Error('Failed to create EC2 instance');
      }

      const instanceId = result.Instances[0].InstanceId!;
      
      logger.info('EC2 instance created successfully', {
        instanceId,
        deploymentId: deployment.id,
        instanceType: deployment.instance_type
      });

      return instanceId;
    } catch (error) {
      logger.error('Failed to deploy to AWS:', error);
      return null;
    }
  }

  // Generate user data script for instance initialization
  private generateUserDataScript(deployment: Deployment): string {
    return `#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Install Python and pip
yum install -y python3 python3-pip

# Install required packages
pip3 install fastapi uvicorn openai anthropic requests

# Create AI model service
cat << 'EOF' > /home/ec2-user/ai_service.py
import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

app = FastAPI(title="AI Model Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on deployment settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load deployment configuration
DEPLOYMENT_CONFIG = ${JSON.stringify(deployment)}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "deployment_id": DEPLOYMENT_CONFIG["id"]}

@app.post("/v1/chat/completions")
async def chat_completion(request: Request):
    # Implement AI model inference based on the configured model
    # This is a placeholder - actual implementation depends on the AI model
    try:
        data = await request.json()
        
        # Rate limiting check
        # IP allowlist check
        # API key validation
        
        # Model inference logic would go here
        response = {
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1677652288,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "This is a placeholder response. Implement actual model inference."
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 9,
                "completion_tokens": 12,
                "total_tokens": 21
            }
        }
        
        logger.info("Request processed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Start the AI service
nohup python3 /home/ec2-user/ai_service.py > /var/log/ai_service.log 2>&1 &

# Create systemd service for auto-restart
cat << 'EOF' > /etc/systemd/system/ai-service.service
[Unit]
Description=AI Model Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user
ExecStart=/usr/bin/python3 /home/ec2-user/ai_service.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ai-service
systemctl start ai-service`;
  }

  // Get instance status
  async getInstanceStatus(instanceId: string): Promise<InstanceStatus | null> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });

      const result = await this.ec2Client.send(command);
      
      if (!result.Reservations || result.Reservations.length === 0) {
        return null;
      }

      const instance = result.Reservations[0].Instances?.[0];
      if (!instance) {
        return null;
      }

      const status: InstanceStatus = {
        id: instanceId,
        status: this.mapAWSStatus(instance.State?.Name || 'unknown'),
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        endpoint: instance.PublicIpAddress ? `http://${instance.PublicIpAddress}:8000` : undefined,
        launchTime: instance.LaunchTime,
        instanceType: instance.InstanceType || 'unknown',
        region: instance.Placement?.AvailabilityZone?.slice(0, -1) || 'unknown'
      };

      return status;
    } catch (error) {
      logger.error('Failed to get instance status:', error);
      return null;
    }
  }

  // Start stopped instance
  async startInstance(instanceId: string): Promise<boolean> {
    try {
      const command = new StartInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
      logger.info('Instance start initiated', { instanceId });
      return true;
    } catch (error) {
      logger.error('Failed to start instance:', error);
      return false;
    }
  }

  // Stop running instance
  async stopInstance(instanceId: string): Promise<boolean> {
    try {
      const command = new StopInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
      logger.info('Instance stop initiated', { instanceId });
      return true;
    } catch (error) {
      logger.error('Failed to stop instance:', error);
      return false;
    }
  }

  // Terminate instance
  async terminateInstance(instanceId: string): Promise<boolean> {
    try {
      const command = new TerminateInstancesCommand({
        InstanceIds: [instanceId]
      });
      
      await this.ec2Client.send(command);
      logger.info('Instance termination initiated', { instanceId });
      return true;
    } catch (error) {
      logger.error('Failed to terminate instance:', error);
      return false;
    }
  }

  // Get instance metrics from CloudWatch
  async getInstanceMetrics(instanceId: string, startTime: Date, endTime: Date): Promise<any> {
    try {
      const metrics = await Promise.all([
        this.getMetricData('AWS/EC2', 'CPUUtilization', 'InstanceId', instanceId, startTime, endTime),
        this.getMetricData('AWS/EC2', 'NetworkIn', 'InstanceId', instanceId, startTime, endTime),
        this.getMetricData('AWS/EC2', 'NetworkOut', 'InstanceId', instanceId, startTime, endTime),
      ]);

      return {
        cpuUtilization: metrics[0],
        networkIn: metrics[1],
        networkOut: metrics[2]
      };
    } catch (error) {
      logger.error('Failed to get instance metrics:', error);
      return null;
    }
  }

  // Helper method to get CloudWatch metric data
  private async getMetricData(
    namespace: string,
    metricName: string,
    dimensionName: string,
    dimensionValue: string,
    startTime: Date,
    endTime: Date
  ): Promise<Datapoint[]> {
    const command = new GetMetricStatisticsCommand({
      Namespace: namespace,
      MetricName: metricName,
      Dimensions: [{
        Name: dimensionName,
        Value: dimensionValue
      }],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300, // 5 minutes
      Statistics: ['Average', 'Maximum']
    });

    const result = await this.cloudWatchClient.send(command);
    return result.Datapoints || [];
  }

  // Map AWS instance states to our status enum
  private mapAWSStatus(awsState: string): InstanceStatus['status'] {
    switch (awsState) {
      case 'pending':
        return 'pending';
      case 'running':
        return 'running';
      case 'stopped':
      case 'stopping':
        return 'stopped';
      case 'terminated':
      case 'terminating':
        return 'terminated';
      case 'shutting-down':
        return 'stopped';
      default:
        return 'failed';
    }
  }

  // Get available AWS regions
  async getAvailableRegions(): Promise<string[]> {
    try {
      const command = new DescribeRegionsCommand({});
      const result = await this.ec2Client.send(command);
      return result.Regions?.map(region => region.RegionName!).filter(Boolean) || [];
    } catch (error) {
      logger.error('Failed to get available regions:', error);
      return ['us-east-1', 'us-west-2', 'eu-west-1']; // Fallback
    }
  }

  // Get available instance types for a region
  async getAvailableInstanceTypes(region: string): Promise<any[]> {
    // This is a simplified list - in production, you'd want to query AWS API
    // or maintain a comprehensive list based on your needs
    return [
      { type: 't3.micro', cpu: 2, memory: 1, pricePerHour: 0.0104 },
      { type: 't3.small', cpu: 2, memory: 2, pricePerHour: 0.0208 },
      { type: 't3.medium', cpu: 2, memory: 4, pricePerHour: 0.0416 },
      { type: 'm5.large', cpu: 2, memory: 8, pricePerHour: 0.096 },
      { type: 'm5.xlarge', cpu: 4, memory: 16, pricePerHour: 0.192 },
      { type: 'm5.2xlarge', cpu: 8, memory: 32, pricePerHour: 0.384 }
    ];
  }
}