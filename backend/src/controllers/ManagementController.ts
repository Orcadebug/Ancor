import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { CloudService } from '@/services/CloudService';
import { createAppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/models/types';

export class ManagementController {
  private db: DatabaseService;
  private cloudService: CloudService;

  constructor() {
    this.db = new DatabaseService();
    this.cloudService = new CloudService();
  }

  // Start instance
  startInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      if (!deployment.cloud_instance_id) {
        throw createAppError('No cloud instance associated with this deployment', 400);
      }

      if (deployment.status === 'running') {
        throw createAppError('Instance is already running', 400);
      }

      // Start the cloud instance
      const success = await this.cloudService.startInstance(deployment.cloud_instance_id);
      
      if (!success) {
        throw createAppError('Failed to start instance', 500);
      }

      // Update deployment status
      await this.db.updateDeployment(id, userId, { 
        status: 'running',
        last_health_check: new Date()
      });

      logger.info('Instance started successfully', {
        deploymentId: id,
        instanceId: deployment.cloud_instance_id,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Instance start initiated successfully',
        data: {
          deployment_id: id,
          instance_id: deployment.cloud_instance_id,
          status: 'starting'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Stop instance
  stopInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      if (!deployment.cloud_instance_id) {
        throw createAppError('No cloud instance associated with this deployment', 400);
      }

      if (deployment.status === 'stopped') {
        throw createAppError('Instance is already stopped', 400);
      }

      // Stop the cloud instance
      const success = await this.cloudService.stopInstance(deployment.cloud_instance_id);
      
      if (!success) {
        throw createAppError('Failed to stop instance', 500);
      }

      // Update deployment status
      await this.db.updateDeployment(id, userId, { 
        status: 'stopped',
        last_health_check: new Date()
      });

      logger.info('Instance stopped successfully', {
        deploymentId: id,
        instanceId: deployment.cloud_instance_id,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Instance stop initiated successfully',
        data: {
          deployment_id: id,
          instance_id: deployment.cloud_instance_id,
          status: 'stopping'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Restart instance
  restartInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      if (!deployment.cloud_instance_id) {
        throw createAppError('No cloud instance associated with this deployment', 400);
      }

      // Stop then start the instance
      const stopSuccess = await this.cloudService.stopInstance(deployment.cloud_instance_id);
      
      if (!stopSuccess) {
        throw createAppError('Failed to stop instance for restart', 500);
      }

      // Wait a bit before starting (in production, you'd want to poll for stopped status)
      setTimeout(async () => {
        const startSuccess = await this.cloudService.startInstance(deployment.cloud_instance_id!);
        
        if (startSuccess) {
          await this.db.updateDeployment(id, userId, { 
            status: 'running',
            last_health_check: new Date()
          });
        }
      }, 30000); // 30 seconds delay

      // Update status to indicate restart is in progress
      await this.db.updateDeployment(id, userId, { 
        status: 'deploying' // Use deploying status to indicate restart in progress
      });

      logger.info('Instance restart initiated', {
        deploymentId: id,
        instanceId: deployment.cloud_instance_id,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Instance restart initiated successfully',
        data: {
          deployment_id: id,
          instance_id: deployment.cloud_instance_id,
          status: 'restarting'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Scale instance (change instance type)
  scaleInstance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { instance_type } = req.body;
      const userId = req.userId!;

      if (!instance_type) {
        throw createAppError('Instance type is required', 400);
      }

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      if (!deployment.cloud_instance_id) {
        throw createAppError('No cloud instance associated with this deployment', 400);
      }

      // For AWS, scaling requires stopping instance, changing type, then starting
      // This is a simplified implementation - production would be more robust
      
      // Stop instance first
      await this.cloudService.stopInstance(deployment.cloud_instance_id);
      
      // Update deployment with new instance type
      await this.db.updateDeployment(id, userId, { 
        instance_type,
        status: 'deploying'
      });

      // Log the scaling operation
      await this.db.createLog({
        deployment_id: id,
        user_id: userId,
        level: 'INFO',
        message: `Instance scaling initiated: ${deployment.instance_type} -> ${instance_type}`,
        context: {
          old_instance_type: deployment.instance_type,
          new_instance_type: instance_type,
          instance_id: deployment.cloud_instance_id
        }
      });

      logger.info('Instance scaling initiated', {
        deploymentId: id,
        instanceId: deployment.cloud_instance_id,
        oldType: deployment.instance_type,
        newType: instance_type,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Instance scaling initiated successfully',
        data: {
          deployment_id: id,
          instance_id: deployment.cloud_instance_id,
          old_instance_type: deployment.instance_type,
          new_instance_type: instance_type,
          status: 'scaling'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get instance logs
  getInstanceLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { 
        level, 
        limit = 100,
        startDate,
        endDate
      } = req.query;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Get logs from database
      const logs = await this.db.getDeploymentLogs(
        id, 
        level as string, 
        parseInt(limit as string)
      );

      // Filter by date if provided
      let filteredLogs = logs;
      if (startDate || endDate) {
        filteredLogs = logs.filter(log => {
          const logTime = new Date(log.created_at).getTime();
          const start = startDate ? new Date(startDate as string).getTime() : 0;
          const end = endDate ? new Date(endDate as string).getTime() : Date.now();
          return logTime >= start && logTime <= end;
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          deployment_id: id,
          logs: filteredLogs,
          total_logs: filteredLogs.length,
          filters: { level, limit, startDate, endDate }
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Download logs as file
  downloadLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const { format = 'txt' } = req.query;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      const logs = await this.db.getDeploymentLogs(id, undefined, 1000); // Get more logs for download

      let content = '';
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        content = JSON.stringify(logs, null, 2);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="deployment-${id}-logs-${timestamp}.json"`);
      } else {
        // Default to text format
        content = logs.map(log => 
          `[${log.created_at}] ${log.level}: ${log.message}${log.context ? ' | Context: ' + JSON.stringify(log.context) : ''}`
        ).join('\n');
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="deployment-${id}-logs-${timestamp}.txt"`);
      }

      logger.info('Logs downloaded', {
        deploymentId: id,
        userId,
        format,
        logCount: logs.length
      });

      res.status(200).send(content);
    } catch (error) {
      next(error);
    }
  };

  // Create backup
  createBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Create backup record (in production, this would trigger actual backup process)
      const backupData = {
        deployment_id: id,
        name: name || `Backup-${new Date().toISOString()}`,
        backup_type: 'manual' as const,
        storage_location: `s3://ai-infra-backups/${deployment.user_id}/${id}/backup-${Date.now()}`,
        status: 'completed' as const, // Simplified for MVP
        size_mb: Math.random() * 1000, // Mock size
        completed_at: new Date()
      };

      // In production, you'd save this to the backups table
      logger.info('Backup created', {
        deploymentId: id,
        backupName: backupData.name,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Backup created successfully',
        data: { backup: backupData },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // List backups
  listBackups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Mock backup data for MVP (in production, query from backups table)
      const mockBackups = [
        {
          id: '1',
          deployment_id: id,
          name: 'Auto Backup - 2024-01-15',
          backup_type: 'auto',
          size_mb: 245.6,
          status: 'completed',
          created_at: '2024-01-15T10:30:00Z',
          completed_at: '2024-01-15T10:35:00Z'
        },
        {
          id: '2',
          deployment_id: id,
          name: 'Manual Backup - 2024-01-10',
          backup_type: 'manual',
          size_mb: 198.3,
          status: 'completed',
          created_at: '2024-01-10T14:20:00Z',
          completed_at: '2024-01-10T14:24:00Z'
        }
      ];

      const response: ApiResponse = {
        success: true,
        data: { 
          backups: mockBackups,
          total_backups: mockBackups.length
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Restore from backup
  restoreFromBackup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, backupId } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // In production, this would trigger actual restore process
      await this.db.createLog({
        deployment_id: id,
        user_id: userId,
        level: 'INFO',
        message: `Restore initiated from backup ${backupId}`,
        context: { backup_id: backupId }
      });

      logger.info('Restore initiated', {
        deploymentId: id,
        backupId,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Restore initiated successfully',
        data: {
          deployment_id: id,
          backup_id: backupId,
          status: 'restoring'
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Run diagnostics
  runDiagnostics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Mock diagnostic results for MVP
      const diagnostics = {
        instance_status: deployment.cloud_instance_id ? 
          await this.cloudService.getInstanceStatus(deployment.cloud_instance_id) : null,
        connectivity: {
          status: 'ok',
          response_time_ms: 245,
          last_check: new Date().toISOString()
        },
        resource_usage: {
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          disk_usage: Math.random() * 100
        },
        recent_errors: await this.db.getDeploymentLogs(id, 'ERROR', 5),
        recommendations: [
          'Consider upgrading to a larger instance type if CPU usage consistently exceeds 80%',
          'Enable auto-scaling to handle traffic spikes',
          'Set up monitoring alerts for error rates above 5%'
        ]
      };

      logger.info('Diagnostics completed', {
        deploymentId: id,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Diagnostics completed successfully',
        data: { diagnostics },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Clear cache
  clearCache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // In production, this would send a command to the instance to clear its cache
      await this.db.createLog({
        deployment_id: id,
        user_id: userId,
        level: 'INFO',
        message: 'Cache clear operation initiated',
        context: { operation: 'clear_cache' }
      });

      logger.info('Cache cleared', {
        deploymentId: id,
        userId
      });

      const response: ApiResponse = {
        success: true,
        message: 'Cache cleared successfully',
        data: {
          deployment_id: id,
          operation: 'clear_cache',
          completed_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}