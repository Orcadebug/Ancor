import Stripe from 'stripe';
import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';

export interface BillingConfig {
  stripeSecretKey: string;
  webhookSecret: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  deploymentId: string;
  date: string;
  gpuHours: number;
  storageGbHours: number;
  apiRequests: number;
  dataProcessedGb: number;
  baseCost: number;
  platformFee: number;
  totalCost: number;
}

export interface Invoice {
  id: string;
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  subtotal: number;
  platformFee: number;
  total: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible';
  dueDate: Date;
  paidAt?: Date;
}

export class BillingService {
  private stripe: Stripe;
  private webhookSecret: string;
  private platformFeeRate: number = 0.07; // 7% markup

  constructor(config?: BillingConfig) {
    const stripeSecretKey = config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = config?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
  }

  // Create Stripe customer for organization
  async createCustomer(organizationId: string, organizationData: {
    name: string;
    email: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        name: organizationData.name,
        email: organizationData.email,
        metadata: {
          organizationId,
          ...organizationData.metadata
        }
      });

      // Update organization with Stripe customer ID
      await query(`
        UPDATE organizations 
        SET stripe_customer_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [customer.id, organizationId]);

      logger.info('Stripe customer created', { 
        organizationId, 
        customerId: customer.id 
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, organizationId });
      throw error;
    }
  }

  // Create subscription for organization
  async createSubscription(
    organizationId: string, 
    paymentMethodId: string
  ): Promise<Subscription> {
    try {
      // Get organization with Stripe customer ID
      const orgResult = await query(`
        SELECT stripe_customer_id, billing_email 
        FROM organizations 
        WHERE id = $1
      `, [organizationId]);

      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const organization = orgResult.rows[0];
      let customerId = organization.stripe_customer_id;

      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(organizationId, {
          name: `Organization ${organizationId}`,
          email: organization.billing_email
        });
        customerId = customer.id;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription with usage-based pricing
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'AI Platform Usage',
                description: 'Pay-as-you-go AI infrastructure usage'
              },
              unit_amount: 1, // $0.01 base
              recurring: {
                interval: 'month',
                usage_type: 'metered'
              }
            }
          }
        ],
        collection_method: 'charge_automatically',
        metadata: {
          organizationId
        }
      });

      // Save subscription to database
      const result = await query(`
        INSERT INTO subscriptions (
          organization_id, stripe_subscription_id, status,
          current_period_start, current_period_end
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        organizationId,
        stripeSubscription.id,
        stripeSubscription.status,
        new Date(stripeSubscription.current_period_start * 1000),
        new Date(stripeSubscription.current_period_end * 1000)
      ]);

      const subscription = result.rows[0];

      logger.info('Subscription created', { 
        organizationId, 
        subscriptionId: subscription.id,
        stripeSubscriptionId: stripeSubscription.id
      });

