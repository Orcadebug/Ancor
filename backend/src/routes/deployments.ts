import express from 'express';
import Joi from 'joi';
import { query, transaction } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, requireOrganizationAccess, AuthenticatedRequest } from '../middleware/auth';
import { CloudOrchestrator } from '../services/cloudOrchestrator';
import { logger } from '../utils/logger';

const router = express.Router();
const cloudOrchestrator = new CloudOrchestrator();

// Validation schemas
const deploymentSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  organizationId: Joi.string().uuid().required(),
  industryTemplate: Joi.string().valid('legal', 'healthcare', 'finance', 'professional_services').required(),
  cloudProvider: Joi.string().valid('coreweave', 'aws', 'gcp', 'azure').required(),
  region: Joi.string().required(),
  modelSize: Joi.string().valid('8b', '70b', '405b').required(),
  gpuType: Joi.string().required(),
  gpuCount: Joi.number().integer().min(1).max(16).required(),
  configuration: Joi.object().required()
});

// Get all deployments for organization
router.get('/organization/:organizationId', 
  authenticate, 
  requireOrganizationAccess, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE organization_id = $1';
    const queryParams = [organizationId];
    
    if (status && typeof status === 'string') {
      whereClause += ' AND status = $2';
      queryParams.push(status);
    }

    const result = await query(`
      SELECT d.*, 
             COUNT(*) OVER() as total_count,
             (SELECT COUNT(*) FROM documents WHERE deployment_id = d.id) as document_count
      FROM deployments d
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `, queryParams);

    res.json({
      deployments: result.rows,
      pagination: {
        total: result.rows[0]?.total_count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  })
);

// Get deployment by ID
router.get('/:deploymentId', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    const result = await query(`
      SELECT d.*, o.name as organization_name,
             (SELECT COUNT(*) FROM documents WHERE deployment_id = d.id) as document_count,
             (SELECT COUNT(*) FROM deployment_workflows WHERE deployment_id = d.id AND status = 'active') as active_workflows
      FROM deployments d
      JOIN organizations o ON o.id = d.organization_id
      JOIN organization_members om ON om.organization_id = o.id
      WHERE d.id = $1 AND om.user_id = $2
    `, [deploymentId, req.user!.id]);

    if (result.rows.length === 0) {
      throw createError('Deployment not found or access denied', 404);
    }

    res.json({ deployment: result.rows[0] });
  })
);

// Create new deployment
router.post('/', 
  authenticate, 
  requireOrganizationAccess, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error, value } = deploymentSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const {
      name,
      organizationId,
      industryTemplate,
      cloudProvider,
      region,
      modelSize,
      gpuType,
      gpuCount,
      configuration
    } = value;

    // Calculate estimated cost
    const costPerHour = await cloudOrchestrator.calculateCost({
      cloudProvider,
      gpuType,
      gpuCount,
      region
    });

    // Create deployment record
    const result = await transaction(async (txQuery) => {
      const deploymentResult = await txQuery(`
        INSERT INTO deployments (
          organization_id, name, industry_template, cloud_provider, region,
          model_size, gpu_type, gpu_count, cost_per_hour, configuration, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING *
      `, [
        organizationId, name, industryTemplate, cloudProvider, region,
        modelSize, gpuType, gpuCount, costPerHour, JSON.stringify(configuration)
      ]);

      const deployment = deploymentResult.rows[0];

      // Log audit trail
      await txQuery(`
        INSERT INTO audit_logs (user_id, organization_id, deployment_id, action, resource_type, resource_id, details)
        VALUES ($1, $2, $3, 'create', 'deployment', $4, $5)
      `, [
        req.user!.id,
        organizationId,
        deployment.id,
        deployment.id,
        JSON.stringify({ name, cloudProvider, modelSize })
      ]);

      return deployment;
    });

    // Start provisioning process asynchronously
    cloudOrchestrator.provisionDeployment(result.id, value)
      .catch(error => {
        logger.error('Deployment provisioning failed', { 
          deploymentId: result.id, 
          error: error.message 
        });
      });

    logger.info('Deployment created', { 
      deploymentId: result.id, 
      organizationId, 
      cloudProvider, 
      modelSize 
    });

    res.status(201).json({
      message: 'Deployment created successfully',
      deployment: result
    });
  })
);

