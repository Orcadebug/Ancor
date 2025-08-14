import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database.js';
import { logger } from '@/utils/logger.js';
import { DeploymentOrchestrator } from '@/services/DeploymentOrchestrator.js';
import { AuthenticatedRequest, ApiResponse, DeploymentStatus } from '@/types/index.js';

// Validation schemas
const createDeploymentSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.enum(['LEGAL', 'HEALTHCARE', 'FINANCE', 'PROFESSIONAL']),
  useCase: z.string().min(1).max(200),
  modelId: z.string().cuid(),
  region: z.enum(['US_EAST', 'US_WEST', 'EU_CENTRAL']),
  compliance: z.enum(['SOC2', 'HIPAA', 'LEGAL', 'GDPR']),
  organizationName: z.string().min(1).max(100),
  teamSize: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  documentVolume: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE'])
});

const updateDeploymentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['RUNNING', 'STOPPED']).optional()
});

const scaleDeploymentSchema = z.object({
  gpuCount: z.number().int().min(1).max(8),
  memoryGB: z.number().int().min(32).max(512),
  storageGB: z.number().int().min(100).max(2000)
});

export class DeploymentController {
  private orchestrator: DeploymentOrchestrator;

  constructor() {
    this.orchestrator = new DeploymentOrchestrator();
  }

  /**
   * Get available AI models for deployment
   */
  async getAvailableModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await prisma.aIModel.findMany({
        where: { isActive: true },
        orderBy: { monthlyPrice: 'asc' }
      });

      const response: ApiResponse = {
        success: true,
        data: models,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get available models:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available models',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get available regions
   */
  async getAvailableRegions(req: Request, res: Response): Promise<void> {
    try {
      const regions = [
        { id: 'US_EAST', name: 'US-East', location: 'Virginia', latency: '~20ms' },
        { id: 'US_WEST', name: 'US-West', location: 'California', latency: '~15ms' },
        { id: 'EU_CENTRAL', name: 'EU-Central', location: 'Frankfurt', latency: '~25ms' }
      ];

      const response: ApiResponse = {
        success: true,
        data: regions,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get available regions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available regions',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Create new deployment
   */
  async createDeployment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const validatedData = createDeploymentSchema.parse(req.body);
      const organizationId = req.user!.organizationId;

      // Get model details for cost estimation
      const model = await prisma.aIModel.findUnique({
        where: { id: validatedData.modelId }
      });

      if (!model) {
        res.status(404).json({
          success: false,
          error: 'Model not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Calculate infrastructure configuration based on model
      const infrastructureConfig = this.calculateInfrastructureConfig(model.parameters);

      // Create deployment record
      const deployment = await prisma.deployment.create({
        data: {
          organizationId,
          name: validatedData.name,
          industry: validatedData.industry,
          useCase: validatedData.useCase,
          modelId: validatedData.modelId,
          region: validatedData.region,
          compliance: validatedData.compliance,
          status: DeploymentStatus.PENDING,
          infrastructureConfig: infrastructureConfig as any,
          costEstimate: model.monthlyPrice
        },
        include: {
          model: true,
          organization: true
        }
      });

      // Start deployment process asynchronously
      this.orchestrator.deployInfrastructure(deployment as any)
        .catch(error => {
          logger.error(`Deployment ${deployment.id} failed:`, error);
        });

      const response: ApiResponse = {
        success: true,
        data: deployment,
        message: 'Deployment initiated successfully',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.error('Failed to create deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create deployment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get deployments for organization
   */
  async getDeployments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const where: any = { organizationId };
      if (status) {
        where.status = status;
      }

      const [deployments, total] = await Promise.all([
        prisma.deployment.findMany({
          where,
          include: {
            model: true,
            _count: {
              select: {
                documents: true,
                workflows: true,
                chatSessions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.deployment.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: deployments,
        timestamp: new Date().toISOString()
      };

      // Add pagination info
      (response as any).pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get deployments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch deployments',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get specific deployment
   */
  async getDeployment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const deployment = await prisma.deployment.findFirst({
        where: { 
          id, 
          organizationId 
        },
        include: {
          model: true,
          organization: true,
          documents: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          workflows: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!deployment) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: deployment,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch deployment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update deployment
   */
  async updateDeployment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const validatedData = updateDeploymentSchema.parse(req.body);

      const deployment = await prisma.deployment.findFirst({
        where: { id, organizationId }
      });

      if (!deployment) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Handle status changes
      if (validatedData.status) {
        if (validatedData.status === 'STOPPED' && deployment.status === 'RUNNING') {
          await this.orchestrator.stopDeployment(id);
        }
        // Note: Starting stopped deployments would require re-running the orchestrator
      }

      const updatedDeployment = await prisma.deployment.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        },
        include: {
          model: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: updatedDeployment,
        message: 'Deployment updated successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.error('Failed to update deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update deployment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Scale deployment
   */
  async scaleDeployment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const validatedData = scaleDeploymentSchema.parse(req.body);

      const deployment = await prisma.deployment.findFirst({
        where: { id, organizationId }
      });

      if (!deployment) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (deployment.status !== 'RUNNING') {
        res.status(400).json({
          success: false,
          error: 'Deployment must be running to scale',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Scale the deployment
      await this.orchestrator.scaleDeployment(id, {
        gpuType: 'A100-80GB',
        gpuCount: validatedData.gpuCount,
        memoryGB: validatedData.memoryGB,
        storageGB: validatedData.storageGB,
        networkBandwidth: '100Gbps'
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment scaling initiated',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.error('Failed to scale deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scale deployment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get deployment health status
   */
  async getDeploymentHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const deployment = await prisma.deployment.findFirst({
        where: { id, organizationId }
      });

      if (!deployment) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const health = await this.orchestrator.getDeploymentHealth(id);

      const response: ApiResponse = {
        success: true,
        data: health,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get deployment health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch deployment health',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;

      const deployment = await prisma.deployment.findFirst({
        where: { id, organizationId }
      });

      if (!deployment) {
        res.status(404).json({
          success: false,
          error: 'Deployment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Stop deployment if running
      if (deployment.status === 'RUNNING') {
        await this.orchestrator.stopDeployment(id);
      }

      // Delete deployment record
      await prisma.deployment.delete({
        where: { id }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Deployment deleted successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete deployment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete deployment',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Private helper methods
   */
  private calculateInfrastructureConfig(modelParameters: string) {
    const configs = {
      '8B': {
        gpuType: 'A40',
        gpuCount: 1,
        memoryGB: 32,
        storageGB: 100,
        networkBandwidth: '10Gbps'
      },
      '70B': {
        gpuType: 'A100-80GB',
        gpuCount: 2,
        memoryGB: 128,
        storageGB: 500,
        networkBandwidth: '100Gbps'
      },
      '405B': {
        gpuType: 'A100-80GB',
        gpuCount: 4,
        memoryGB: 256,
        storageGB: 1000,
        networkBandwidth: '200Gbps'
      }
    };

    return configs[modelParameters as keyof typeof configs] || configs['70B'];
  }
}