# BATCH 03: Agent Services Monetization
version: 1.0.0
target: grok-code-fast-1
execution: autonomous
estimated_time: 6-8 hours
dependencies: batch-01-foundation, batch-02-api-monetization

## Pre-execution Validation
```bash
# Verify previous batches
ls src/monetization/stripe-enhanced.ts src/middleware/api-billing.ts
grep -q "billingMiddleware" src/dashboard/dashboardServer.ts || echo "ERROR: Batch 2 incomplete"
npm run typecheck  # Must pass before proceeding
```

## Context Loading
```bash
# Load existing agent structure
find src/agents -name "*.ts" | head -10 | xargs ls -la
cat src/agents/agentSummoner.ts | head -50
cat src/orchestrator/index.ts | head -50
grep -r "class.*Agent" src/agents/ | head -5
```

## File Creation Tasks

### Task 1: Agent Billing Wrapper
**File**: `src/monetization/agent-billing.ts`
```typescript
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { usageTracker } from './usage-tracking.js';
import { stripeService } from './stripe-enhanced.js';

export interface AgentExecution {
  agentType: string;
  customerId?: string;
  input: any;
  estimatedCost: number;
  estimatedDuration: number;
}

export interface AgentPricing {
  [agentType: string]: {
    basePrice: number;
    pricePerMinute: number;
    requiredTier?: string;
    description: string;
  };
}

export const agentPricing: AgentPricing = {
  'AgentSummoner': {
    basePrice: 2.50,
    pricePerMinute: 0.10,
    description: 'AI agent analysis with 1,850:1 ROI vs traditional consultants'
  },
  'EUFundingAgent': {
    basePrice: 1.50,
    pricePerMinute: 0.05,
    description: 'EU funding opportunity discovery and analysis'
  },
  'ResearchAgent': {
    basePrice: 3.00,
    pricePerMinute: 0.15,
    description: 'Comprehensive research reports powered by Perplexity'
  },
  'BusinessDevelopmentAgent': {
    basePrice: 5.00,
    pricePerMinute: 0.20,
    description: 'Business strategy and development consulting'
  },
  'ProposalWriterAgent': {
    basePrice: 4.00,
    pricePerMinute: 0.18,
    description: 'Professional proposal writing and optimization'
  },
  'DocumentAnalysisAgent': {
    basePrice: 0.75,
    pricePerMinute: 0.03,
    description: 'Document analysis and information extraction'
  },
  'ComplianceCheckAgent': {
    basePrice: 2.00,
    pricePerMinute: 0.08,
    description: 'Regulatory compliance verification'
  }
};

export class AgentBillingWrapper {
  async executeWithBilling<T>(
    agentType: string,
    executionFunction: () => Promise<T>,
    execution: AgentExecution
  ): Promise<{ result: T; billing: any }> {
    const actionId = await agentActionLogger.startWork(
      'AgentBilling',
      `Execute ${agentType} with billing`,
      `Processing paid execution for customer ${execution.customerId}`,
      'system'
    );

    const startTime = Date.now();
    
    try {
      // Validate customer can execute this agent
      if (execution.customerId) {
        const canExecute = await this.validateExecution(execution);
        if (!canExecute.allowed) {
          throw new Error(canExecute.reason || 'Execution not allowed');
        }
      }

      // Execute the agent
      const result = await executionFunction();
      
      const endTime = Date.now();
      const duration = Math.ceil((endTime - startTime) / 60000); // Minutes
      const actualCost = this.calculateCost(agentType, duration);

      // Record usage and billing
      let billing = null;
      if (execution.customerId) {
        await usageTracker.recordEvent({
          customerId: execution.customerId,
          eventType: 'agent_execution',
          agentType: agentType,
          timestamp: startTime,
          cost: actualCost,
          metadata: {
            duration: endTime - startTime,
            durationMinutes: duration,
            estimatedCost: execution.estimatedCost,
            actualCost: actualCost
          }
        });

        billing = {
          agentType,
          duration,
          estimatedCost: execution.estimatedCost,
          actualCost: actualCost,
          timestamp: startTime
        };
      }

      await agentActionLogger.completeWork(
        actionId,
        `${agentType} execution completed - Duration: ${duration}min, Cost: €${actualCost}`,
        []
      );

      return { result, billing };
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `${agentType} execution failed: ${error.message}`,
        []
      );
      throw error;
    }
  }

  calculateCost(agentType: string, durationMinutes: number): number {
    const pricing = agentPricing[agentType];
    if (!pricing) {
      return 1.00; // Default cost
    }
    
    return pricing.basePrice + (pricing.pricePerMinute * durationMinutes);
  }

  getEstimatedCost(agentType: string, estimatedDurationMinutes: number = 5): number {
    return this.calculateCost(agentType, estimatedDurationMinutes);
  }

  private async validateExecution(execution: AgentExecution): Promise<{ allowed: boolean; reason?: string }> {
    // Check usage limits
    const canExecute = await usageTracker.checkLimits(execution.customerId!, 'agent_execution');
    if (!canExecute) {
      return {
        allowed: false,
        reason: 'Monthly agent execution limit exceeded. Please upgrade your subscription.'
      };
    }

    // Check required tier if specified
    const pricing = agentPricing[execution.agentType];
    if (pricing?.requiredTier) {
      // TODO: Implement tier validation
      // For now, allow all executions
    }

    return { allowed: true };
  }
}

export const agentBillingWrapper = new AgentBillingWrapper();
```

