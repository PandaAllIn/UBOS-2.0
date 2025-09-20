import { usageTracker } from './usage-tracking.js';
import { apiKeyManager } from './api-key-manager.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface PricingConfig {
  basePrice: number;
  perMinuteRate: number;
  category: string;
  description: string;
}

export interface AgentExecution {
  agentType: string;
  customerId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  cost?: number;
  success: boolean;
}

const agentPricing: Record<string, PricingConfig> = {
  'agentSummoner': {
    basePrice: 2.50,
    perMinuteRate: 0.10,
    category: 'coordination',
    description: 'Multi-agent task coordination (1,850:1 ROI proven)'
  },
  'researchAgent': {
    basePrice: 3.00,
    perMinuteRate: 0.15,
    category: 'research',
    description: 'Advanced research and analysis'
  },
  'euFundingAgent': {
    basePrice: 1.50,
    perMinuteRate: 0.05,
    category: 'funding',
    description: 'EU funding opportunity analysis'
  },
  'documentAnalysis': {
    basePrice: 0.75,
    perMinuteRate: 0.03,
    category: 'analysis',
    description: 'Document processing and analysis'
  },
  'codexAgent': {
    basePrice: 4.00,
    perMinuteRate: 0.20,
    category: 'coding',
    description: 'Software development and coding assistance'
  },
  'browserAgent': {
    basePrice: 1.00,
    perMinuteRate: 0.08,
    category: 'automation',
    description: 'Web automation and scraping'
  },
  'eufmAgentSummoner': {
    basePrice: 2.00,
    perMinuteRate: 0.12,
    category: 'eufm',
    description: 'EUFM specific agent orchestration'
  },
  'memoryAgent': {
    basePrice: 0.50,
    perMinuteRate: 0.02,
    category: 'knowledge',
    description: 'Knowledge base and memory management'
  },
  'coordinationAgent': {
    basePrice: 3.50,
    perMinuteRate: 0.18,
    category: 'coordination',
    description: 'Advanced multi-agent coordination'
  }
};

export class AgentBillingService {
  private activeExecutions = new Map<string, AgentExecution>();

  async startAgentExecution(agentType: string, apiKey: string): Promise<{ executionId: string; pricing: PricingConfig; customerId: string }> {
    const customerId = await apiKeyManager.getCustomerFromKey(apiKey);
    if (!customerId) {
      throw new Error('Invalid API key');
    }

    const pricing = agentPricing[agentType];
    if (!pricing) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    // Check if customer can afford this execution
    let canProceed = false;
    try {
      canProceed = await usageTracker.checkLimits(customerId, 'agent_execution');
    } catch (error) {
      throw new Error(`Error checking usage limits: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    if (!canProceed) {
      throw new Error('Usage limit exceeded. Upgrade your subscription for higher limits.');
    }

    const actionId = await agentActionLogger.startWork(
      'AgentBillingService',
      'Start agent execution',
      `Starting ${agentType} execution for customer ${customerId}`,
      'system'
    );

    try {
      const executionId = this.generateExecutionId();
      const execution: AgentExecution = {
        agentType,
        customerId,
        startTime: Date.now(),
        success: false
      };

      this.activeExecutions.set(executionId, execution);

      await agentActionLogger.completeWork(
        actionId,
        `Agent execution started: ${executionId}`,
        []
      );

      return { executionId, pricing, customerId };
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to start agent execution: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async recordAgentProgress(executionId: string, progress: number, taskDescription: string) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const actionId = await agentActionLogger.startWork(
      'AgentBillingService',
      `Progress update for ${execution.agentType}`,
      `${progress}% complete: ${taskDescription}`,
      'system'
    );

    try {
      // Log progress to action logger
      await agentActionLogger.completeWork(
        actionId,
        `Progress updated: ${progress}% for ${executionId}`,
        []
      );
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to record progress: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async completeAgentExecution(executionId: string, output: unknown = null) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const actionId = await agentActionLogger.startWork(
      'AgentBillingService',
      'Complete agent execution',
      `Completing ${execution.agentType} execution for customer ${execution.customerId}`,
      'system'
    );

    try {
      const endTime = Date.now();
      const duration = (endTime - execution.startTime) / 1000 / 60; // minutes

      const pricing = agentPricing[execution.agentType];
      const cost = pricing.basePrice + (duration * pricing.perMinuteRate);

      // Mark as successful and complete
      execution.endTime = endTime;
      execution.duration = duration;
      execution.cost = cost;
      execution.success = true;

      // Record the usage event
      await usageTracker.recordEvent({
        customerId: execution.customerId,
        eventType: 'agent_execution',
        agentType: execution.agentType,
        timestamp: endTime,
        cost: cost,
        metadata: {
          executionId,
          duration,
          startTime: execution.startTime,
          endTime,
          success: true,
          output: output
        }
      });

      // Remove from active executions
      this.activeExecutions.delete(executionId);

      await agentActionLogger.completeWork(
        actionId,
        `Agent execution completed: ${executionId} - Cost: €${cost.toFixed(2)}`,
        []
      );

      return execution;
    } catch (error) {
      // Mark as failed
      execution.success = false;
      await agentActionLogger.completeWork(
        actionId,
        `Agent execution failed: ${executionId} - ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async cancelAgentExecution(executionId: string) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const actionId = await agentActionLogger.startWork(
      'AgentBillingService',
      'Cancel agent execution',
      `Cancelling ${execution.agentType} execution for customer ${execution.customerId}`,
      'system'
    );

    try {
      // Calculate partial cost for cancelled execution
      const now = Date.now();
      const duration = (now - execution.startTime) / 1000 / 60; // minutes

      const pricing = agentPricing[execution.agentType];
      const cost = pricing.basePrice + (duration * pricing.perMinuteRate);

      execution.endTime = now;
      execution.duration = duration;
      execution.cost = cost;
      execution.success = false;

      await usageTracker.recordEvent({
        customerId: execution.customerId,
        eventType: 'agent_execution',
        agentType: execution.agentType,
        timestamp: now,
        cost: cost,
        metadata: {
          executionId,
          duration,
          startTime: execution.startTime,
          endTime: now,
          success: false,
          cancelled: true
        }
      });

      this.activeExecutions.delete(executionId);

      await agentActionLogger.completeWork(
        actionId,
        `Agent execution cancelled: ${executionId} - Partial cost: €${cost.toFixed(2)}`,
        []
      );

      return execution;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to cancel agent execution: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async getAgentPricing(agentType: string): Promise<PricingConfig | null> {
    return agentPricing[agentType] || null;
  }

  getAvailableAgents(): Array<{ agentType: string; pricing: PricingConfig }> {
    return Object.entries(agentPricing).map(([agentType, pricing]) => ({
      agentType,
      pricing
    }));
  }

  getActiveExecutions(): AgentExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  estimateAgentCost(agentType: string, estimatedDurationMinutes: number): number {
    const pricing = agentPricing[agentType];
    if (!pricing) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    return pricing.basePrice + (estimatedDurationMinutes * pricing.perMinuteRate);
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const agentBillingService = new AgentBillingService();
