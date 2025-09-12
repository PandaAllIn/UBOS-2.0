import Stripe from 'stripe';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

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
  async createCustomer(email: string, name?: string) {
    const actionId = await agentActionLogger.startWork(
      'StripeService',
      'Create Stripe customer',
      `Creating customer for ${email}`,
      'system'
    );

    try {
      const customer = await stripe.customers.create({
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

    return await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: tier.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async recordUsage(subscriptionId: string, quantity: number, timestamp?: number) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return await (stripe as any).usageRecords.create(
      subscription.items.data[0].id,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000)
      }
    );
  }
}

export const stripeService = new StripeService();
