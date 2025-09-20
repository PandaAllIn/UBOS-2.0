import Stripe from 'stripe';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface SubscriptionTier {
  id: string;
  name: string;
  priceId: string;
  monthlyPrice: number;
  features: {
    apiRequestsPerMonth: number;
    agentExecutionsPerMonth: number;
    dataAccessLevel: 'basic' | 'professional' | 'enterprise';
    supportLevel: 'community' | 'email' | 'priority';
  };
}

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter_monthly',
    monthlyPrice: 29,
    features: {
      apiRequestsPerMonth: 1000,
      agentExecutionsPerMonth: 50,
      dataAccessLevel: 'basic',
      supportLevel: 'community'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    priceId: 'price_professional_monthly',
    monthlyPrice: 99,
    features: {
      apiRequestsPerMonth: 10000,
      agentExecutionsPerMonth: 500,
      dataAccessLevel: 'professional',
      supportLevel: 'email'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_enterprise_monthly',
    monthlyPrice: 299,
    features: {
      apiRequestsPerMonth: 100000,
      agentExecutionsPerMonth: 5000,
      dataAccessLevel: 'enterprise',
      supportLevel: 'priority'
    }
  }
];

export class StripeService {
  private stripe: Stripe;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil', // Consider making this configurable or updating periodically
    });
  }

  async createCustomer(email: string, name?: string) {
    const actionId = await agentActionLogger.startWork(
      'StripeService',
      'Create Stripe customer',
      `Creating customer for ${email}`,
      'system'
    );

    try {
      const customer = await this.stripe.customers.create({
        email,
        name: name || email.split('@')[0],
        metadata: {
          created_by: 'UBOS_API',
          timestamp: new Date().toISOString()
        }
      });

      await agentActionLogger.completeWork(
        actionId,
        `Customer created: ${customer.id}`,
        []
      );

      return customer;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to create customer: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async createSubscription(customerId: string, tierId: string) {
    const tier = subscriptionTiers.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Invalid subscription tier: ${tierId}`);
    }

    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: tier.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async recordUsage(subscriptionId: string, quantity: number, timestamp?: number) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new Error(`Subscription ${subscriptionId} has no items to record usage against.`);
    }

    const usagePayload = {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000)
    };

    const subscriptionItems = this.stripe.subscriptionItems as any;
    if (subscriptionItems && typeof subscriptionItems.createUsageRecord === 'function') {
      return await subscriptionItems.createUsageRecord(itemId, usagePayload);
    }

    const usageRecords = (this.stripe as any).usageRecords;
    if (usageRecords && typeof usageRecords.create === 'function') {
      return await usageRecords.create(itemId, usagePayload);
    }

    throw new Error('Usage recording is not supported by the configured Stripe API version.');
  }
}

export const stripeService = new StripeService();
