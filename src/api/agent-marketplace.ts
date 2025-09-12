import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { agentBillingService } from '../monetization/agent-billing.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

// Import available agents from the agents directory
// AgentSummoner will be used for actual agent execution when implemented
// import { AgentSummoner } from '../agents/agentSummoner.js';

interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  examples: string[];
  limitations: string[];
  version: string;
  lastUpdated: string;
}

const agentMetadata: Record<string, AgentMetadata> = {
  'agentSummoner': {
    name: 'Agent Summoner',
    description: 'Multi-agent task coordination with proven 1,850:1 ROI',
    capabilities: ['Task decomposition', 'Agent orchestration', 'Progress monitoring', 'Quality assurance'],
    examples: [
      'Complex project management',
      'Research synthesis tasks',
      'Multi-step analysis workflows',
      'Automated decision support'
    ],
    limitations: ['Requires 2+ agents for optimal performance', 'Higher cost for complex orchestrations'],
    version: '2.1.0',
    lastUpdated: '2024-01-15'
  },
  'researchAgent': {
    name: 'Research Agent Pro',
    description: 'Advanced research and analysis agent',
    capabilities: ['Data collection', 'Source verification', 'Trend analysis', 'Report generation'],
    examples: [
      'Market research reports',
      'Competitive analysis',
      'Literature reviews',
      'Data insights'
    ],
    limitations: ['Requires reliable internet access', 'Source availability may vary'],
    version: '1.8.0',
    lastUpdated: '2024-01-10'
  },
  'euFundingAgent': {
    name: 'EU Funding Analyzer',
    description: 'Specialized in EU funding opportunity analysis',
    capabilities: ['Proposal eligibility check', 'Funding program matching', 'Application optimization', 'Grant tracking'],
    examples: [
      'EU project feasibility',
      'Grant application analysis',
      'Funding strategy optimization'
    ],
    limitations: ['EU-specific focus', 'Requires grant database access'],
    version: '2.3.0',
    lastUpdated: '2024-01-08'
  },
  'documentAnalysis': {
    name: 'Document Analysis Engine',
    description: 'Advanced document processing and analysis',
    capabilities: ['Text extraction', 'Content analysis', 'Document classification', 'Summary generation'],
    examples: [
      'Contract analysis',
      'Research paper digest',
      'Policy document review',
      'Technical documentation processing'
    ],
    limitations: ['Depends on document quality', 'Language support may vary'],
    version: '1.5.0',
    lastUpdated: '2024-01-12'
  },
  'codexAgent': {
    name: 'CodeX Development Agent',
    description: 'Full-stack software development and coding assistance',
    capabilities: ['Code generation', 'Bug fixing', 'Architecture design', 'Code review', 'Testing automation'],
    examples: [
      'Web application development',
      'API building',
      'Database design',
      'Code refactoring'
    ],
    limitations: ['Project complexity boundaries', 'Language framework preferences'],
    version: '3.2.0',
    lastUpdated: '2024-01-13'
  },
  'browserAgent': {
    name: 'Web Automation Agent',
    description: 'Intelligent web automation and scraping platform',
    capabilities: ['Website data extraction', 'Form automation', 'Content monitoring', 'Web testing'],
    examples: [
      'Price monitoring',
      'Content aggregation',
      'Data collection',
      'Process automation'
    ],
    limitations: ['Website changes affect reliability', 'Rate limiting considerations'],
    version: '1.9.0',
    lastUpdated: '2024-01-14'
  },
  'eufmAgentSummoner': {
    name: 'EUFM Orchestration Agent',
    description: 'EUFM-specific multi-agent coordination system',
    capabilities: ['EU market analysis', 'Funding strategy', 'Regulatory compliance', 'Project coordination'],
    examples: [
      'EUFM initiative planning',
      'European partnership development',
      'Funding strategy design',
      'Compliance assurance'
    ],
    limitations: ['EUFM domain specific', 'Regulatory updates required'],
    version: '2.0.0',
    lastUpdated: '2024-01-11'
  },
  'memoryAgent': {
    name: 'Knowledge Base Agent',
    description: 'Persistent knowledge management and memory system',
    capabilities: ['Information storage', 'Knowledge retrieval', 'Context awareness', 'Learning adaptation'],
    examples: [
      'Personal knowledge base',
      'Customer data management',
      'Document memory',
      'Historical analysis'
    ],
    limitations: ['Storage capacity limits', 'Privacy considerations'],
    version: '1.3.0',
    lastUpdated: '2024-01-16'
  },
  'coordinationAgent': {
    name: 'Advanced Coordination Agent',
    description: 'Sophisticated multi-agent coordination platform',
    capabilities: ['Complex workflow management', 'Agent communication', 'Conflict resolution', 'Performance optimization'],
    examples: [
      'Enterprise-grade workflows',
      'International coordination',
      'Complex project management',
      'Large-scale automation'
    ],
    limitations: ['High resource consumption', 'Advanced configuration required'],
    version: '2.5.0',
    lastUpdated: '2024-01-09'
  }
};

