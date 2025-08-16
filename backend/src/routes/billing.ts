import express from 'express';
import Joi from 'joi';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, requireOrganizationAccess, AuthenticatedRequest } from '../middleware/auth';
import { BillingService } from '../services/billingService';
import { logger } from '../utils/logger';

const router = express.Router();
const billingService = new BillingService();

// Validation schemas
const createSubscriptionSchema = Joi.object({
  paymentMethodId: Joi.string().required(),
  organizationId: Joi.string().uuid().required()
});

const recordUsageSchema = Joi.object({
  deploymentId: Joi.string().uuid().required(),
  date: Joi.string().isoDate().required(),
  gpuHours: Joi.number().min(0).required(),
  storageGbHours: Joi.number().min(0).required(),
  apiRequests: Joi.number().integer().min(0).required(),
  dataProcessedGb: Joi.number().min(0).required(),
  baseCost: Joi.number().min(0).required()
});

// Get billing summary for organization
router.get('/summary/:organizationId', 
  authenticate, 
  requireOrganizationAccess,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;
    const { months = 3 } = req.query;

    const summary = await billingService.getBillingSummary(
      organizationId, 
      Number(months)
    );

    res.json({
      summary
    });
  })
);

// Create subscription for organization
router.post('/subscription', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error, value } = createSubscriptionSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { paymentMethodId, organizationId } = value;

    // Verify user has admin access to organization
    // This would typically be done through requireOrganizationAccess with role check

    const subscription = await billingService.createSubscription(
      organizationId, 
      paymentMethodId
    );

    logger.info('Subscription created via API', { 
      organizationId, 
      subscriptionId: subscription.id,
      createdBy: req.user!.id 
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription
    });
  })
);

// Cancel subscription
router.delete('/subscription/:organizationId', 
  authenticate, 
  requireOrganizationAccess,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;

    await billingService.cancelSubscription(organizationId);

    logger.info('Subscription canceled via API', { 
      organizationId, 
      canceledBy: req.user!.id 
    });

    res.json({
      message: 'Subscription canceled successfully'
    });
  })
);

// Record usage (internal API)
router.post('/usage', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { error, value } = recordUsageSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // This endpoint should typically be called by internal services
    // Add additional authentication/authorization as needed

    const usageRecord = await billingService.recordUsage(
      value.deploymentId, 
      {
        date: value.date,
        gpuHours: value.gpuHours,
        storageGbHours: value.storageGbHours,
        apiRequests: value.apiRequests,
        dataProcessedGb: value.dataProcessedGb,
        baseCost: value.baseCost
      }
    );

    res.status(201).json({
      message: 'Usage recorded successfully',
      usage: usageRecord
    });
  })
);

// Get usage report
router.get('/usage/:organizationId', 
  authenticate, 
  requireOrganizationAccess,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw createError('Start date and end date are required', 400);
    }

    const report = await billingService.generateUsageReport(
      organizationId,
      {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      }
    );

    res.json({
      report
    });
  })
);

// Get deployment usage details
router.get('/usage/:organizationId/deployment/:deploymentId', 
  authenticate, 
  requireOrganizationAccess,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId, deploymentId } = req.params;
    const { days = 30 } = req.query;

    // Get usage records for specific deployment
    const result = await require('../config/database').query(`
      SELECT ur.*, d.name as deployment_name
      FROM usage_records ur
      JOIN deployments d ON d.id = ur.deployment_id
      WHERE d.organization_id = $1 
        AND ur.deployment_id = $2
        AND ur.date >= CURRENT_DATE - INTERVAL '${Number(days)} days'
      ORDER BY ur.date DESC
    `, [organizationId, deploymentId]);

    const usage = result.rows.map(row => ({
      id: row.id,
      deploymentId: row.deployment_id,
      deploymentName: row.deployment_name,
      date: row.date,
      gpuHours: parseFloat(row.gpu_hours),
      storageGbHours: parseFloat(row.storage_gb_hours),
      apiRequests: row.api_requests,
      dataProcessedGb: parseFloat(row.data_processed_gb),
      baseCost: parseFloat(row.base_cost),
      platformFee: parseFloat(row.platform_fee),
      totalCost: parseFloat(row.total_cost)
    }));

    // Calculate summary
    const summary = usage.reduce((acc, record) => ({
      totalGpuHours: acc.totalGpuHours + record.gpuHours,
      totalApiRequests: acc.totalApiRequests + record.apiRequests,
      totalDataProcessed: acc.totalDataProcessed + record.dataProcessedGb,
      totalBaseCost: acc.totalBaseCost + record.baseCost,
      totalPlatformFee: acc.totalPlatformFee + record.platformFee,
      totalCost: acc.totalCost + record.totalCost
    }), {
      totalGpuHours: 0,
      totalApiRequests: 0,
      totalDataProcessed: 0,
      totalBaseCost: 0,
      totalPlatformFee: 0,
      totalCost: 0
    });

    res.json({
      usage,
      summary,
      period: {
        days: Number(days),
        from: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    });
  })
);