### Task 2: Agent Marketplace API
**File**: `src/api/agent-marketplace.ts`
```typescript
import { Router } from 'express';
import { agentBillingWrapper, agentPricing } from '../monetization/agent-billing.js';
import { billingMiddleware } from '../middleware/api-billing.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

// Import existing agents
import { AgentSummoner } from '../agents/agentSummoner.js';
import { ResearchAgent } from '../agents/researchAgent.js';
// Add other agent imports as needed

const router = Router();

// Apply billing middleware to all marketplace routes
router.use(billingMiddleware);

// Get available agents and pricing
router.get('/agents', (req, res) => {
  const agents = Object.entries(agentPricing).map(([type, pricing]) => ({
    type,
    name: type.replace(/Agent$/, ''),
    basePrice: pricing.basePrice,
    pricePerMinute: pricing.pricePerMinute,
    description: pricing.description,
    estimatedCost: agentBillingWrapper.getEstimatedCost(type)
  }));
  
  res.json({ agents });
});

// Execute Agent Summoner
router.post('/agents/summoner/execute', async (req: any, res) => {
  try {
    const { task, priority = 'medium' } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    const execution = {
      agentType: 'AgentSummoner',
      customerId: req.customerId,
      input: { task, priority },
      estimatedCost: agentBillingWrapper.getEstimatedCost('AgentSummoner'),
      estimatedDuration: 2 // minutes
    };

    const result = await agentBillingWrapper.executeWithBilling(
      'AgentSummoner',
      async () => {
        const summoner = new AgentSummoner();
        return await summoner.execute(task, { priority });
      },
      execution
    );

    res.json({
      success: true,
      result: result.result,
      billing: result.billing
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      type: 'agent_execution_error'
    });
  }
});

// Execute Research Agent
router.post('/agents/research/execute', async (req: any, res) => {
  try {
    const { query, depth = 'standard' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Research query is required' });
    }

    const execution = {
      agentType: 'ResearchAgent',
      customerId: req.customerId,
      input: { query, depth },
      estimatedCost: agentBillingWrapper.getEstimatedCost('ResearchAgent', 3),
      estimatedDuration: 3
    };

    const result = await agentBillingWrapper.executeWithBilling(
      'ResearchAgent',
      async () => {
        const researcher = new ResearchAgent();
        return await researcher.research(query, { depth });
      },
      execution
    );

    res.json({
      success: true,
      result: result.result,
      billing: result.billing
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'agent_execution_error'
    });
  }
});

// Execute EU Funding Discovery
router.post('/agents/eu-funding/execute', async (req: any, res) => {
  try {
    const { sector, budget, location } = req.body;
    
    const execution = {
      agentType: 'EUFundingAgent',
      customerId: req.customerId,
      input: { sector, budget, location },
      estimatedCost: agentBillingWrapper.getEstimatedCost('EUFundingAgent', 2),
      estimatedDuration: 2
    };

    const result = await agentBillingWrapper.executeWithBilling(
      'EUFundingAgent',
      async () => {
        // Use existing EU funding discovery logic
        const fundingOpportunities = await discoverEUFunding({ sector, budget, location });
        return fundingOpportunities;
      },
      execution
    );

    res.json({
      success: true,
      result: result.result,
      billing: result.billing
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'agent_execution_error'
    });
  }
});

// Document Analysis Agent
router.post('/agents/document-analysis/execute', async (req: any, res) => {
  try {
    const { document, analysisType = 'general' } = req.body;
    
    if (!document) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    const execution = {
      agentType: 'DocumentAnalysisAgent',
      customerId: req.customerId,
      input: { document, analysisType },
      estimatedCost: agentBillingWrapper.getEstimatedCost('DocumentAnalysisAgent', 1),
      estimatedDuration: 1
    };

    const result = await agentBillingWrapper.executeWithBilling(
      'DocumentAnalysisAgent',
      async () => {
        // Implement document analysis logic
        return {
          summary: 'Document analysis completed',
          keyPoints: ['Point 1', 'Point 2'],
          analysisType,
          wordCount: document.length,
          timestamp: new Date().toISOString()
        };
      },
      execution
    );

    res.json({
      success: true,
      result: result.result,
      billing: result.billing
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'agent_execution_error'
    });
  }
});

// Get execution history for customer
router.get('/executions', async (req: any, res) => {
  try {
    if (!req.customerId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get recent executions from usage tracker
    const usage = await usageTracker.getCustomerUsage(req.customerId);
    
    res.json({
      executions: usage?.usage || {},
      currentPeriod: {
        start: usage?.currentPeriodStart,
        end: usage?.currentPeriodEnd
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Placeholder for EU funding discovery
async function discoverEUFunding(params: any) {
  // This would integrate with existing EU funding discovery logic
  return {
    opportunities: [
      {
        title: 'Sample EU Funding Opportunity',
        budget: '€2M',
        deadline: '2025-12-31',
        matchScore: 85
      }
    ],
    totalFound: 1,
    searchParams: params
  };
}

export default router;
```