      return {
        id: subscription.id,
        organizationId: subscription.organization_id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at
      };
    } catch (error) {
      logger.error('Failed to create subscription', { error, organizationId });
      throw error;
    }
  }

  // Record usage for billing
  async recordUsage(deploymentId: string, usage: {
    date: string;
    gpuHours: number;
    storageGbHours: number;
    apiRequests: number;
    dataProcessedGb: number;
    baseCost: number;
  }): Promise<UsageRecord> {
    try {
      const platformFee = usage.baseCost * this.platformFeeRate;
      const totalCost = usage.baseCost + platformFee;

      const result = await query(`
        INSERT INTO usage_records (
          deployment_id, date, gpu_hours, storage_gb_hours, 
          api_requests, data_processed_gb, base_cost, platform_fee, total_cost
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (deployment_id, date) 
        DO UPDATE SET
          gpu_hours = EXCLUDED.gpu_hours,
          storage_gb_hours = EXCLUDED.storage_gb_hours,
          api_requests = EXCLUDED.api_requests,
          data_processed_gb = EXCLUDED.data_processed_gb,
          base_cost = EXCLUDED.base_cost,
          platform_fee = EXCLUDED.platform_fee,
          total_cost = EXCLUDED.total_cost,
          created_at = NOW()
        RETURNING *
      `, [
        deploymentId,
        usage.date,
        usage.gpuHours,
        usage.storageGbHours,
        usage.apiRequests,
        usage.dataProcessedGb,
        usage.baseCost,
        platformFee,
        totalCost
      ]);

      const usageRecord = result.rows[0];

      logger.info('Usage recorded', { 
        deploymentId, 
        date: usage.date,
        totalCost 
      });

      return {
        id: usageRecord.id,
        deploymentId: usageRecord.deployment_id,
        date: usageRecord.date,
        gpuHours: parseFloat(usageRecord.gpu_hours),
        storageGbHours: parseFloat(usageRecord.storage_gb_hours),
        apiRequests: usageRecord.api_requests,
        dataProcessedGb: parseFloat(usageRecord.data_processed_gb),
        baseCost: parseFloat(usageRecord.base_cost),
        platformFee: parseFloat(usageRecord.platform_fee),
        totalCost: parseFloat(usageRecord.total_cost)
      };
    } catch (error) {
      logger.error('Failed to record usage', { error, deploymentId, usage });
      throw error;
    }
  }

  // Report usage to Stripe for billing
  async reportUsageToStripe(organizationId: string, period: {
    start: Date;
    end: Date;
  }): Promise<void> {
    try {
      // Get organization's subscription
      const subscriptionResult = await query(`
        SELECT stripe_subscription_id 
        FROM subscriptions 
        WHERE organization_id = $1 AND status = 'active'
      `, [organizationId]);

      if (subscriptionResult.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const stripeSubscriptionId = subscriptionResult.rows[0].stripe_subscription_id;

      // Get usage for the period
      const usageResult = await query(`
        SELECT SUM(total_cost) as total_usage
        FROM usage_records ur
        JOIN deployments d ON d.id = ur.deployment_id
        WHERE d.organization_id = $1 
          AND ur.date >= $2 
          AND ur.date <= $3
      `, [organizationId, period.start.toISOString().split('T')[0], period.end.toISOString().split('T')[0]]);

      const totalUsage = parseFloat(usageResult.rows[0]?.total_usage || '0');

      if (totalUsage > 0) {
        // Get subscription items
        const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
        const subscriptionItem = subscription.items.data[0];

        // Report usage to Stripe (in cents)
        await this.stripe.subscriptionItems.createUsageRecord(subscriptionItem.id, {
          quantity: Math.round(totalUsage * 100), // Convert to cents
          timestamp: Math.floor(period.end.getTime() / 1000),
          action: 'set'
        });

        logger.info('Usage reported to Stripe', { 
          organizationId, 
          totalUsage,
          period 
        });
      }
    } catch (error) {
      logger.error('Failed to report usage to Stripe', { error, organizationId, period });
      throw error;
    }
  }

  // Get organization billing summary
  async getBillingSummary(organizationId: string, months: number = 3): Promise<{
    subscription: Subscription | null;
    currentPeriodUsage: number;
    monthlyUsage: Array<{
      month: string;
      usage: number;
      cost: number;
    }>;
    totalSpent: number;
  }> {
    try {
      // Get subscription
      const subscriptionResult = await query(`
        SELECT * FROM subscriptions 
        WHERE organization_id = $1 AND status = 'active'
        ORDER BY created_at DESC LIMIT 1
      `, [organizationId]);

      const subscription = subscriptionResult.rows[0] ? {
        id: subscriptionResult.rows[0].id,
        organizationId: subscriptionResult.rows[0].organization_id,
        stripeSubscriptionId: subscriptionResult.rows[0].stripe_subscription_id,
        status: subscriptionResult.rows[0].status,
        currentPeriodStart: subscriptionResult.rows[0].current_period_start,
        currentPeriodEnd: subscriptionResult.rows[0].current_period_end,
        createdAt: subscriptionResult.rows[0].created_at,
        updatedAt: subscriptionResult.rows[0].updated_at
      } : null;

      // Get current period usage
      const currentPeriodResult = await query(`
        SELECT COALESCE(SUM(ur.total_cost), 0) as current_usage
        FROM usage_records ur
        JOIN deployments d ON d.id = ur.deployment_id
        WHERE d.organization_id = $1 
          AND ur.date >= $2
      `, [organizationId, subscription?.currentPeriodStart || new Date()]);

      const currentPeriodUsage = parseFloat(currentPeriodResult.rows[0].current_usage);

      // Get monthly usage breakdown
      const monthlyUsageResult = await query(`
        SELECT 
          DATE_TRUNC('month', ur.date::date) as month,
          COALESCE(SUM(ur.total_cost), 0) as cost
        FROM usage_records ur
        JOIN deployments d ON d.id = ur.deployment_id
        WHERE d.organization_id = $1 
          AND ur.date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', ur.date::date)
        ORDER BY month DESC
      `, [organizationId]);

      const monthlyUsage = monthlyUsageResult.rows.map(row => ({
        month: row.month.toISOString().substring(0, 7), // YYYY-MM format
        usage: 0, // Could calculate total usage metrics
        cost: parseFloat(row.cost)
      }));

      // Get total spent
      const totalSpentResult = await query(`
        SELECT COALESCE(SUM(ur.total_cost), 0) as total_spent
        FROM usage_records ur
        JOIN deployments d ON d.id = ur.deployment_id
        WHERE d.organization_id = $1
      `, [organizationId]);

      const totalSpent = parseFloat(totalSpentResult.rows[0].total_spent);

      return {
        subscription,
        currentPeriodUsage,
        monthlyUsage,
        totalSpent
      };
    } catch (error) {
      logger.error('Failed to get billing summary', { error, organizationId });
      throw error;
    }
  }

  // Handle Stripe webhook
  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info('Stripe webhook received', { eventType: event.type });

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionEvent(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }
    } catch (error) {
      logger.error('Webhook handling failed', { error });
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(organizationId: string): Promise<void> {
    try {
      const subscriptionResult = await query(`
        SELECT stripe_subscription_id 
        FROM subscriptions 
        WHERE organization_id = $1 AND status = 'active'
      `, [organizationId]);

      if (subscriptionResult.rows.length === 0) {
        throw new Error('No active subscription found');
      }

      const stripeSubscriptionId = subscriptionResult.rows[0].stripe_subscription_id;

      // Cancel at period end
      await this.stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update database
      await query(`
        UPDATE subscriptions 
        SET status = 'canceled', updated_at = NOW()
        WHERE organization_id = $1
      `, [organizationId]);

      logger.info('Subscription canceled', { organizationId });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, organizationId });
      throw error;
    }
  }

  // Private methods for webhook handling
  private async handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata.organizationId;
    
    if (!organizationId) {
      logger.warn('Subscription event without organizationId', { subscriptionId: subscription.id });
      return;
    }

    await query(`
      UPDATE subscriptions 
      SET 
        status = $1,
        current_period_start = $2,
        current_period_end = $3,
        updated_at = NOW()
      WHERE stripe_subscription_id = $4
    `, [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id
    ]);

    logger.info('Subscription updated', { organizationId, status: subscription.status });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
    await query(`
      UPDATE subscriptions 
      SET status = 'canceled', updated_at = NOW()
      WHERE stripe_subscription_id = $1
    `, [subscription.id]);

    logger.info('Subscription canceled', { subscriptionId: subscription.id });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Payment succeeded', { 
      invoiceId: invoice.id, 
      amount: invoice.amount_paid 
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.error('Payment failed', { 
      invoiceId: invoice.id, 
      amount: invoice.amount_due 
    });
  }

  // Generate usage report
  async generateUsageReport(organizationId: string, period: {
    start: Date;
    end: Date;
  }): Promise<{
    period: { start: Date; end: Date };
    deployments: Array<{
      deploymentId: string;
      deploymentName: string;
      usage: UsageRecord[];
      totalCost: number;
    }>;
    totalCost: number;
    breakdown: {
      baseCost: number;
      platformFee: number;
    };
  }> {
    try {
      const usageResult = await query(`
        SELECT 
          ur.*,
          d.name as deployment_name
        FROM usage_records ur
        JOIN deployments d ON d.id = ur.deployment_id
        WHERE d.organization_id = $1 
          AND ur.date >= $2 
          AND ur.date <= $3
        ORDER BY d.name, ur.date
      `, [organizationId, period.start.toISOString().split('T')[0], period.end.toISOString().split('T')[0]]);

      // Group by deployment
      const deploymentMap = new Map();
      let totalBaseCost = 0;
      let totalPlatformFee = 0;

      for (const row of usageResult.rows) {
        const deploymentId = row.deployment_id;
        
        if (!deploymentMap.has(deploymentId)) {
          deploymentMap.set(deploymentId, {
            deploymentId,
            deploymentName: row.deployment_name,
            usage: [],
            totalCost: 0
          });
        }

        const usageRecord: UsageRecord = {
          id: row.id,
          deploymentId: row.deployment_id,
          date: row.date,
          gpuHours: parseFloat(row.gpu_hours),
          storageGbHours: parseFloat(row.storage_gb_hours),
          apiRequests: row.api_requests,
          dataProcessedGb: parseFloat(row.data_processed_gb),
          baseCost: parseFloat(row.base_cost),
          platformFee: parseFloat(row.platform_fee),
          totalCost: parseFloat(row.total_cost)
        };

        deploymentMap.get(deploymentId).usage.push(usageRecord);
        deploymentMap.get(deploymentId).totalCost += usageRecord.totalCost;
        
        totalBaseCost += usageRecord.baseCost;
        totalPlatformFee += usageRecord.platformFee;
      }

      const deployments = Array.from(deploymentMap.values());
      const totalCost = totalBaseCost + totalPlatformFee;

      return {
        period,
        deployments,
        totalCost,
        breakdown: {
          baseCost: totalBaseCost,
          platformFee: totalPlatformFee
        }
      };
    } catch (error) {
      logger.error('Failed to generate usage report', { error, organizationId, period });
      throw error;
    }
  }
}