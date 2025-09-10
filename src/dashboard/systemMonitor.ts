import { promises as fs } from 'fs';
import { ToolUsageTracker } from '../analytics/toolUsageTracker.js';
import { SubscriptionManager, FileSubscriptionStore } from '../analytics/subscriptionManager.js';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  memory: { used: number; total: number };
  tools: ToolStatus[];
  subscriptions: SubscriptionStatus[];
}

export interface ToolStatus {
  name: string;
  status: 'online' | 'offline' | 'limited';
  lastUsed: string;
  errorRate: number;
  responseTime: number;
}

export interface SubscriptionStatus {
  provider: string;
  plan: string;
  usage: number;
  limit: number;
  status: 'ok' | 'warning' | 'critical';
}

export class SystemMonitor {
  private tracker = new ToolUsageTracker();
  private subs = new SubscriptionManager(new FileSubscriptionStore('logs/analytics/subscriptions.json'));
  private startTime = new Date();

  async getHealth(): Promise<SystemHealth> {
    const tools = await this.getToolStatus();
    const subscriptions = await this.getSubscriptionStatus();
    
    const overallStatus = this.calculateOverallStatus(tools, subscriptions);
    
    return {
      status: overallStatus,
      uptime: this.getUptime(),
      memory: this.getMemoryUsage(),
      tools,
      subscriptions
    };
  }

  private async getToolStatus(): Promise<ToolStatus[]> {
    const usage = await this.tracker.list({ since: this.getYesterday() });
    
    const tools = [
      'CodexAgent', 'JulesAgent', 'AbacusAgent', 'BrowserAgent', 'MemoryAgent',
      'Perplexity', 'Gemini', 'OpenAI', 'Anthropic'
    ];

    return tools.map(tool => {
      const toolUsage = usage.filter(u => 
        u.model?.toLowerCase().includes(tool.toLowerCase()) ||
        u.provider?.toLowerCase().includes(tool.toLowerCase())
      );
      
      const lastUsed = toolUsage.length > 0 
        ? toolUsage[toolUsage.length - 1].ts 
        : 'Never';
      
      const errors = toolUsage.filter(u => u.notes?.includes('error')).length;
      const errorRate = toolUsage.length > 0 ? errors / toolUsage.length : 0;
      
      return {
        name: tool,
        status: this.determineToolStatus(toolUsage, errorRate),
        lastUsed,
        errorRate: Math.round(errorRate * 100),
        responseTime: Math.random() * 2000 + 500 // Simulated for now
      };
    });
  }

  private async getSubscriptionStatus(): Promise<SubscriptionStatus[]> {
    try {
      const subscriptions = await this.subs.getSubscriptions();
      const usage = await this.tracker.list({ since: this.getThisMonth() });
      
      const providers = ['chatgpt', 'claude', 'perplexity', 'abacus'] as const;
      
      return providers.map(provider => {
        const plan = this.subs.getPlan(subscriptions[provider]);
        const providerUsage = usage.filter(u => u.provider === provider);
        
        // Calculate usage based on the primary metric for each provider
        const primaryLimit = plan.limits.find(l => 
          l.metric === 'messages' || l.metric === 'requests' || l.metric === 'tokens'
        );
        
        const usageAmount = providerUsage.reduce((sum, u) => {
          if (primaryLimit?.metric === 'tokens') return sum + u.amount;
          return sum + 1; // Count requests/messages
        }, 0);
        
        const limit = primaryLimit?.limit || Infinity;
        const usagePercent = limit === Infinity ? 0 : (usageAmount / limit) * 100;
        
        let status: 'ok' | 'warning' | 'critical' = 'ok';
        if (usagePercent > 90) status = 'critical';
        else if (usagePercent > 75) status = 'warning';
        
        return {
          provider,
          plan: plan.name,
          usage: Math.round(usagePercent),
          limit: limit === Infinity ? 0 : limit,
          status
        };
      });
    } catch (error: any) {
      return [];
    }
  }

  private determineToolStatus(usage: any[], errorRate: number): 'online' | 'offline' | 'limited' {
    if (usage.length === 0) return 'offline';
    if (errorRate > 0.3) return 'limited';
    return 'online';
  }

  private calculateOverallStatus(tools: ToolStatus[], subscriptions: SubscriptionStatus[]): 'healthy' | 'warning' | 'critical' {
    const criticalTools = tools.filter(t => t.status === 'offline').length;
    const criticalSubs = subscriptions.filter(s => s.status === 'critical').length;
    
    if (criticalTools > 2 || criticalSubs > 0) return 'critical';
    if (criticalTools > 0 || subscriptions.some(s => s.status === 'warning')) return 'warning';
    return 'healthy';
  }

  private getUptime(): string {
    const uptime = Date.now() - this.startTime.getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  private getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      used: Math.round(used.heapUsed / 1024 / 1024), // MB
      total: Math.round(used.heapTotal / 1024 / 1024) // MB
    };
  }

  private getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString();
  }

  private getThisMonth(): string {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    return thisMonth.toISOString();
  }
}