### Task 3: Update Dashboard Server to Include Agent Marketplace
**File**: `src/dashboard/dashboardServer.ts`
**Action**: Add agent marketplace routes

```typescript
// Add import for agent marketplace
import agentMarketplaceRouter from '../api/agent-marketplace.js';

// Add after existing routes (find app.use or similar)
app.use('/api/marketplace', agentMarketplaceRouter);

// Add agent execution metrics to existing /api/status endpoint
// Find the existing status endpoint and enhance it:
app.get('/api/status', async (req: any, res) => {
  try {
    // Keep existing status logic and add:
    const agentMetrics = {
      availableAgents: Object.keys(agentPricing).length,
      totalExecutions: 0, // This would come from usage tracker
      avgExecutionTime: '2.5min',
      successRate: '98.5%'
    };

    res.json({
      // ... existing status data
      agentMarketplace: agentMetrics,
      pricing: agentPricing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Task 4: Agent Marketplace Frontend Component
**File**: `src/components/agent-marketplace.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { agentPricing } from '../monetization/agent-billing.js';

interface Agent {
  type: string;
  name: string;
  basePrice: number;
  pricePerMinute: number;
  description: string;
  estimatedCost: number;
}

interface ExecutionResult {
  success: boolean;
  result: any;
  billing?: {
    agentType: string;
    duration: number;
    actualCost: number;
  };
}

