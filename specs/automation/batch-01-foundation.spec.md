# BATCH 01: Foundation Infrastructure
version: 1.0.0
target: grok-code-fast-1
execution: autonomous
estimated_time: 6-8 hours

## Context Loading (Execute First)
```bash
# Load existing codebase patterns
cat src/dashboard/dashboardServer.ts
cat scripts/mcp-stripe-server.js  
cat package.json | grep -A 10 -B 10 "stripe"
cat src/masterControl/agentActionLogger.ts | head -50
find src -name "*.ts" | grep -E "(api|billing|stripe)" | xargs ls -la
```

## File Creation Tasks

### Task 1: Enhanced Stripe Integration
**File**: `src/monetization/stripe-enhanced.ts`
```typescript
import Stripe from 'stripe';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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
    priceId: 'price_starter_monthly', // Will be created in Stripe dashboard
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
        `Failed to create customer: ${error.message}`,
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

  async getUsage(customerId: string, subscriptionId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const usageRecords = await stripe.subscriptionItems.listUsageRecords(
      subscription.items.data[0].id
    );
    
    return {
      subscription,
      usage: usageRecords.data
    };
  }

  async recordUsage(subscriptionId: string, quantity: number, timestamp?: number) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return await stripe.subscriptionItems.createUsageRecord(
      subscription.items.data[0].id,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );
  }
}

export const stripeService = new StripeService();
```

