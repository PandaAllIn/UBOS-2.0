# BATCH 02: API Monetization Layer
version: 1.0.0
target: grok-code-fast-1
execution: autonomous
estimated_time: 4-6 hours
dependencies: batch-01-foundation

## Pre-execution Validation
```bash
# Verify Batch 1 completion
ls src/monetization/stripe-enhanced.ts
ls src/middleware/api-billing.ts
npm run typecheck  # Must pass before proceeding
```

## Context Loading
```bash
# Load existing API structure
cat src/dashboard/dashboardServer.ts
cat src/api/routes/*.ts 2>/dev/null || echo "API routes to be discovered"
grep -r "app\." src/ | grep -E "(get|post|put|delete)" | head -10
```

## File Modification Tasks

### Task 1: Enhance Dashboard Server with Billing
**File**: `src/dashboard/dashboardServer.ts`
**Action**: Modify existing file to add billing middleware

```typescript
// Add these imports at the top (after existing imports)
import { billingMiddleware } from '../middleware/api-billing.js';
import { usageTracker } from '../monetization/usage-tracking.js';
import { stripeService } from '../monetization/stripe-enhanced.js';

// Find the existing Express app initialization and add billing middleware
// Look for: const app = express();
// Add after existing middleware but before route definitions:
app.use('/api', billingMiddleware);

// Find existing API routes and enhance them
// Look for: app.post('/api/execute'
// Wrap the existing handler with billing:

app.post('/api/execute', async (req: any, res) => {
  const actionId = await agentActionLogger.startWork(
    'Dashboard',
    'Execute with billing',
    'Processing paid API execution',
    'system'
  );

  try {
    // Record agent execution usage
    if (req.customerId) {
      await usageTracker.recordEvent({
        customerId: req.customerId,
        eventType: 'agent_execution',
        timestamp: Date.now(),
        cost: 0.10,
        metadata: {
          task: req.body.task || 'unknown',
          agent: req.body.agent || 'default'
        }
      });
    }

    // Execute existing logic (keep original implementation)
    const result = await orchestrator.execute(req.body.task, {
      agent: req.body.agent,
      priority: req.body.priority,
      timeout: req.body.timeout
    });

    await agentActionLogger.completeWork(
      actionId,
      'Execution completed with billing',
      []
    );

    res.json({ 
      success: true, 
      result,
      usage: req.customerId ? await usageTracker.getCustomerUsage(req.customerId) : null
    });
  } catch (error) {
    await agentActionLogger.completeWork(
      actionId,
      `Execution failed: ${error.message}`,
      []
    );
    res.status(500).json({ error: error.message });
  }
});

// Enhance /api/analyze endpoint
app.post('/api/analyze', async (req: any, res) => {
  try {
    // Record API usage
    if (req.customerId) {
      await usageTracker.recordEvent({
        customerId: req.customerId,
        eventType: 'api_request',
        endpoint: '/api/analyze',
        timestamp: Date.now(),
        cost: 0.05,
        metadata: {
          inputSize: JSON.stringify(req.body).length,
          analysisType: req.body.type || 'general'
        }
      });
    }

    // Execute existing analysis logic
    const analysis = await orchestrator.analyze(req.body.input, {
      type: req.body.type,
      depth: req.body.depth
    });

    res.json({ 
      success: true, 
      analysis,
      usage: req.customerId ? await usageTracker.getCustomerUsage(req.customerId) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new billing-specific endpoints
app.get('/api/usage', async (req: any, res) => {
  try {
    if (!req.customerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const usage = await usageTracker.getCustomerUsage(req.customerId);
    res.json({ usage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscription/create', async (req: any, res) => {
  try {
    const { email, tier } = req.body;
    
    const customer = await stripeService.createCustomer(email);
    const subscription = await stripeService.createSubscription(customer.id, tier);
    
    res.json({ 
      customer: customer.id,
      subscription: subscription.id,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Task 2: Create Customer Portal Component
**File**: `src/components/customer-portal.tsx`
```typescript
import React, { useState, useEffect } from 'react';

interface Usage {
  apiRequests: number;
  agentExecutions: number;
  dataAccessQueries: number;
  totalCost: number;
}

