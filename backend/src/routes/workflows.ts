import express from 'express';
import Joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, requireOrganizationAccess, AuthenticatedRequest } from '../middleware/auth';
import { WorkflowService } from '../services/workflowService';
import { logger } from '../utils/logger';

const router = express.Router();
const workflowService = new WorkflowService();

// Validation schemas
const deployWorkflowSchema = Joi.object({
  templateId: Joi.string().uuid().required(),
  deploymentId: Joi.string().uuid().required(),
  configuration: Joi.object().default({})
});

// Get workflow templates for industry
router.get('/templates', asyncHandler(async (req, res) => {
  const { industry } = req.query;
  
  const templates = await workflowService.getWorkflowTemplates(industry as string);
  
  res.json({
    templates: templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      industry: template.industry,
      isPublic: template.isPublic
    }))
  });
}));

// Get specific workflow template
router.get('/templates/:templateId', asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  
  const templates = await workflowService.getWorkflowTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw createError('Workflow template not found', 404);
  }
  
  res.json({ template });
}));

// Create workflow template (admin only)
router.post('/templates', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const createTemplateSchema = Joi.object({
      name: Joi.string().min(1).max(255).required(),
      description: Joi.string().max(1000).required(),
      industry: Joi.string().valid('legal', 'healthcare', 'finance', 'professional_services').required(),
      workflow: Joi.object().required(),
      isPublic: Joi.boolean().default(false)
    });

    const { error, value } = createTemplateSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // Only admins can create public templates
    if (value.isPublic && req.user!.role !== 'admin') {
      throw createError('Only administrators can create public templates', 403);
    }

    const template = await workflowService.createWorkflowTemplate({
      ...value,
      createdBy: req.user!.id
    });

    logger.info('Workflow template created', { 
      templateId: template.id, 
      createdBy: req.user!.id 
    });

    res.status(201).json({
      message: 'Workflow template created successfully',
      template
    });
  })
);

// Deploy workflow to deployment
router.post('/deploy', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error, value } = deployWorkflowSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { templateId, deploymentId, configuration } = value;

    // Verify user has access to the deployment
    // This would typically check organization membership
    // For now, we'll implement basic validation

    const deployedWorkflow = await workflowService.deployWorkflow(
      deploymentId, 
      templateId, 
      {
        ...configuration,
        apiEndpoint: `https://api-${deploymentId}.ai-platform.com`,
        webhookUrl: `https://webhook-${deploymentId}.ai-platform.com`,
        notificationEmail: req.user!.email
      }
    );

    logger.info('Workflow deployed', { 
      workflowId: deployedWorkflow.id, 
      deploymentId, 
      deployedBy: req.user!.id 
    });

    res.status(201).json({
      message: 'Workflow deployed successfully',
      workflow: deployedWorkflow
    });
  })
);

// Get deployment workflows
router.get('/deployment/:deploymentId', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    // Verify user has access to this deployment
    // This would typically check through deployment service

    const workflows = await workflowService.getDeploymentWorkflows(deploymentId);

    res.json({
      workflows
    });
  })
);

// Toggle workflow active/inactive
router.patch('/:workflowId/toggle', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { workflowId } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      throw createError('Active status must be a boolean', 400);
    }

    // Verify user has access to this workflow
    // This would typically check organization/deployment access

    await workflowService.toggleWorkflow(workflowId, active);

    logger.info('Workflow toggled', { 
      workflowId, 
      active, 
      toggledBy: req.user!.id 
    });

    res.json({
      message: `Workflow ${active ? 'activated' : 'deactivated'} successfully`
    });
  })
);

// Delete workflow
router.delete('/:workflowId', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { workflowId } = req.params;

    // Verify user has access to this workflow
    // This would typically check organization/deployment access

    await workflowService.deleteWorkflow(workflowId);

    logger.info('Workflow deleted', { 
      workflowId, 
      deletedBy: req.user!.id 
    });

    res.json({
      message: 'Workflow deleted successfully'
    });
  })
);

// Get workflow execution history
router.get('/:workflowId/executions', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { workflowId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // This would fetch execution history from n8n
    // For now, return mock data
    const executions = [
      {
        id: 'exec-1',
        workflowId,
        status: 'success',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3550000).toISOString(),
        duration: 50000
      },
      {
        id: 'exec-2',
        workflowId,
        status: 'success',
        startTime: new Date(Date.now() - 7200000).toISOString(),
        endTime: new Date(Date.now() - 7150000).toISOString(),
        duration: 50000
      }
    ];

    res.json({
      executions,
      pagination: {
        total: executions.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  })
);

// Get workflow metrics
router.get('/:workflowId/metrics', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { workflowId } = req.params;
    const { timeRange = '7d' } = req.query;

    // This would fetch metrics from n8n/monitoring system
    // For now, return mock data
    const metrics = {
      totalExecutions: 142,
      successfulExecutions: 138,
      failedExecutions: 4,
      averageExecutionTime: 45000,
      executionsToday: 12,
      lastExecution: new Date(Date.now() - 3600000).toISOString(),
      successRate: 97.2
    };

    res.json({ metrics });
  })
);

// Initialize default templates (admin endpoint)
router.post('/initialize-defaults', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (req.user!.role !== 'admin') {
      throw createError('Only administrators can initialize default templates', 403);
    }

    await workflowService.initializeDefaultTemplates();

    logger.info('Default workflow templates initialized', { 
      initializedBy: req.user!.id 
    });

    res.json({
      message: 'Default workflow templates initialized successfully'
    });
  })
);

// Test workflow endpoint
router.post('/:workflowId/test', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { workflowId } = req.params;
    const { testData } = req.body;

    // This would trigger a test execution of the workflow
    // For now, return mock response
    const testResult = {
      executionId: `test-${Date.now()}`,
      status: 'running',
      message: 'Test execution started'
    };

    logger.info('Workflow test triggered', { 
      workflowId, 
      triggeredBy: req.user!.id 
    });

    res.json({
      message: 'Test execution started',
      result: testResult
    });
  })
);

export default router;