### Task 2: Usage Tracking System
**File**: `src/monetization/usage-tracking.ts`
```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface UsageEvent {
  customerId: string;
  subscriptionId?: string;
  eventType: 'api_request' | 'agent_execution' | 'data_access';
  endpoint?: string;
  agentType?: string;
  timestamp: number;
  cost: number;
  metadata?: Record<string, any>;
}

export interface CustomerUsage {
  customerId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  usage: {
    apiRequests: number;
    agentExecutions: number;
    dataAccessQueries: number;
    totalCost: number;
  };
  limits: {
    apiRequests: number;
    agentExecutions: number;
  };
}

export class UsageTracker {
  private usageFile = path.join(process.cwd(), 'logs', 'usage', 'customer-usage.json');
  private eventsFile = path.join(process.cwd(), 'logs', 'usage', 'usage-events.json');

  async recordEvent(event: UsageEvent): Promise<void> {
    const actionId = await agentActionLogger.startWork(
      'UsageTracker',
      'Record usage event',
      `Recording ${event.eventType} for customer ${event.customerId}`,
      'system'
    );

    try {
      // Ensure log directory exists
      await fs.mkdir(path.dirname(this.eventsFile), { recursive: true });
      
      // Append to events log
      const eventLine = JSON.stringify(event) + '\n';
      await fs.appendFile(this.eventsFile, eventLine);

      // Update customer usage summary
      await this.updateCustomerUsage(event);

      await agentActionLogger.completeWork(
        actionId,
        `Usage event recorded: ${event.eventType}`,
        [this.eventsFile]
      );
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to record usage: ${error.message}`,
        []
      );
      throw error;
    }
  }

  async getCustomerUsage(customerId: string): Promise<CustomerUsage | null> {
    try {
      const usageData = JSON.parse(await fs.readFile(this.usageFile, 'utf8'));
      return usageData[customerId] || null;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async checkLimits(customerId: string, eventType: string): Promise<boolean> {
    const usage = await this.getCustomerUsage(customerId);
    if (!usage) return true; // No limits for non-customers

    switch (eventType) {
      case 'api_request':
        return usage.usage.apiRequests < usage.limits.apiRequests;
      case 'agent_execution':
        return usage.usage.agentExecutions < usage.limits.agentExecutions;
      default:
        return true;
    }
  }

  private async updateCustomerUsage(event: UsageEvent): Promise<void> {
    let usageData = {};
    
    try {
      usageData = JSON.parse(await fs.readFile(this.usageFile, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const now = Date.now();
    const periodStart = new Date(now).setDate(1); // First of month
    const periodEnd = new Date(periodStart).setMonth(new Date(periodStart).getMonth() + 1);

    if (!usageData[event.customerId]) {
      usageData[event.customerId] = {
        customerId: event.customerId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        usage: {
          apiRequests: 0,
          agentExecutions: 0,
          dataAccessQueries: 0,
          totalCost: 0
        },
        limits: {
          apiRequests: 1000,
          agentExecutions: 50
        }
      };
    }

    const customerUsage = usageData[event.customerId];
    
    // Reset if new period
    if (now > customerUsage.currentPeriodEnd) {
      customerUsage.currentPeriodStart = periodStart;
      customerUsage.currentPeriodEnd = periodEnd;
      customerUsage.usage = {
        apiRequests: 0,
        agentExecutions: 0,
        dataAccessQueries: 0,
        totalCost: 0
      };
    }

    // Update usage
    switch (event.eventType) {
      case 'api_request':
        customerUsage.usage.apiRequests++;
        break;
      case 'agent_execution':
        customerUsage.usage.agentExecutions++;
        break;
      case 'data_access':
        customerUsage.usage.dataAccessQueries++;
        break;
    }
    customerUsage.usage.totalCost += event.cost;

    await fs.writeFile(this.usageFile, JSON.stringify(usageData, null, 2));
  }
}

export const usageTracker = new UsageTracker();
```

### Task 3: API Billing Middleware
**File**: `src/middleware/api-billing.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { usageTracker } from '../monetization/usage-tracking.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

interface BillingRequest extends Request {
  customerId?: string;
  subscriptionId?: string;
  billingTier?: string;
}

interface EndpointPricing {
  [endpoint: string]: {
    pricePerRequest: number;
    requiredTier?: string;
  };
}

const endpointPricing: EndpointPricing = {
  '/api/execute': { pricePerRequest: 0.10 },
  '/api/analyze': { pricePerRequest: 0.05 },
  '/api/scan-funding': { pricePerRequest: 0.03 },
  '/api/assistant': { pricePerRequest: 0.02 },
  '/api/funding-data': { pricePerRequest: 0.01, requiredTier: 'professional' }
};

export const billingMiddleware = async (req: BillingRequest, res: Response, next: NextFunction) => {
  const actionId = await agentActionLogger.startWork(
    'BillingMiddleware',
    'Process API billing',
    `Processing billing for ${req.path}`,
    'system'
  );

  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    // Extract customer info from API key (simplified)
    const customerId = await getCustomerFromApiKey(apiKey);
    if (!customerId) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.customerId = customerId;

    // Check usage limits
    const canProceed = await usageTracker.checkLimits(customerId, 'api_request');
    if (!canProceed) {
      res.status(429).json({ 
        error: 'Usage limit exceeded',
        message: 'Upgrade your subscription for higher limits'
      });
      return;
    }

    // Record usage
    const pricing = endpointPricing[req.path];
    if (pricing) {
      await usageTracker.recordEvent({
        customerId,
        eventType: 'api_request',
        endpoint: req.path,
        timestamp: Date.now(),
        cost: pricing.pricePerRequest,
        metadata: {
          method: req.method,
          userAgent: req.headers['user-agent']
        }
      });
    }

    await agentActionLogger.completeWork(
      actionId,
      `Billing processed for ${req.path}`,
      []
    );

    next();
  } catch (error) {
    await agentActionLogger.completeWork(
      actionId,
      `Billing failed: ${error.message}`,
      []
    );
    res.status(500).json({ error: 'Billing processing failed' });
  }
};

async function getCustomerFromApiKey(apiKey: string): Promise<string | null> {
  // Simplified API key to customer mapping
  // In production, this would query a database
  const apiKeyMap: Record<string, string> = {
    'test-key-123': 'customer-123',
    'demo-key-456': 'customer-456'
  };
  
  return apiKeyMap[apiKey] || null;
}
```

## Validation Commands
```bash
# TypeScript compilation check
npm run typecheck

# Test file creation
ls -la src/monetization/
ls -la src/middleware/

# Basic import tests
node -e "console.log('Testing imports...'); require('./dist/monetization/stripe-enhanced.js')"

# Log directory creation test
ls -la logs/usage/ || echo "Usage logs directory will be created on first use"
```

## Environment Setup Requirements
```bash
# Create required directories
mkdir -p logs/usage
mkdir -p src/monetization  
mkdir -p src/middleware

# Add to .env file
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env
echo "STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env
```

## Success Criteria
- [ ] All 3 files created successfully
- [ ] TypeScript compilation passes
- [ ] No import errors
- [ ] Required directories exist
- [ ] Environment variables documented

**Batch 1 Complete**: Foundation infrastructure ready for API monetization layer.