interface CustomerPortalProps {
  customerId: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ customerId }) => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [customerId]);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`
        }
      });
      const data = await response.json();
      setUsage(data.usage?.usage || null);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading usage data...</div>;
  }

  return (
    <div className="customer-portal">
      <h2>Your Usage Dashboard</h2>
      
      {usage && (
        <div className="usage-stats">
          <div className="stat">
            <h3>API Requests</h3>
            <p>{usage.apiRequests.toLocaleString()}</p>
          </div>
          
          <div className="stat">
            <h3>Agent Executions</h3>
            <p>{usage.agentExecutions.toLocaleString()}</p>
          </div>
          
          <div className="stat">
            <h3>Data Queries</h3>
            <p>{usage.dataAccessQueries.toLocaleString()}</p>
          </div>
          
          <div className="stat">
            <h3>Total Cost</h3>
            <p>€{usage.totalCost.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="actions">
        <button onClick={fetchUsage}>Refresh Usage</button>
        <button onClick={() => window.open('/api/billing-portal', '_blank')}>
          Manage Subscription
        </button>
      </div>

      <style jsx>{`
        .customer-portal {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .usage-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .stat {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat h3 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .stat p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        
        .actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  );
};
```

### Task 3: Create API Key Management System
**File**: `src/monetization/api-key-manager.ts`
```typescript
import { randomBytes, createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface ApiKey {
  id: string;
  customerId: string;
  keyHash: string;
  name: string;
  created: number;
  lastUsed?: number;
  permissions: string[];
  status: 'active' | 'revoked';
}

export class ApiKeyManager {
  private keysFile = path.join(process.cwd(), 'logs', 'api-keys.json');

  async createApiKey(customerId: string, name: string, permissions: string[] = ['api:read', 'api:execute']): Promise<{ key: string; keyId: string }> {
    const actionId = await agentActionLogger.startWork(
      'ApiKeyManager',
      'Create API key',
      `Creating API key for customer ${customerId}`,
      'system'
    );

    try {
      // Generate secure API key
      const keyBytes = randomBytes(32);
      const key = `ubos_${keyBytes.toString('hex')}`;
      const keyHash = createHash('sha256').update(key).digest('hex');
      
      const keyId = randomBytes(16).toString('hex');
      
      const apiKey: ApiKey = {
        id: keyId,
        customerId,
        keyHash,
        name,
        created: Date.now(),
        permissions,
        status: 'active'
      };

      // Save to file
      await this.saveApiKey(apiKey);

      await agentActionLogger.completeWork(
        actionId,
        `API key created: ${keyId}`,
        [this.keysFile]
      );

      return { key, keyId };
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to create API key: ${error.message}`,
        []
      );
      throw error;
    }
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    try {
      const keyHash = createHash('sha256').update(key).digest('hex');
      const keys = await this.loadApiKeys();
      
      const apiKey = keys.find(k => k.keyHash === keyHash && k.status === 'active');
      
      if (apiKey) {
        // Update last used timestamp
        apiKey.lastUsed = Date.now();
        await this.saveApiKeys(keys);
      }
      
      return apiKey || null;
    } catch (error) {
      console.error('Failed to validate API key:', error);
      return null;
    }
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const keys = await this.loadApiKeys();
    const keyIndex = keys.findIndex(k => k.id === keyId);
    
    if (keyIndex !== -1) {
      keys[keyIndex].status = 'revoked';
      await this.saveApiKeys(keys);
    }
  }

  async getCustomerKeys(customerId: string): Promise<ApiKey[]> {
    const keys = await this.loadApiKeys();
    return keys.filter(k => k.customerId === customerId);
  }

  private async loadApiKeys(): Promise<ApiKey[]> {
    try {
      const data = await fs.readFile(this.keysFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveApiKey(apiKey: ApiKey): Promise<void> {
    const keys = await this.loadApiKeys();
    keys.push(apiKey);
    await this.saveApiKeys(keys);
  }

  private async saveApiKeys(keys: ApiKey[]): Promise<void> {
    await fs.mkdir(path.dirname(this.keysFile), { recursive: true });
    await fs.writeFile(this.keysFile, JSON.stringify(keys, null, 2));
  }
}

export const apiKeyManager = new ApiKeyManager();

// Update the billing middleware to use proper API key validation
export const getCustomerFromApiKey = async (apiKey: string): Promise<string | null> => {
  const validKey = await apiKeyManager.validateApiKey(apiKey);
  return validKey?.customerId || null;
};
```

## Integration Updates

### Task 4: Update Billing Middleware to Use API Key Manager
**File**: `src/middleware/api-billing.ts`
**Action**: Replace the getCustomerFromApiKey function

```typescript
// Replace the existing getCustomerFromApiKey function with:
import { getCustomerFromApiKey } from '../monetization/api-key-manager.js';

// The function is now imported and will use proper validation
```

## Testing Commands
```bash
# Compile and test
npm run typecheck
npm run build

# Test API endpoints (if server is running)
curl -X POST localhost:3001/api/execute -H "Authorization: Bearer test-key" -d '{"task":"test"}'
curl -X GET localhost:3001/api/usage -H "Authorization: Bearer test-key"

# Test component compilation  
npm run build:components || echo "Components will be built with main build"
```

## Environment Setup
```bash
# Create required directories
mkdir -p src/components
mkdir -p logs/usage

# Add API key endpoints to main router
echo "API key management endpoints added to dashboard server"
```

## Success Criteria
- [ ] Dashboard server enhanced with billing middleware
- [ ] Customer portal component created
- [ ] API key management system implemented
- [ ] All endpoints track usage properly
- [ ] TypeScript compilation passes
- [ ] Basic API tests respond correctly

**Batch 2 Complete**: API monetization layer active, ready for agent service wrapping.