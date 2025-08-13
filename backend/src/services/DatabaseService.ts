import { supabase, supabaseAdmin } from '@/config/supabase';
import { logger } from '@/utils/logger';
import { User, Deployment, DeploymentMetrics, UsageAnalytics, SystemLog, Alert, Backup } from '@/models/types';

export class DatabaseService {
  // Users
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating user:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      logger.error('Error in createUser:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        logger.error('Error getting user by email:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      logger.error('Error in getUserByEmail:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error getting user by ID:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      logger.error('Error in getUserById:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user:', error);
        return null;
      }

      return data as User;
    } catch (error) {
      logger.error('Error in updateUser:', error);
      return null;
    }
  }

  // Deployments
  async createDeployment(deploymentData: Omit<Deployment, 'id' | 'created_at' | 'updated_at'>): Promise<Deployment | null> {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .insert(deploymentData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating deployment:', error);
        return null;
      }

      return data as Deployment;
    } catch (error) {
      logger.error('Error in createDeployment:', error);
      return null;
    }
  }

  async getUserDeployments(userId: string): Promise<Deployment[]> {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select(`
          *,
          ai_models:ai_model_id(*),
          cloud_providers:cloud_provider_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting user deployments:', error);
        return [];
      }

      return data as Deployment[];
    } catch (error) {
      logger.error('Error in getUserDeployments:', error);
      return [];
    }
  }

  async getDeploymentById(id: string, userId: string): Promise<Deployment | null> {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select(`
          *,
          ai_models:ai_model_id(*),
          cloud_providers:cloud_provider_id(*)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error('Error getting deployment by ID:', error);
        return null;
      }

      return data as Deployment;
    } catch (error) {
      logger.error('Error in getDeploymentById:', error);
      return null;
    }
  }

  async updateDeployment(id: string, userId: string, updates: Partial<Deployment>): Promise<Deployment | null> {
    try {
      const { data, error } = await supabase
        .from('deployments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating deployment:', error);
        return null;
      }

      return data as Deployment;
    } catch (error) {
      logger.error('Error in updateDeployment:', error);
      return null;
    }
  }

  async deleteDeployment(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deployments')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting deployment:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in deleteDeployment:', error);
      return false;
    }
  }

  // Metrics
  async createMetrics(metricsData: Omit<DeploymentMetrics, 'id'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('deployment_metrics')
        .insert(metricsData);

      if (error) {
        logger.error('Error creating metrics:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in createMetrics:', error);
      return false;
    }
  }

  async getDeploymentMetrics(
    deploymentId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<DeploymentMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('deployment_metrics')
        .select('*')
        .eq('deployment_id', deploymentId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        logger.error('Error getting deployment metrics:', error);
        return [];
      }

      return data as DeploymentMetrics[];
    } catch (error) {
      logger.error('Error in getDeploymentMetrics:', error);
      return [];
    }
  }

  // Usage Analytics
  async createUsageAnalytics(analyticsData: Omit<UsageAnalytics, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('usage_analytics')
        .upsert(analyticsData);

      if (error) {
        logger.error('Error creating usage analytics:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in createUsageAnalytics:', error);
      return false;
    }
  }

  async getUserAnalytics(userId: string, startDate: Date, endDate: Date): Promise<UsageAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('usage_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        logger.error('Error getting user analytics:', error);
        return [];
      }

      return data as UsageAnalytics[];
    } catch (error) {
      logger.error('Error in getUserAnalytics:', error);
      return [];
    }
  }

  // System Logs
  async createLog(logData: Omit<SystemLog, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert(logData);

      if (error) {
        logger.error('Error creating log:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in createLog:', error);
      return false;
    }
  }

  async getDeploymentLogs(
    deploymentId: string, 
    level?: string, 
    limit: number = 100
  ): Promise<SystemLog[]> {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .eq('deployment_id', deploymentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (level) {
        query = query.eq('level', level);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error getting deployment logs:', error);
        return [];
      }

      return data as SystemLog[];
    } catch (error) {
      logger.error('Error in getDeploymentLogs:', error);
      return [];
    }
  }

  // AI Models and Cloud Providers (read-only for MVP)
  async getAIModels(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Error getting AI models:', error);
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Error in getAIModels:', error);
      return [];
    }
  }

  async getCloudProviders(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('cloud_providers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('Error getting cloud providers:', error);
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Error in getCloudProviders:', error);
      return [];
    }
  }
}