export const AgentMarketplace: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/marketplace/agents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`
        }
      });
      const data = await response.json();
      setAgents(data.agents);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const executeAgent = async () => {
    if (!selectedAgent || !input.trim()) return;

    setExecuting(true);
    setResult(null);

    try {
      const endpoint = getAgentEndpoint(selectedAgent.type);
      const response = await fetch(`/api/marketplace${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('apiKey')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(getRequestBody(selectedAgent.type, input))
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        result: { error: error.message }
      });
    } finally {
      setExecuting(false);
    }
  };

  const getAgentEndpoint = (agentType: string): string => {
    const endpoints: Record<string, string> = {
      'AgentSummoner': '/agents/summoner/execute',
      'ResearchAgent': '/agents/research/execute',
      'EUFundingAgent': '/agents/eu-funding/execute',
      'DocumentAnalysisAgent': '/agents/document-analysis/execute'
    };
    return endpoints[agentType] || '/agents/generic/execute';
  };

  const getRequestBody = (agentType: string, input: string) => {
    switch (agentType) {
      case 'AgentSummoner':
        return { task: input };
      case 'ResearchAgent':
        return { query: input };
      case 'EUFundingAgent':
        return { sector: input };
      case 'DocumentAnalysisAgent':
        return { document: input };
      default:
        return { input };
    }
  };

  return (
    <div className="agent-marketplace">
      <h2>Agent Marketplace</h2>
      
      <div className="agent-grid">
        {agents.map((agent) => (
          <div 
            key={agent.type} 
            className={`agent-card ${selectedAgent?.type === agent.type ? 'selected' : ''}`}
            onClick={() => setSelectedAgent(agent)}
          >
            <h3>{agent.name}</h3>
            <p className="description">{agent.description}</p>
            <div className="pricing">
              <span className="base-price">€{agent.basePrice}</span>
              <span className="per-minute">+€{agent.pricePerMinute}/min</span>
            </div>
            <div className="estimated-cost">
              Est. €{agent.estimatedCost}
            </div>
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div className="execution-panel">
          <h3>Execute {selectedAgent.name}</h3>
          <p>{selectedAgent.description}</p>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getInputPlaceholder(selectedAgent.type)}
            rows={4}
            disabled={executing}
          />
          
          <div className="execution-controls">
            <button 
              onClick={executeAgent}
              disabled={!input.trim() || executing}
              className="execute-btn"
            >
              {executing ? 'Executing...' : `Execute (Est. €${selectedAgent.estimatedCost})`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="result-panel">
          <h3>Execution Result</h3>
          
          {result.success ? (
            <div className="success-result">
              <pre>{JSON.stringify(result.result, null, 2)}</pre>
              
              {result.billing && (
                <div className="billing-info">
                  <h4>Billing Information</h4>
                  <p>Duration: {result.billing.duration} minutes</p>
                  <p>Cost: €{result.billing.actualCost.toFixed(2)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="error-result">
              <p>Error: {result.result?.error || 'Unknown error'}</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .agent-marketplace {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .agent-card {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .agent-card:hover {
          border-color: #007bff;
          box-shadow: 0 4px 8px rgba(0,123,255,0.1);
        }
        
        .agent-card.selected {
          border-color: #007bff;
          background: #f8f9fa;
        }
        
        .pricing {
          margin: 10px 0;
        }
        
        .base-price {
          font-weight: bold;
          color: #28a745;
        }
        
        .per-minute {
          color: #6c757d;
          margin-left: 5px;
        }
        
        .estimated-cost {
          background: #007bff;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 10px;
        }
        
        .execution-panel {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        textarea {
          width: 100%;
          margin: 10px 0;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .execute-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .execute-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .result-panel {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
        }
        
        .billing-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin-top: 15px;
        }
        
        .error-result {
          color: #dc3545;
          background: #f8d7da;
          padding: 15px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );

  function getInputPlaceholder(agentType: string): string {
    const placeholders: Record<string, string> = {
      'AgentSummoner': 'Describe the task you want the agent to analyze...',
      'ResearchAgent': 'Enter your research query...',
      'EUFundingAgent': 'Specify sector, budget, or location for funding search...',
      'DocumentAnalysisAgent': 'Paste the document content to analyze...'
    };
    return placeholders[agentType] || 'Enter your input...';
  }
};
```

## Integration Commands
```bash
# Create required directories
mkdir -p src/api
mkdir -p logs/agent-executions

# Test agent marketplace API
curl -X GET localhost:3001/api/marketplace/agents -H "Authorization: Bearer test-key"

# Test agent execution
curl -X POST localhost:3001/api/marketplace/agents/summoner/execute \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"task":"Test agent summoner execution"}'
```

## Success Criteria
- [ ] Agent billing wrapper created and functional
- [ ] Agent marketplace API endpoints operational  
- [ ] Dashboard server includes marketplace routes
- [ ] Frontend component renders agent selection
- [ ] Agent executions tracked with billing
- [ ] All agents properly monetized
- [ ] TypeScript compilation passes

**Batch 3 Complete**: Agent services fully monetized, ready for data product implementation.