// Update deployment status
router.patch('/:deploymentId/status', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;
    const { status, endpointUrl, adminCredentials } = req.body;

    const validStatuses = ['pending', 'provisioning', 'active', 'error', 'terminated'];
    if (!validStatuses.includes(status)) {
      throw createError('Invalid status', 400);
    }

    // Verify user has access to this deployment
    const accessCheck = await query(`
      SELECT d.id, d.organization_id
      FROM deployments d
      JOIN organization_members om ON om.organization_id = d.organization_id
      WHERE d.id = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin')
    `, [deploymentId, req.user!.id]);

    if (accessCheck.rows.length === 0) {
      throw createError('Deployment not found or insufficient permissions', 404);
    }

    const updateFields = ['status = $2'];
    const updateValues = [deploymentId, status];
    let paramCounter = 3;

    if (endpointUrl) {
      updateFields.push(`endpoint_url = $${paramCounter}`);
      updateValues.push(endpointUrl);
      paramCounter++;
    }

    if (adminCredentials) {
      updateFields.push(`admin_credentials = $${paramCounter}`);
      updateValues.push(JSON.stringify(adminCredentials));
      paramCounter++;
    }

    const result = await query(`
      UPDATE deployments 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, updateValues);

    logger.info('Deployment status updated', { 
      deploymentId, 
      status, 
      updatedBy: req.user!.id 
    });

    res.json({
      message: 'Deployment status updated',
      deployment: result.rows[0]
    });
  })
);

// Delete/terminate deployment
router.delete('/:deploymentId', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;

    // Verify user has access and is owner/admin
    const accessCheck = await query(`
      SELECT d.id, d.organization_id, d.status, d.cloud_provider
      FROM deployments d
      JOIN organization_members om ON om.organization_id = d.organization_id
      WHERE d.id = $1 AND om.user_id = $2 AND om.role IN ('owner', 'admin')
    `, [deploymentId, req.user!.id]);

    if (accessCheck.rows.length === 0) {
      throw createError('Deployment not found or insufficient permissions', 404);
    }

    const deployment = accessCheck.rows[0];

    // Start termination process
    if (deployment.status === 'active') {
      await cloudOrchestrator.terminateDeployment(deploymentId);
    }

    // Update status to terminated
    await query(`
      UPDATE deployments 
      SET status = 'terminated', updated_at = NOW()
      WHERE id = $1
    `, [deploymentId]);

    logger.info('Deployment terminated', { 
      deploymentId, 
      organizationId: deployment.organization_id,
      terminatedBy: req.user!.id 
    });

    res.json({
      message: 'Deployment termination initiated'
    });
  })
);

// Get deployment metrics
router.get('/:deploymentId/metrics', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { deploymentId } = req.params;
    const { days = 7 } = req.query;

    // Verify access
    const accessCheck = await query(`
      SELECT d.id
      FROM deployments d
      JOIN organization_members om ON om.organization_id = d.organization_id
      WHERE d.id = $1 AND om.user_id = $2
    `, [deploymentId, req.user!.id]);

    if (accessCheck.rows.length === 0) {
      throw createError('Deployment not found or access denied', 404);
    }

    // Get usage metrics
    const metricsResult = await query(`
      SELECT 
        date,
        gpu_hours,
        storage_gb_hours,
        api_requests,
        data_processed_gb,
        total_cost
      FROM usage_records
      WHERE deployment_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${Number(days)} days'
      ORDER BY date DESC
    `, [deploymentId]);

    // Get summary stats
    const summaryResult = await query(`
      SELECT 
        SUM(gpu_hours) as total_gpu_hours,
        SUM(api_requests) as total_api_requests,
        SUM(data_processed_gb) as total_data_processed,
        SUM(total_cost) as total_cost,
        AVG(total_cost) as avg_daily_cost
      FROM usage_records
      WHERE deployment_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${Number(days)} days'
    `, [deploymentId]);

    res.json({
      metrics: metricsResult.rows,
      summary: summaryResult.rows[0] || {
        total_gpu_hours: 0,
        total_api_requests: 0,
        total_data_processed: 0,
        total_cost: 0,
        avg_daily_cost: 0
      }
    });
  })
);

export default router;