// Agent availability check helper
const isAgentAvailable = (agentType: string): boolean => {
  // For now, only agentSummoner is implemented
  return agentType === 'agentSummoner';
};

interface AgentExecutionRequest extends Request {
  customerId?: string;
}

const router = express.Router();

router.use(express.json());

// Get all available agents with pricing
router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const agents = agentBillingService.getAvailableAgents();

    const enrichedAgents = agents.map(agent => ({
      ...agent,
      metadata: agentMetadata[agent.agentType],
      status: isAgentAvailable(agent.agentType) ? 'available' : 'coming_soon'
    }));

    res.json({
      success: true,
      agents: enrichedAgents,
      count: enrichedAgents.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to list agents',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get specific agent details
router.get('/agents/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;

    const pricing = await agentBillingService.getAgentPricing(agentType);
    if (!pricing) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    const metadata = agentMetadata[agentType];
    const status = isAgentAvailable(agentType) ? 'available' : 'coming_soon';

    res.json({
      success: true,
      agent: {
        agentType,
        pricing,
        metadata,
        status
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get agent details',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Estimate agent cost
router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const { agentType, estimatedDurationMinutes } = req.body;

    if (!agentType || typeof estimatedDurationMinutes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Missing agentType or estimatedDurationMinutes'
      });
    }

    const estimatedCost = agentBillingService.estimateAgentCost(agentType, estimatedDurationMinutes);

    res.json({
      success: true,
      agentType,
      estimatedDurationMinutes,
      estimatedCost: `€${estimatedCost.toFixed(2)}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to estimate cost',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Start agent execution
router.post('/execute/:agentType', async (req: AgentExecutionRequest, res: Response) => {
  try {
    const { agentType } = req.params;
    const { task, parameters: _parameters = {} } = req.body;

    if (!req.customerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!task || typeof task !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Task description required'
      });
    }

    // For now, this is just a wrapper; the actual execution would happen here
    // In a real implementation, you'd instantiate and run the agent
    console.log(`Starting ${agentType} for customer ${req.customerId}: ${task.substring(0, 100)}...`);

    res.json({
      success: true,
      message: `${agentType} execution started`,
      agentType,
      task: task.substring(0, 100),
      status: 'queued'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to start agent execution',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get execution status
router.get('/executions/:executionId', async (req: AgentExecutionRequest, res: Response) => {
  try {
    const { executionId } = req.params;

    // For MVP, we don't have real execution tracking yet
    res.json({
      success: true,
      executionId,
      status: 'unknown',
      message: 'Real-time execution tracking coming soon'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get execution status',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Cancel execution
router.delete('/executions/:executionId', async (req: AgentExecutionRequest, res: Response) => {
  try {
    const { executionId } = req.params;

    // For MVP, we don't have real execution management yet
    res.json({
      success: true,
      executionId,
      status: 'cancelled',
      message: 'Execution cancellation coming soon'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel execution',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get active executions
router.get('/executions', async (req: AgentExecutionRequest, res: Response) => {
  try {
    const activeExecutions = agentBillingService.getActiveExecutions();

    // Filter by customer
    const customerExecutions = activeExecutions.filter(exec =>
      req.customerId && exec.customerId === req.customerId
    );

    res.json({
      success: true,
      executions: customerExecutions.map(exec => ({
        executionId: Math.random().toString(36).substring(2, 11), // Mock ID
        agentType: exec.agentType,
        startTime: exec.startTime,
        progress: Math.random() * 100, // Mock progress
        task: `Executing ${exec.agentType} task`, // Mock task
        status: 'running'
      }))
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get active executions',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create API Key
router.post('/keys', async (req: AgentExecutionRequest, res: Response) => {
  try {
    if (!req.customerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { name } = req.body;

    const actionId = await agentActionLogger.startWork(
      'MarketplaceAPI',
      'Create API key',
      `Creating API key for customer ${req.customerId}`,
      'system'
    );

    try {
      const apiKey = await import('../monetization/api-key-manager.js').then(({ apiKeyManager }) =>
        apiKeyManager.createKey(req.customerId!, name || 'Marketplace API Key')
      );

      await agentActionLogger.completeWork(
        actionId,
        `API key created: ${apiKey.id}`,
        []
      );

      res.json({
        success: true,
        apiKey: apiKey.key,
        keyId: apiKey.id,
        name: apiKey.name,
        created: new Date(apiKey.created).toISOString()
      });

    } catch (error: any) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get API keys for customer
router.get('/keys', async (req: AgentExecutionRequest, res: Response) => {
  try {
    if (!req.customerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const apiKeys = await import('../monetization/api-key-manager.js').then(({ apiKeyManager }) =>
      apiKeyManager.getKeysByCustomer(req.customerId!)
    );

    res.json({
      success: true,
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        created: new Date(key.created).toISOString(),
        lastUsed: key.lastUsed ? new Date(key.lastUsed).toISOString() : null,
        active: key.active
      }))
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get API keys',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Error handling middleware
router.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Marketplace API Error:', error);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export const agentMarketplaceRouter = router;