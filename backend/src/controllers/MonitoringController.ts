import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '@/services/DatabaseService';
import { CloudService } from '@/services/CloudService';
import { createAppError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/models/types';

export class MonitoringController {
  private db: DatabaseService;
  private cloudService: CloudService;

  constructor() {
    this.db = new DatabaseService();
    this.cloudService = new CloudService();
  }

  // Get deployment metrics
  getDeploymentMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      
      // Query parameters for time range
      const { 
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        endDate = new Date().toISOString(),
        interval = '5m' // 5 minutes, 1h, 1d
      } = req.query;

      // Verify deployment exists and user has access
      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Get metrics from database
      const metrics = await this.db.getDeploymentMetrics(
        id,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // If deployment has cloud instance, get real-time cloud metrics
      let cloudMetrics = null;
      if (deployment.cloud_instance_id) {
        cloudMetrics = await this.cloudService.getInstanceMetrics(
          deployment.cloud_instance_id,
          new Date(startDate as string),
          new Date(endDate as string)
        );
      }

      // Aggregate metrics by interval
      const aggregatedMetrics = this.aggregateMetrics(metrics, interval as string);

      const response: ApiResponse = {
        success: true,
        data: {
          deployment_id: id,
          time_range: { startDate, endDate },
          interval,
          metrics: aggregatedMetrics,
          cloud_metrics: cloudMetrics,
          total_requests: metrics.reduce((sum, m) => sum + m.requests_count, 0),
          total_errors: metrics.reduce((sum, m) => sum + m.error_count, 0),
          avg_response_time: this.calculateAverage(metrics.map(m => m.response_time_ms).filter(Boolean)),
          total_cost: metrics.reduce((sum, m) => sum + m.cost_usd, 0)
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get real-time metrics (WebSocket would be better for production)
  getRealTimeMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      // Get latest metrics (last 5 minutes)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const recentMetrics = await this.db.getDeploymentMetrics(id, fiveMinutesAgo, now);
      
      // Get current instance status
      let instanceStatus = null;
      if (deployment.cloud_instance_id) {
        instanceStatus = await this.cloudService.getInstanceStatus(deployment.cloud_instance_id);
      }

      // Calculate real-time statistics
      const currentStats = {
        status: deployment.status,
        instance_status: instanceStatus,
        requests_per_minute: this.calculateRPM(recentMetrics),
        error_rate: this.calculateErrorRate(recentMetrics),
        avg_response_time: this.calculateAverage(recentMetrics.map(m => m.response_time_ms).filter(Boolean)),
        current_cost_per_hour: this.calculateCurrentCostPerHour(recentMetrics),
        last_updated: new Date().toISOString()
      };

      const response: ApiResponse = {
        success: true,
        data: currentStats,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get usage analytics
  getUsageAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        endDate = new Date().toISOString(),
        deploymentId 
      } = req.query;

      let analytics = await this.db.getUserAnalytics(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Filter by specific deployment if requested
      if (deploymentId) {
        analytics = analytics.filter(a => a.deployment_id === deploymentId);
      }

      // Calculate summary statistics
      const summary = {
        total_requests: analytics.reduce((sum, a) => sum + a.total_requests, 0),
        total_errors: analytics.reduce((sum, a) => sum + a.total_errors, 0),
        total_cost: analytics.reduce((sum, a) => sum + a.total_cost_usd, 0),
        avg_response_time: this.calculateAverage(analytics.map(a => a.avg_response_time_ms).filter(Boolean)),
        total_input_tokens: analytics.reduce((sum, a) => sum + a.input_tokens_used, 0),
        total_output_tokens: analytics.reduce((sum, a) => sum + a.output_tokens_used, 0),
        active_days: analytics.length,
        error_rate: analytics.length > 0 
          ? (analytics.reduce((sum, a) => sum + a.total_errors, 0) / 
             analytics.reduce((sum, a) => sum + a.total_requests, 0)) * 100 
          : 0
      };

      const response: ApiResponse = {
        success: true,
        data: {
          time_range: { startDate, endDate },
          summary,
          daily_analytics: analytics
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get cost analytics
  getCostAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { 
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate = new Date().toISOString(),
        groupBy = 'day' // day, week, month
      } = req.query;

      const analytics = await this.db.getUserAnalytics(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Group costs by the specified interval
      const costData = this.groupCostsByInterval(analytics, groupBy as string);

      // Calculate projections
      const currentPeriodCost = analytics.reduce((sum, a) => sum + a.total_cost_usd, 0);
      const dailyAverage = currentPeriodCost / Math.max(analytics.length, 1);
      
      const projections = {
        daily_average: dailyAverage,
        monthly_projection: dailyAverage * 30,
        yearly_projection: dailyAverage * 365
      };

      const response: ApiResponse = {
        success: true,
        data: {
          time_range: { startDate, endDate },
          total_cost: currentPeriodCost,
          cost_breakdown: costData,
          projections
        },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get performance analytics
  getPerformanceAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { 
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
        endDate = new Date().toISOString(),
        deploymentId 
      } = req.query;

      const analytics = await this.db.getUserAnalytics(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      let filteredAnalytics = analytics;
      if (deploymentId) {
        filteredAnalytics = analytics.filter(a => a.deployment_id === deploymentId);
      }

      // Calculate performance metrics
      const performanceData = {
        avg_response_time: this.calculateAverage(filteredAnalytics.map(a => a.avg_response_time_ms).filter(Boolean)),
        success_rate: this.calculateSuccessRate(filteredAnalytics),
        throughput_rpm: this.calculateThroughput(filteredAnalytics),
        response_time_trend: this.calculateTrend(filteredAnalytics.map(a => ({ 
          date: a.date, 
          value: a.avg_response_time_ms || 0 
        }))),
        error_rate_trend: this.calculateTrend(filteredAnalytics.map(a => ({ 
          date: a.date, 
          value: a.total_requests > 0 ? (a.total_errors / a.total_requests) * 100 : 0 
        })))
      };

      const response: ApiResponse = {
        success: true,
        data: performanceData,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get user alerts
  getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      
      // TODO: Implement alerts retrieval from database
      // For now, return mock data
      const alerts = [
        {
          id: '1',
          type: 'performance',
          severity: 'medium',
          title: 'Response time increased',
          message: 'Average response time is 2.3s (threshold: 2.0s)',
          deployment_id: req.query.deploymentId,
          created_at: new Date().toISOString(),
          status: 'active'
        }
      ];

      const response: ApiResponse = {
        success: true,
        data: { alerts },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Create alert
  createAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement alert creation
      const response: ApiResponse = {
        success: true,
        message: 'Alert created successfully (not implemented in MVP)',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Update alert
  updateAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement alert update
      const response: ApiResponse = {
        success: true,
        message: 'Alert updated successfully (not implemented in MVP)',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Delete alert
  deleteAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement alert deletion
      const response: ApiResponse = {
        success: true,
        message: 'Alert deleted successfully (not implemented in MVP)',
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Get deployment health
  getDeploymentHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const deployment = await this.db.getDeploymentById(id, userId);
      if (!deployment) {
        throw createAppError('Deployment not found', 404);
      }

      let health = {
        status: 'unknown',
        last_check: null,
        response_time: null,
        uptime_percentage: null,
        issues: []
      };

      if (deployment.cloud_instance_id) {
        const instanceStatus = await this.cloudService.getInstanceStatus(deployment.cloud_instance_id);
        
        health = {
          status: instanceStatus?.status === 'running' ? 'healthy' : 'unhealthy',
          last_check: new Date().toISOString(),
          response_time: null, // Would implement actual health check ping
          uptime_percentage: 99.9, // Would calculate from historical data
          issues: instanceStatus?.status !== 'running' ? ['Instance not running'] : []
        };
      }

      const response: ApiResponse = {
        success: true,
        data: { health },
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Helper methods
  private aggregateMetrics(metrics: any[], interval: string): any[] {
    // Simple aggregation - in production, you'd want more sophisticated grouping
    return metrics.map(m => ({
      timestamp: m.timestamp,
      requests: m.requests_count,
      errors: m.error_count,
      response_time: m.response_time_ms,
      cost: m.cost_usd
    }));
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateRPM(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const totalRequests = metrics.reduce((sum, m) => sum + m.requests_count, 0);
    return totalRequests / Math.max(metrics.length, 1);
  }

  private calculateErrorRate(metrics: any[]): number {
    const totalRequests = metrics.reduce((sum, m) => sum + m.requests_count, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.error_count, 0);
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  private calculateCurrentCostPerHour(metrics: any[]): number {
    if (metrics.length === 0) return 0;
    const totalCost = metrics.reduce((sum, m) => sum + m.cost_usd, 0);
    return (totalCost / metrics.length) * 12; // Assuming 5-minute intervals
  }

  private calculateSuccessRate(analytics: any[]): number {
    const totalRequests = analytics.reduce((sum, a) => sum + a.total_requests, 0);
    const totalErrors = analytics.reduce((sum, a) => sum + a.total_errors, 0);
    return totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;
  }

  private calculateThroughput(analytics: any[]): number {
    const totalRequests = analytics.reduce((sum, a) => sum + a.total_requests, 0);
    return totalRequests / Math.max(analytics.length, 1) / (24 * 60); // Requests per minute
  }

  private calculateTrend(data: { date: Date; value: number }[]): string {
    if (data.length < 2) return 'stable';
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = ((last - first) / Math.max(first, 0.1)) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private groupCostsByInterval(analytics: any[], groupBy: string): any[] {
    // Simple grouping - in production, you'd want more sophisticated date grouping
    return analytics.map(a => ({
      period: a.date,
      cost: a.total_cost_usd
    }));
  }
}