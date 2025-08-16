import axios from 'axios';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  workflow: any; // n8n workflow JSON
  isPublic: boolean;
  createdBy?: string;
}

export interface DeploymentWorkflow {
  id: string;
  deploymentId: string;
  workflowTemplateId: string;
  name: string;
  n8nWorkflowId: string;
  configuration: any;
  status: 'active' | 'inactive' | 'error';
}

export class WorkflowService {
  private n8nBaseUrl: string;
  private n8nApiKey?: string;

  constructor() {
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.n8nApiKey = process.env.N8N_API_KEY;
  }

  // Get industry-specific workflow templates
  async getWorkflowTemplates(industry?: string): Promise<WorkflowTemplate[]> {
    try {
      let query_text = 'SELECT * FROM workflow_templates WHERE is_public = true';
      const queryParams: any[] = [];

      if (industry) {
        query_text += ' AND industry = $1';
        queryParams.push(industry);
      }

      query_text += ' ORDER BY created_at DESC';

      const result = await query(query_text, queryParams);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        industry: row.industry,
        workflow: row.template_data,
        isPublic: row.is_public,
        createdBy: row.created_by
      }));
    } catch (error) {
      logger.error('Failed to get workflow templates', { error, industry });
      throw error;
    }
  }

  // Create workflow template
  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id'>): Promise<WorkflowTemplate> {
    try {
      const result = await query(`
        INSERT INTO workflow_templates (name, description, industry, template_data, is_public, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        template.name,
        template.description,
        template.industry,
        JSON.stringify(template.workflow),
        template.isPublic,
        template.createdBy
      ]);

      const createdTemplate = result.rows[0];
      logger.info('Workflow template created', { templateId: createdTemplate.id, name: template.name });

      return {
        id: createdTemplate.id,
        name: createdTemplate.name,
        description: createdTemplate.description,
        industry: createdTemplate.industry,
        workflow: createdTemplate.template_data,
        isPublic: createdTemplate.is_public,
        createdBy: createdTemplate.created_by
      };
    } catch (error) {
      logger.error('Failed to create workflow template', { error, template });
      throw error;
    }
  }

  // Deploy workflow to n8n instance
  async deployWorkflow(deploymentId: string, templateId: string, configuration: any): Promise<DeploymentWorkflow> {
    try {
      // Get template
      const templateResult = await query('SELECT * FROM workflow_templates WHERE id = $1', [templateId]);
      if (templateResult.rows.length === 0) {
        throw new Error('Workflow template not found');
      }

      const template = templateResult.rows[0];
      
      // Customize workflow with deployment-specific configuration
      const customizedWorkflow = this.customizeWorkflow(template.template_data, deploymentId, configuration);

      // Deploy to n8n
      const n8nWorkflow = await this.createN8nWorkflow(customizedWorkflow);

      // Save deployment workflow record
      const result = await query(`
        INSERT INTO deployment_workflows (deployment_id, workflow_template_id, name, n8n_workflow_id, configuration, status)
        VALUES ($1, $2, $3, $4, $5, 'active')
        RETURNING *
      `, [
        deploymentId,
        templateId,
        `${template.name} - ${deploymentId.substring(0, 8)}`,
        n8nWorkflow.id,
        JSON.stringify(configuration)
      ]);

      const deployedWorkflow = result.rows[0];
      logger.info('Workflow deployed', { 
        deploymentId, 
        workflowId: deployedWorkflow.id, 
        n8nWorkflowId: n8nWorkflow.id 
      });

      return {
        id: deployedWorkflow.id,
        deploymentId: deployedWorkflow.deployment_id,
        workflowTemplateId: deployedWorkflow.workflow_template_id,
        name: deployedWorkflow.name,
        n8nWorkflowId: deployedWorkflow.n8n_workflow_id,
        configuration: deployedWorkflow.configuration,
        status: deployedWorkflow.status
      };
    } catch (error) {
      logger.error('Failed to deploy workflow', { error, deploymentId, templateId });
      throw error;
    }
  }

  // Get deployment workflows
  async getDeploymentWorkflows(deploymentId: string): Promise<DeploymentWorkflow[]> {
    try {
      const result = await query(`
        SELECT dw.*, wt.name as template_name
        FROM deployment_workflows dw
        JOIN workflow_templates wt ON wt.id = dw.workflow_template_id
        WHERE dw.deployment_id = $1
        ORDER BY dw.created_at DESC
      `, [deploymentId]);

      return result.rows.map(row => ({
        id: row.id,
        deploymentId: row.deployment_id,
        workflowTemplateId: row.workflow_template_id,
        name: row.name,
        n8nWorkflowId: row.n8n_workflow_id,
        configuration: row.configuration,
        status: row.status
      }));
    } catch (error) {
      logger.error('Failed to get deployment workflows', { error, deploymentId });
      throw error;
    }
  }

  // Activate/deactivate workflow
  async toggleWorkflow(workflowId: string, active: boolean): Promise<void> {
    try {
      // Get workflow
      const workflowResult = await query('SELECT * FROM deployment_workflows WHERE id = $1', [workflowId]);
      if (workflowResult.rows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflow = workflowResult.rows[0];

      // Toggle in n8n
      await this.toggleN8nWorkflow(workflow.n8n_workflow_id, active);

      // Update database
      await query(`
        UPDATE deployment_workflows 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `, [active ? 'active' : 'inactive', workflowId]);

      logger.info('Workflow toggled', { workflowId, active });
    } catch (error) {
      logger.error('Failed to toggle workflow', { error, workflowId, active });
      throw error;
    }
  }

  // Delete deployment workflow
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      // Get workflow
      const workflowResult = await query('SELECT * FROM deployment_workflows WHERE id = $1', [workflowId]);
      if (workflowResult.rows.length === 0) {
        throw new Error('Workflow not found');
      }

      const workflow = workflowResult.rows[0];

      // Delete from n8n
      await this.deleteN8nWorkflow(workflow.n8n_workflow_id);

      // Delete from database
      await query('DELETE FROM deployment_workflows WHERE id = $1', [workflowId]);

      logger.info('Workflow deleted', { workflowId });
    } catch (error) {
      logger.error('Failed to delete workflow', { error, workflowId });
      throw error;
    }
  }

  // n8n API methods
  private async createN8nWorkflow(workflow: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.n8nBaseUrl}/api/v1/workflows`,
        workflow,
        {
          headers: {
            'Authorization': `Bearer ${this.n8nApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to create n8n workflow', { error });
      throw error;
    }
  }

  private async toggleN8nWorkflow(workflowId: string, active: boolean): Promise<void> {
    try {
      await axios.patch(
        `${this.n8nBaseUrl}/api/v1/workflows/${workflowId}/${active ? 'activate' : 'deactivate'}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.n8nApiKey}`
          }
        }
      );
    } catch (error) {
      logger.error('Failed to toggle n8n workflow', { error, workflowId, active });
      throw error;
    }
  }

  private async deleteN8nWorkflow(workflowId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.n8nBaseUrl}/api/v1/workflows/${workflowId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.n8nApiKey}`
          }
        }
      );
    } catch (error) {
      logger.error('Failed to delete n8n workflow', { error, workflowId });
      throw error;
    }
  }

  // Customize workflow template for specific deployment
  private customizeWorkflow(template: any, deploymentId: string, configuration: any): any {
    const workflow = JSON.parse(JSON.stringify(template)); // Deep clone

    // Replace placeholders in workflow nodes
    this.replaceWorkflowPlaceholders(workflow, {
      deployment_id: deploymentId,
      api_endpoint: configuration.apiEndpoint || `https://api-${deploymentId}.ai-platform.com`,
      webhook_url: configuration.webhookUrl || `https://webhook-${deploymentId}.ai-platform.com`,
      ...configuration
    });

    return workflow;
  }

  private replaceWorkflowPlaceholders(obj: any, replacements: Record<string, string>): void {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => replacements[key] || match);
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => this.replaceWorkflowPlaceholders(item, replacements));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].replace(/\{\{(\w+)\}\}/g, (match, key) => replacements[key] || match);
        } else {
          this.replaceWorkflowPlaceholders(obj[key], replacements);
        }
      });
    }
  }

  // Initialize default workflow templates
  async initializeDefaultTemplates(): Promise<void> {
    try {
      // Check if templates already exist
      const existingTemplates = await query('SELECT COUNT(*) as count FROM workflow_templates WHERE is_public = true');
      if (existingTemplates.rows[0].count > 0) {
        logger.info('Default workflow templates already exist');
        return;
      }

      // Create default templates
      const templates = [
        {
          name: 'Document Auto-Processing',
          description: 'Automatically process new documents uploaded to the system',
          industry: 'legal',
          workflow: this.getDocumentProcessingWorkflow(),
          isPublic: true
        },
        {
          name: 'Daily Digest Generation',
          description: 'Generate daily summary reports of processed documents',
          industry: 'legal',
          workflow: this.getDailyDigestWorkflow(),
          isPublic: true
        },
        {
          name: 'Contract Analysis Alert',
          description: 'Alert when high-risk clauses are detected in contracts',
          industry: 'legal',
          workflow: this.getContractAnalysisWorkflow(),
          isPublic: true
        },
        {
          name: 'Patient Data Processing',
          description: 'Process and analyze patient documents with HIPAA compliance',
          industry: 'healthcare',
          workflow: this.getPatientDataWorkflow(),
          isPublic: true
        },
        {
          name: 'Financial Report Analysis',
          description: 'Analyze financial documents and generate insights',
          industry: 'finance',
          workflow: this.getFinancialAnalysisWorkflow(),
          isPublic: true
        }
      ];

      for (const template of templates) {
        await this.createWorkflowTemplate(template);
      }

      logger.info('Default workflow templates initialized');
    } catch (error) {
      logger.error('Failed to initialize default templates', { error });
      throw error;
    }
  }

  // Workflow template definitions
  private getDocumentProcessingWorkflow(): any {
    return {
      name: 'Document Auto-Processing',
      nodes: [
        {
          id: 'webhook',
          name: 'Document Upload Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'document-upload',
            httpMethod: 'POST',
            responseMode: 'onReceived'
          }
        },
        {
          id: 'http-request',
          name: 'Extract Text',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: '{{api_endpoint}}/documents/extract',
            method: 'POST',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'document_id',
                  value: '={{$node["Document Upload Webhook"].json["document_id"]}}'
                }
              ]
            }
          }
        },
        {
          id: 'ai-analysis',
          name: 'AI Analysis',
          type: 'n8n-nodes-base.httpRequest',
          position: [650, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/analyze',
            method: 'POST',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'text',
                  value: '={{$node["Extract Text"].json["extracted_text"]}}'
                },
                {
                  name: 'analysis_type',
                  value: 'comprehensive'
                }
              ]
            }
          }
        },
        {
          id: 'notification',
          name: 'Send Notification',
          type: 'n8n-nodes-base.emailSend',
          position: [850, 300],
          parameters: {
            to: '{{notification_email}}',
            subject: 'Document Processing Complete',
            text: 'Document {{$node["Document Upload Webhook"].json["filename"]}} has been processed and analyzed.'
          }
        }
      ],
      connections: {
        'Document Upload Webhook': {
          main: [
            [
              {
                node: 'Extract Text',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Extract Text': {
          main: [
            [
              {
                node: 'AI Analysis',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'AI Analysis': {
          main: [
            [
              {
                node: 'Send Notification',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };
  }

  private getDailyDigestWorkflow(): any {
    return {
      name: 'Daily Digest Generation',
      nodes: [
        {
          id: 'cron',
          name: 'Daily Trigger',
          type: 'n8n-nodes-base.cron',
          position: [250, 300],
          parameters: {
            rule: {
              hour: 9,
              minute: 0
            }
          }
        },
        {
          id: 'get-documents',
          name: 'Get Recent Documents',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: '{{api_endpoint}}/documents/recent',
            method: 'GET',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendQuery: true,
            queryParameters: {
              parameters: [
                {
                  name: 'days',
                  value: '1'
                }
              ]
            }
          }
        },
        {
          id: 'generate-summary',
          name: 'Generate Summary',
          type: 'n8n-nodes-base.httpRequest',
          position: [650, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/summarize',
            method: 'POST',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'documents',
                  value: '={{$node["Get Recent Documents"].json["documents"]}}'
                },
                {
                  name: 'summary_type',
                  value: 'daily_digest'
                }
              ]
            }
          }
        },
        {
          id: 'send-digest',
          name: 'Send Daily Digest',
          type: 'n8n-nodes-base.emailSend',
          position: [850, 300],
          parameters: {
            to: '{{digest_email}}',
            subject: 'Daily Document Digest - {{new Date().toDateString()}}',
            html: '={{$node["Generate Summary"].json["summary_html"]}}'
          }
        }
      ],
      connections: {
        'Daily Trigger': {
          main: [
            [
              {
                node: 'Get Recent Documents',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Get Recent Documents': {
          main: [
            [
              {
                node: 'Generate Summary',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Generate Summary': {
          main: [
            [
              {
                node: 'Send Daily Digest',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };
  }

  private getContractAnalysisWorkflow(): any {
    return {
      name: 'Contract Analysis Alert',
      nodes: [
        {
          id: 'webhook',
          name: 'Contract Upload',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'contract-analysis',
            httpMethod: 'POST'
          }
        },
        {
          id: 'analyze-contract',
          name: 'Analyze Contract',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/analyze-contract',
            method: 'POST',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'contract_id',
                  value: '={{$node["Contract Upload"].json["contract_id"]}}'
                }
              ]
            }
          }
        },
        {
          id: 'check-risk',
          name: 'Check Risk Level',
          type: 'n8n-nodes-base.if',
          position: [650, 300],
          parameters: {
            conditions: {
              string: [
                {
                  value1: '={{$node["Analyze Contract"].json["risk_level"]}}',
                  operation: 'equal',
                  value2: 'high'
                }
              ]
            }
          }
        },
        {
          id: 'send-alert',
          name: 'Send Risk Alert',
          type: 'n8n-nodes-base.emailSend',
          position: [850, 200],
          parameters: {
            to: '{{legal_team_email}}',
            subject: 'HIGH RISK CONTRACT DETECTED',
            html: 'A high-risk contract has been detected. Please review immediately.<br><br>Detected issues: {{$node["Analyze Contract"].json["risk_factors"]}}'
          }
        },
        {
          id: 'log-analysis',
          name: 'Log Analysis',
          type: 'n8n-nodes-base.httpRequest',
          position: [850, 400],
          parameters: {
            url: '{{api_endpoint}}/contracts/log-analysis',
            method: 'POST',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer {{api_key}}'
                }
              ]
            },
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'contract_id',
                  value: '={{$node["Contract Upload"].json["contract_id"]}}'
                },
                {
                  name: 'analysis_result',
                  value: '={{$node["Analyze Contract"].json}}'
                }
              ]
            }
          }
        }
      ],
      connections: {
        'Contract Upload': {
          main: [
            [
              {
                node: 'Analyze Contract',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Analyze Contract': {
          main: [
            [
              {
                node: 'Check Risk Level',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'Check Risk Level': {
          main: [
            [
              {
                node: 'Send Risk Alert',
                type: 'main',
                index: 0
              }
            ],
            [
              {
                node: 'Log Analysis',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };
  }

  private getPatientDataWorkflow(): any {
    // HIPAA-compliant patient data processing workflow
    return {
      name: 'Patient Data Processing',
      nodes: [
        {
          id: 'secure-webhook',
          name: 'Secure Patient Data Webhook',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'patient-data',
            httpMethod: 'POST',
            authentication: 'basicAuth'
          }
        },
        {
          id: 'validate-hipaa',
          name: 'HIPAA Validation',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: '{{api_endpoint}}/compliance/hipaa-validate',
            method: 'POST'
          }
        },
        {
          id: 'process-data',
          name: 'Process Patient Data',
          type: 'n8n-nodes-base.httpRequest',
          position: [650, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/analyze-patient-data',
            method: 'POST'
          }
        },
        {
          id: 'audit-log',
          name: 'Create Audit Log',
          type: 'n8n-nodes-base.httpRequest',
          position: [850, 300],
          parameters: {
            url: '{{api_endpoint}}/audit/log',
            method: 'POST'
          }
        }
      ],
      connections: {
        'Secure Patient Data Webhook': {
          main: [[{ node: 'HIPAA Validation', type: 'main', index: 0 }]]
        },
        'HIPAA Validation': {
          main: [[{ node: 'Process Patient Data', type: 'main', index: 0 }]]
        },
        'Process Patient Data': {
          main: [[{ node: 'Create Audit Log', type: 'main', index: 0 }]]
        }
      }
    };
  }

  private getFinancialAnalysisWorkflow(): any {
    return {
      name: 'Financial Report Analysis',
      nodes: [
        {
          id: 'webhook',
          name: 'Financial Report Upload',
          type: 'n8n-nodes-base.webhook',
          position: [250, 300],
          parameters: {
            path: 'financial-report',
            httpMethod: 'POST'
          }
        },
        {
          id: 'extract-financial-data',
          name: 'Extract Financial Data',
          type: 'n8n-nodes-base.httpRequest',
          position: [450, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/extract-financial-data',
            method: 'POST'
          }
        },
        {
          id: 'risk-analysis',
          name: 'Risk Analysis',
          type: 'n8n-nodes-base.httpRequest',
          position: [650, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/financial-risk-analysis',
            method: 'POST'
          }
        },
        {
          id: 'generate-insights',
          name: 'Generate Insights',
          type: 'n8n-nodes-base.httpRequest',
          position: [850, 300],
          parameters: {
            url: '{{api_endpoint}}/ai/financial-insights',
            method: 'POST'
          }
        }
      ],
      connections: {
        'Financial Report Upload': {
          main: [[{ node: 'Extract Financial Data', type: 'main', index: 0 }]]
        },
        'Extract Financial Data': {
          main: [[{ node: 'Risk Analysis', type: 'main', index: 0 }]]
        },
        'Risk Analysis': {
          main: [[{ node: 'Generate Insights', type: 'main', index: 0 }]]
        }
      }
    };
  }
}