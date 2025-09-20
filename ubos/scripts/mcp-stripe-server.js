#!/usr/bin/env node

// EUFM Stripe MCP Server
// Handles Stripe payment processing and subscription management

import stripe from 'stripe';
// const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// MCP Server Implementation
class StripeMCPServer {
  constructor() {
    this.customers = new Map();
    this.subscriptions = new Map();
    this.prices = {
      starter: process.env.STRIPE_PRICE_STARTER,
      pro: process.env.STRIPE_PRICE_PRO,
      agency: process.env.STRIPE_PRICE_AGENCY,
      enterprise: 'custom'
    };
  }

  // Handle MCP requests
  async handleRequest(request) {
    try {
      const { type, data } = request;

      switch (type) {
        case 'create_customer':
          return await this.createCustomer(data);

        case 'create_subscription':
          return await this.createSubscription(data);

        case 'get_customer':
          return await this.getCustomer(data.customerId);

        case 'list_subscriptions':
          return await this.listSubscriptions(data.customerId);

        case 'cancel_subscription':
          return await this.cancelSubscription(data.subscriptionId);

        case 'update_subscription':
          return await this.updateSubscription(data);

        case 'get_payment_methods':
          return await this.getPaymentMethods(data.customerId);

        case 'create_payment_method':
          return await this.createPaymentMethod(data);

        case 'get_invoices':
          return await this.getInvoices(data.customerId);

        case 'create_invoice':
          return await this.createInvoice(data);

        case 'get_usage_summary':
          return await this.getUsageSummary();

        default:
          throw new Error(`Unknown request type: ${type}`);
      }
    } catch (error) {
      console.error('Stripe MCP Server Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Customer Management
  async createCustomer(data) {
    const customer = await stripe.customers.create({
      email: data.email,
      name: data.name,
      metadata: {
        source: 'eufm_mcp',
        userId: data.userId || 'unknown'
      }
    });

    this.customers.set(customer.id, customer);
    return {
      success: true,
      customer: customer
    };
  }

  async getCustomer(customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    return {
      success: true,
      customer: customer
    };
  }

  // Subscription Management
  async createSubscription(data) {
    const { customerId, priceType, metadata } = data;

    if (!this.prices[priceType]) {
      throw new Error(`Invalid price type: ${priceType}`);
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: this.prices[priceType]
      }],
      metadata: {
        source: 'eufm_mcp',
        userId: metadata?.userId || 'unknown',
        plan: priceType
      },
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    this.subscriptions.set(subscription.id, subscription);
    return {
      success: true,
      subscription: subscription,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
  }

  async listSubscriptions(customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });

    return {
      success: true,
      subscriptions: subscriptions.data
    };
  }

  async cancelSubscription(subscriptionId) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    return {
      success: true,
      subscription: subscription
    };
  }

  async updateSubscription(data) {
    const { subscriptionId, priceType } = data;

    if (!this.prices[priceType]) {
      throw new Error(`Invalid price type: ${priceType}`);
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItem = subscription.items.data[0];

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscriptionItem.id,
        price: this.prices[priceType]
      }],
      metadata: {
        ...subscription.metadata,
        plan: priceType
      }
    });

    return {
      success: true,
      subscription: updatedSubscription
    };
  }

  // Payment Methods
  async getPaymentMethods(customerId) {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data
    };
  }

  async createPaymentMethod(data) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: data.card
    });

    if (data.customerId) {
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: data.customerId
      });
    }

    return {
      success: true,
      paymentMethod: paymentMethod
    };
  }

  // Invoices
  async getInvoices(customerId) {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10
    });

    return {
      success: true,
      invoices: invoices.data
    };
  }

  async createInvoice(data) {
    const invoice = await stripe.invoices.create({
      customer: data.customerId,
      collection_method: 'charge_automatically',
      metadata: {
        source: 'eufm_mcp',
        description: data.description || 'EUFM Subscription'
      }
    });

    return {
      success: true,
      invoice: invoice
    };
  }

  // Analytics
  async getUsageSummary() {
    // Get recent subscriptions and calculate metrics
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active'
    });

    const customers = await stripe.customers.list({
      limit: 100
    });

    const totalRevenue = subscriptions.data.reduce((sum, sub) => {
      return sum + (sub.items.data[0]?.price?.unit_amount || 0) / 100;
    }, 0);

    return {
      success: true,
      summary: {
        totalCustomers: customers.data.length,
        activeSubscriptions: subscriptions.data.length,
        monthlyRecurringRevenue: totalRevenue,
        churnRate: 0.05, // Placeholder - would calculate from historical data
        averageRevenuePerUser: totalRevenue / Math.max(subscriptions.data.length, 1)
      }
    };
  }
}

// Initialize server
const server = new StripeMCPServer();

// Handle incoming requests from MCP
process.stdin.on('data', async (data) => {
  try {
    const request = JSON.parse(data.toString());
    const response = await server.handleRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({
      success: false,
      error: error.message
    }) + '\n');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stripe MCP Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stripe MCP Server shutting down...');
  process.exit(0);
});

console.log('🎛️ EUFM Stripe MCP Server started and ready for requests...');