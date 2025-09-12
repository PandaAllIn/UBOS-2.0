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
      await fs.mkdir(path.dirname(this.eventsFile), { recursive: true });

      const eventLine = JSON.stringify(event) + '\n';
      await fs.appendFile(this.eventsFile, eventLine);

      await this.updateCustomerUsage(event);

      await agentActionLogger.completeWork(
        actionId,
        `Usage event recorded: ${event.eventType}`,
        [this.eventsFile]
      );
      } catch (error) {
        await agentActionLogger.completeWork(
          actionId,
          `Failed to record usage: ${error instanceof Error ? error.message : String(error)}`,
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
      if ((error as any).code === 'ENOENT') {
        return null; // File not found is expected for new customers
      }
      console.error(`Error reading customer usage file for ${customerId}:`, error);
      throw error; // Re-throw other errors
    }
  }

  async checkLimits(customerId: string, eventType: string): Promise<boolean> {
    const usage = await this.getCustomerUsage(customerId);
    if (!usage) return true;

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
    let usageData: Record<string, any> = {};

    try {
      usageData = JSON.parse(await fs.readFile(this.usageFile, 'utf8'));
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Error parsing customer usage file:', error);
        // If file is corrupted, we might want to recover or start fresh, 
        // but for now, re-throw to indicate a problem.
        throw error;
      }
    }

    const now = Date.now();
    // Using simple date calculations for period start/end. 
    // For production billing, consider a robust date library like 'date-fns'.
    const periodStart = new Date(now).setDate(1);
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
