import { promises as fs } from 'fs';
import path from 'path';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { subscriptionTiers, SubscriptionTier } from './stripe-enhanced.js';

export interface UsageEvent {
  customerId: string;
  subscriptionId?: string;
  tierId?: string;
  eventType: 'api_request' | 'agent_execution' | 'data_access';
  endpoint?: string;
  agentType?: string;
  timestamp: number;
  cost: number;
  metadata?: Record<string, unknown>;
}

export interface CustomerUsage {
  customerId: string;
  tierId: string;
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

interface StoredUsage {
  customerId: string;
  tierId: string;
  current_usage: number;
  monthly_usage_limit: number;
  created_at: string;
  expires_at: string;
  total_cost: number;
}

type UsageStore = Record<string, StoredUsage>;

const USAGE_DB_PATH = path.join('logs', 'monetization', 'usage-store.json');
const EVENT_LOG_PATH = path.join('logs', 'monetization', 'usage-events.json');

async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadStore(): Promise<UsageStore> {
  try {
    const raw = await fs.readFile(USAGE_DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed as UsageStore : {};
  } catch {
    return {};
  }
}

async function saveStore(store: UsageStore): Promise<void> {
  await ensureDir(USAGE_DB_PATH);
  await fs.writeFile(USAGE_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

async function appendEventLog(event: UsageEvent): Promise<void> {
  await ensureDir(EVENT_LOG_PATH);
  const existing = await (async () => {
    try {
      const raw = await fs.readFile(EVENT_LOG_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as UsageEvent[] : [];
    } catch {
      return [] as UsageEvent[];
    }
  })();
  existing.push(event);
  await fs.writeFile(EVENT_LOG_PATH, JSON.stringify(existing.slice(-5000), null, 2), 'utf-8');
}

function resolveTier(tierId?: string): SubscriptionTier {
  if (tierId) {
    const match = subscriptionTiers.find((tier) => tier.id === tierId);
    if (match) return match;
  }
  return subscriptionTiers[0];
}

function nextMonth(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + 1);
  return copy;
}

export class UsageTracker {
  async recordEvent(event: UsageEvent): Promise<void> {
    const actionId = await agentActionLogger.startWork(
      'UsageTracker',
      'Record usage event',
      `Recording ${event.eventType} for customer ${event.customerId}`,
      'system'
    );

    try {
      const store = await loadStore();
      const tier = resolveTier(event.tierId);
      const now = new Date(event.timestamp || Date.now());
      const existing = store[event.customerId] ?? {
        customerId: event.customerId,
        tierId: tier.id,
        current_usage: 0,
        monthly_usage_limit: tier.features.agentExecutionsPerMonth,
        created_at: now.toISOString(),
        expires_at: nextMonth(now).toISOString(),
        total_cost: 0,
      };
      existing.current_usage += 1;
      existing.total_cost += event.cost;
      existing.tierId = tier.id;
      existing.monthly_usage_limit = tier.features.agentExecutionsPerMonth;
      store[event.customerId] = existing;

      await saveStore(store);
      await appendEventLog(event);

      await agentActionLogger.completeWork(
        actionId,
        `Usage event recorded: ${event.eventType}`,
        []
      );
    } catch (error) {
      await agentActionLogger.updateActionStatus(actionId, 'failed', {
        output: { summary: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  async getCustomerUsage(customerId: string): Promise<CustomerUsage | null> {
    const store = await loadStore();
    const entry = store[customerId];
    if (!entry) return null;

    return {
      customerId: entry.customerId,
      tierId: entry.tierId,
      currentPeriodStart: new Date(entry.created_at).getTime(),
      currentPeriodEnd: new Date(entry.expires_at).getTime(),
      usage: {
        apiRequests: entry.current_usage,
        agentExecutions: entry.current_usage,
        dataAccessQueries: 0,
        totalCost: entry.total_cost,
      },
      limits: {
        apiRequests: entry.monthly_usage_limit,
        agentExecutions: entry.monthly_usage_limit,
      },
    };
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
}

export const usageTracker = new UsageTracker();
