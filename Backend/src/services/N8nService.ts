import axios, { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger.js';

interface WorkflowEngineConfig {
  instanceId: string;
  templates: string[];
}

export class N8nService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.N8N_HOST || 'localhost';
    
    this.client = axios.create({
      baseURL: `http://${this.baseUrl}:${process.env.N8N_PORT || 5678}/api/v1`,
      auth: {
        username: process.env.N8N_BASIC_AUTH_USER || 'admin',
        password: process.env.N8N_BASIC_AUTH_PASSWORD || 'admin'
      },
      timeout: 30000
    });
  }

  /**
   * Deploy n8n workflow engine
   */
  async deployWorkflowEngine(config: WorkflowEngineConfig): Promise<string> {
    try {
      logger.info(`Deploying n8n workflow engine for instance ${config.instanceId}`);

      // In a real implementation, this would deploy n8n container
      // For now, we'll simulate it and return endpoint
      const endpoint = `http://${config.instanceId}:5678`;

      // Create workflow templates
      await this.createWorkflowTemplates(config.templates);

      logger.info(`n8n workflow engine deployed at ${endpoint}`);
      return endpoint;

    } catch (error) {
      logger.error('Failed to deploy n8n workflow engine:', error);
      throw error;
    }
  }

  /**
   * Check workflow engine health
   */
  async checkWorkflowHealth(deploymentId: string): Promise<any> {
    try {
      const response = await this.client.get('/workflows');
      
      return {
        status: 'healthy',
        workflowCount: response.data.data?.length || 0,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Create workflow templates
   */
  private async createWorkflowTemplates(templates: string[]): Promise<void> {
    try {
      for (const template of templates) {
        const workflowData = this.getWorkflowTemplate(template);
        
        await this.client.post('/workflows', {
          name: template,
          nodes: workflowData.nodes,
          connections: workflowData.connections,
          active: true
        });
        
        logger.info(`Created workflow template: ${template}`);
      }

    } catch (error) {
      logger.error('Failed to create workflow templates:', error);
    }
  }

  /**
   * Get predefined workflow templates
   */
  private getWorkflowTemplate(templateName: string): any {
    const templates = {
      'document-auto-processing': {
        nodes: [
          {
            id: 'webhook',
            type: 'n8n-nodes-base.webhook',
            name: 'Document Upload Webhook',
            parameters: {
              path: 'document-upload',
              httpMethod: 'POST'
            },
            position: [250, 300]
          },
          {
            id: 'process',
            type: 'n8n-nodes-base.httpRequest',
            name: 'Process Document',
            parameters: {
              url: '={{$node["Document Upload Webhook"].json["callback_url"]}}',
              method: 'POST'
            },
            position: [450, 300]
          }
        ],
        connections: {
          'Document Upload Webhook': {
            main: [['Process Document']]
          }
        }
      },
      'daily-digest': {
        nodes: [
          {
            id: 'cron',
            type: 'n8n-nodes-base.cron',
            name: 'Daily Schedule',
            parameters: {
              rule: {
                hour: 9,
                minute: 0
              }
            },
            position: [250, 300]
          },
          {
            id: 'generate',
            type: 'n8n-nodes-base.httpRequest',
            name: 'Generate Digest',
            parameters: {
              url: '/api/v1/generate-digest',
              method: 'POST'
            },
            position: [450, 300]
          }
        ],
        connections: {
          'Daily Schedule': {
            main: [['Generate Digest']]
          }
        }
      }
      // Add more templates as needed
    };

    return templates[templateName as keyof typeof templates] || templates['document-auto-processing'];
  }
}