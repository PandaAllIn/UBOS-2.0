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
      apiVersion: '2025-08-27.basil',
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
    const subscriptionItem = subscription.items.data[0];

    if (!subscriptionItem) {
      throw new Error(`No subscription items found for subscription ${subscriptionId}`);
    }

    const subscriptionItems = this.stripe.subscriptionItems as unknown as {
      createUsageRecord?: (id: string, params: { quantity: number; timestamp: number }) => Promise<unknown>;
    };

    if (typeof subscriptionItems.createUsageRecord === 'function') {
      return await subscriptionItems.createUsageRecord(subscriptionItem.id, {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000)
      });
    }

    throw new Error('Usage recording is not supported by the configured Stripe API version.');
  }

  async createCheckoutSession(priceId: string, customerId?: string) {
    const actionId = await agentActionLogger.startWork(
      'StripeService',
      'Create checkout session',
      `Generating checkout session for price ${priceId}`,
      'system'
    );

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: process.env.STRIPE_SUCCESS_URL ?? 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: process.env.STRIPE_CANCEL_URL ?? 'https://example.com/cancel',
        customer: customerId,
        allow_promotion_codes: true,
      });

      await agentActionLogger.completeWork(
        actionId,
        `Checkout session ${session.id} created`,
        []
      );

      return session;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to create checkout session: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    const actionId = await agentActionLogger.startWork(
      'StripeService',
      'Cancel subscription',
      `Canceling subscription ${subscriptionId}`,
      'system'
    );

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      await agentActionLogger.completeWork(
        actionId,
        `Subscription ${subscriptionId} scheduled for cancellation at period end.`,
        []
      );

      return subscription;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to cancel subscription: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

export const stripeService = new StripeService();