// Stripe webhook endpoint
router.post('/webhook', 
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      throw createError('Missing Stripe signature', 400);
    }

    await billingService.handleWebhook(req.body, signature);

    res.json({ received: true });
  })
);

// Report usage to Stripe (admin/cron job endpoint)
router.post('/report-usage/:organizationId', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;
    const { startDate, endDate } = req.body;

    // This should typically be restricted to admin users or internal services
    if (req.user!.role !== 'admin') {
      throw createError('Only administrators can trigger usage reporting', 403);
    }

    await billingService.reportUsageToStripe(
      organizationId,
      {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    );

    logger.info('Usage reported to Stripe via API', { 
      organizationId, 
      reportedBy: req.user!.id 
    });

    res.json({
      message: 'Usage reported to Stripe successfully'
    });
  })
);

// Get pricing information
router.get('/pricing', asyncHandler(async (req, res) => {
  const pricing = {
    platformFeeRate: 0.07, // 7%
    gpuPricing: {
      coreweave: {
        'A100-40GB': 1.60,
        'A100-80GB': 2.20,
        'A40': 1.20,
        'RTX-A6000': 0.80,
        'H100': 4.00
      },
      aws: {
        'p4d.24xlarge': 32.77, // 8x A100 40GB
        'p4de.24xlarge': 40.97, // 8x A100 80GB
        'g5.xlarge': 1.006, // 1x A10G
        'g5.12xlarge': 5.672 // 4x A10G
      },
      gcp: {
        'nvidia-tesla-a100-40gb': 2.93,
        'nvidia-tesla-a100-80gb': 3.67,
        'nvidia-tesla-v100': 2.48,
        'nvidia-tesla-t4': 0.35
      }
    },
    storagePricing: {
      coreweave: 0.10, // per GB/month
      aws: 0.023, // S3 standard
      gcp: 0.020 // Cloud Storage standard
    },
    modelSizeEstimates: {
      '8b': {
        gpuRequirement: '1 GPU',
        estimatedMonthlyCost: {
          coreweave: 300,
          aws: 740,
          gcp: 650
        }
      },
      '70b': {
        gpuRequirement: '2 GPUs',
        estimatedMonthlyCost: {
          coreweave: 1200,
          aws: 2960,
          gcp: 2600
        }
      },
      '405b': {
        gpuRequirement: '8 GPUs',
        estimatedMonthlyCost: {
          coreweave: 9600,
          aws: 23680,
          gcp: 20800
        }
      }
    }
  };

  res.json({ pricing });
}));

// Get invoice history
router.get('/invoices/:organizationId', 
  authenticate, 
  requireOrganizationAccess,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { organizationId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Get organization's Stripe customer ID
    const orgResult = await require('../config/database').query(`
      SELECT stripe_customer_id 
      FROM organizations 
      WHERE id = $1
    `, [organizationId]);

    if (orgResult.rows.length === 0 || !orgResult.rows[0].stripe_customer_id) {
      return res.json({ invoices: [], pagination: { total: 0, limit: Number(limit), offset: Number(offset) } });
    }

    const customerId = orgResult.rows[0].stripe_customer_id;

    // Get invoices from Stripe
    const stripeInvoices = await billingService['stripe'].invoices.list({
      customer: customerId,
      limit: Number(limit),
      starting_after: Number(offset) > 0 ? undefined : undefined // Stripe uses cursor-based pagination
    });

    const invoices = stripeInvoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid || invoice.amount_due,
      currency: invoice.currency,
      created: new Date(invoice.created * 1000),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      downloadUrl: invoice.hosted_invoice_url
    }));

    res.json({
      invoices,
      pagination: {
        total: stripeInvoices.data.length,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: stripeInvoices.has_more
      }
    });
  })
);

export default router;