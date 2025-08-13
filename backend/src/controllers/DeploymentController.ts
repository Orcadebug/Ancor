import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { CloudService } from '@/services/CloudService';
import { createAppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { ApiResponse, Deployment } from '@/models/types';

export class DeploymentController {
  private db: DatabaseService;
  private cloudService: CloudService;

  constructor() {
    this.db = new DatabaseService();
    this.cloudService = new CloudService();
  }

  // Get available AI models
  getAvailableModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const models = await this.db.getAIModels();

      const response: ApiResponse = {
        success: true,
        data: { models },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get cloud providers
  getCloudProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const providers = await this.db.getCloudProviders();

      const response: ApiResponse = {
        success: true,
        data: { providers },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get available regions for a cloud provider
  getRegions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider } = req.params;

      let regions: string[] = [];

      switch (provider.toLowerCase()) {
        case 'aws':
          regions = await this.cloudService.getAvailableRegions();
          break;
        case 'gcp':
          // Mock GCP regions for MVP
          regions = ['us-central1', 'us-west1', 'europe-west1', 'asia-southeast1'];
          break;
        case 'azure':
          // Mock Azure regions for MVP  
          regions = ['eastus', 'westus2', 'westeurope', 'southeastasia'];
          break;
        default:
          throw createAppError('Unsupported cloud provider', 400);
      }

      const response: ApiResponse = {
        success: true,
        data: { regions },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get instance types for a provider and region
  getInstanceTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { provider, region } = req.params;

      let instanceTypes: any[] = [];

      switch (provider.toLowerCase()) {
        case 'aws':
          instanceTypes = await this.cloudService.getAvailableInstanceTypes(region);
          break;
        case 'gcp':
          // Mock GCP instance types
          instanceTypes = [
            { type: 'e2-micro', cpu: 2, memory: 1, pricePerHour: 0.008 },
            { type: 'e2-small', cpu: 2, memory: 2, pricePerHour: 0.017 },
            { type: 'n1-standard-2', cpu: 2, memory: 7.5, pricePerHour: 0.095 },
            { type: 'n1-standard-4', cpu: 4, memory: 15, pricePerHour: 0.19 }
          ];
          break;
        case 'azure':
          // Mock Azure instance types
          instanceTypes = [
            { type: 'B1ls', cpu: 1, memory: 0.5, pricePerHour: 0.0052 },
            { type: 'B1s', cpu: 1, memory: 1, pricePerHour: 0.0104 },
            { type: 'B2s', cpu: 2, memory: 4, pricePerHour: 0.0416 },
            { type: 'B4ms', cpu: 4, memory: 16, pricePerHour: 0.166 }
          ];
          break;
        default:
          throw createAppError('Unsupported cloud provider', 400);
      }

      const response: ApiResponse = {
        success: true,
        data: { instanceTypes },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Create new deployment
  createDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const deploymentData = {
        ...req.body,
        user_id: userId,
        status: 'draft' as const
      };

      const deployment = await this.db.createDeployment(deploymentData);
      
      if (!deployment) {
        throw createAppError('Failed to create deployment', 500);
      }

      logger.info('Deployment created', { 
        deploymentId: deployment.id, 
        userId 
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment created successfully',
        data: { deployment },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get user's deployments
  getUserDeployments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const deployments = await this.db.getUserDeployments(userId);

      const response: ApiResponse = {
        success: true,
        data: { deployments },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get specific deployment
  getDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: { deployment },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update deployment
  updateDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const updates = req.body;

      const deployment = await this.db.updateDeployment(id, userId, updates);
      
      if (!deployment) {
        throw createAppError('Deployment not found or update failed', 404);
      }

      logger.info('Deployment updated', { 
        deploymentId: id, 
        userId 
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment updated successfully',
        data: { deployment },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete deployment
  deleteDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // First get the deployment to check if it has cloud resources
      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // If deployment has cloud instance, terminate it first
      if (deployment.cloud_instance_id && deployment.status !== 'terminated') {
        await this.cloudService.terminateInstance(deployment.cloud_instance_id);
        
        // Update deployment status
        await this.db.updateDeployment(id, userId, { 
          status: 'terminated' 
        });
      }

      const success = await this.db.deleteDeployment(id, userId);
      
      if (!success) {
        throw createAppError('Failed to delete deployment', 500);
      }

      logger.info('Deployment deleted', { 
        deploymentId: id, 
        userId 
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment deleted successfully',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Deploy instance to cloud
  deployInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      // Get deployment details
      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      if (deployment.status === 'running') {
        throw createAppError('Deployment is already running', 400);
      }

      // Update status to deploying
      await this.db.updateDeployment(id, userId, { 
        status: 'deploying' 
      });

      // Get cloud provider details
      const providers = await this.db.getCloudProviders();
      const cloudProvider = providers.find(p => p.id === deployment.cloud_provider_id);
      
      if (!cloudProvider) {
        throw createAppError('Cloud provider not found', 404);
      }

      // Deploy to cloud (currently only AWS is implemented)
      let instanceId: string | null = null;
      
      if (cloudProvider.name === 'aws') {
        instanceId = await this.cloudService.deployToAWS({
          deployment,
          cloudProvider,
          userApiKeys: {} // TODO: Get user's API keys from database
        });
      } else {
        throw createAppError('Cloud provider not yet supported', 501);
      }

      if (!instanceId) {
        // Update status to failed
        await this.db.updateDeployment(id, userId, { 
          status: 'failed' 
        });
        throw createAppError('Failed to deploy instance', 500);
      }

      // Update deployment with instance details
      const updatedDeployment = await this.db.updateDeployment(id, userId, {
        status: 'running',
        cloud_instance_id: instanceId,
        deployed_at: new Date(),
        endpoint_url: `pending` // Will be updated once instance is fully running
      });

      logger.info('Deployment initiated successfully', {
        deploymentId: id,
        instanceId,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment initiated successfully',
        data: { 
          deployment: updatedDeployment,
          instanceId 
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get deployment status
  getDeploymentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      let instanceStatus = null;
      
      // Get real-time status from cloud provider if instance exists
      if (deployment.cloud_instance_id) {
        instanceStatus = await this.cloudService.getInstanceStatus(deployment.cloud_instance_id);
        
        // Update deployment status if it differs from cloud status
        if (instanceStatus && instanceStatus.status !== deployment.status) {
          await this.db.updateDeployment(id, userId, {
            status: instanceStatus.status,
            endpoint_url: instanceStatus.endpoint,
            last_health_check: new Date()
          });
        }
      }

      const response: ApiResponse = {
        success: true,
        data: { 
          deployment,
          instanceStatus
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}