import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import { StrategicOrchestrator } from '../orchestrator/strategicOrchestrator.js';
import { UsageAnalyticsAgent } from '../analytics/usageAnalytics.js';
import { loadKnowledgeBase, toContext } from '../memory/memoryLoader.js';
import { SystemMonitor } from './systemMonitor.js';
import { FundingOpportunityScanner } from './fundingOpportunityScanner.js';
import { projectRegistry } from '../masterControl/projectRegistry.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface MissionControlStatus {
  timestamp: string;
  system: {
    agents: { active: number; completed: number; failed: number };
    tools: { available: number; errors: number };
    memory: { notes: number; sizeKB: number };
    costs: { totalUSD: number; todayUSD: number };
  };
  eufmProject: {
    phase: string;
    progress: number;
    nextMilestone: string;
    fundingOpportunities: number;
  };
  alerts: Array<{ level: 'info' | 'warning' | 'error'; message: string; timestamp: string }>;
}

export class MissionControl {
  private orchestrator = new StrategicOrchestrator();
  private analytics = new UsageAnalyticsAgent();
  private monitor = new SystemMonitor();
  private fundingScanner = new FundingOpportunityScanner();
  private alerts: MissionControlStatus['alerts'] = [];
  public events = new EventEmitter();
  private lastCostAlertDate?: string;

  async getStatus(): Promise<MissionControlStatus> {
    const timestamp = new Date().toISOString();
    
    // System metrics (real agent activity via agentActionLogger)
    const recentActions = await agentActionLogger.getRecentActions(200);
    const agentStats = this.calculateAgentStatsFromActions(recentActions);
    
    const usage = await this.analytics.tracker.list();
    const totalCost = usage.reduce((sum, event) => sum + (event.costUSD || 0), 0);
    const todayCost = this.calculateTodayCost(usage);
    // Cost cap alerting (daily)
    const dailyCapStr = process.env.COST_DAILY_LIMIT_USD;
    if (dailyCapStr) {
      const cap = parseFloat(dailyCapStr);
      if (!isNaN(cap) && todayCost > cap) {
        const today = new Date().toISOString().split('T')[0];
        if (this.lastCostAlertDate !== today) {
          await this.addAlert('warning', `Daily cost cap exceeded: $${todayCost.toFixed(2)} > $${cap.toFixed(2)}`);
          this.lastCostAlertDate = today;
        }
      }
    }
    
    const notes = await loadKnowledgeBase();
    const context = toContext(notes, { maxBytes: 1000 });
    const memorySize = Math.round(Buffer.byteLength(context, 'utf8') / 1024);

    // EUFM Project status (real from projectRegistry)
    const projectStatus = await this.getEUFMProjectStatusReal();
    
    // Funding opportunities
    const opportunities = await this.fundingScanner.getActiveOpportunities();

    return {
      timestamp,
      system: {
        agents: agentStats,
        tools: { available: 8, errors: 0 }, // CodexAgent, JulesAgent, etc.
        memory: { notes: notes.length, sizeKB: memorySize },
        costs: { totalUSD: Math.round(totalCost * 100) / 100, todayUSD: todayCost }
      },
      eufmProject: {
        phase: projectStatus.phase,
        progress: projectStatus.progress,
        nextMilestone: projectStatus.nextMilestone,
        fundingOpportunities: opportunities.length
      },
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }

  private calculateAgentStatsFromActions(actions: any[]) {
    let active = 0, completed = 0, failed = 0;
    for (const a of actions) {
      if (a.status === 'started' || a.status === 'in_progress') active++;
      else if (a.status === 'completed') completed++;
      else if (a.status === 'failed') failed++;
    }
    return { active, completed, failed };
  }

  private calculateTodayCost(usage: any[]): number {
    const today = new Date().toISOString().split('T')[0];
    return usage
      .filter(event => event.ts.startsWith(today))
      .reduce((sum, event) => sum + (event.costUSD || 0), 0);
  }

  private async getEUFMProjectStatusReal() {
    const projects = await projectRegistry.getAllProjects();
    // Compute average progress, and pick earliest upcoming milestone across projects
    const progress = Math.round(
      projects.reduce((sum, p) => sum + (p.metrics?.progressPercentage || 0), 0) / (projects.length || 1)
    );

    let nextMilestone = 'TBD';
    const upcoming: { name: string; date: string }[] = [];
    for (const p of projects) {
      for (const m of p.timeline.milestones) {
        if (m.status === 'pending' || m.status === 'in_progress') {
          upcoming.push({ name: `${p.name}: ${m.name}`, date: m.date });
        }
      }
    }
    if (upcoming.length) {
      upcoming.sort((a, b) => a.date.localeCompare(b.date));
      nextMilestone = `${upcoming[0].name} (${upcoming[0].date})`;
    }

    const phase = 'Active Portfolio Execution';
    return { phase, progress, nextMilestone };
  }

  async addAlert(level: 'info' | 'warning' | 'error', message: string) {
    this.alerts.push({
      level,
      message,
      timestamp: new Date().toISOString()
    });
    this.events.emit('alert', { level, message });
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  async executeTask(taskDescription: string, options: { dryRun?: boolean } = {}) {
    await this.addAlert('info', `Starting task: ${taskDescription}`);
    this.events.emit('progress', { stage: 'task', message: 'Starting task…', percent: 5 });
    
    try {
      const result = await this.orchestrator.execute(taskDescription, options);
      await this.addAlert('info', `Task completed successfully: ${result.taskId}`);
      this.events.emit('notify', { level: 'success', message: 'Task completed successfully' });
      return result;
    } catch (error) {
      await this.addAlert('error', `Task failed: ${error}`);
      this.events.emit('notify', { level: 'error', message: 'Task execution failed' });
      throw error;
    }
  }

  async scanFundingOpportunities() {
    await this.addAlert('info', 'Starting EU funding opportunity scan...');
    try {
      const opportunities = await this.fundingScanner.scanAll((evt) => this.events.emit('progress', evt));
      await this.addAlert('info', `Found ${opportunities.length} funding opportunities`);
      this.events.emit('notify', { level: 'success', message: `Scan complete — ${opportunities.length} found` });
      return opportunities;
    } catch (error) {
      await this.addAlert('error', `Funding scan failed: ${error}`);
      this.events.emit('notify', { level: 'error', message: 'Funding scan failed' });
      throw error;
    }
  }

  // Enhanced data accessors for dashboard
  async getTools() {
    const health = await this.monitor.getHealth();
    return health.tools;
  }

  async getSubscriptions() {
    const health = await this.monitor.getHealth();
    return health.subscriptions;
  }

  async getOpportunities() {
    return await this.fundingScanner.getActiveOpportunities();
  }

  async searchAll(query: string) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [] as Array<{ type: string; title: string; snippet?: string }>; 

    const [notes, opps, status] = await Promise.all([
      loadKnowledgeBase(),
      this.fundingScanner.getActiveOpportunities(),
      this.getStatus(),
    ]);

    const noteMatches = notes
      .filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .slice(0, 10)
      .map(n => ({ type: 'note', title: n.title, snippet: snippet(n.content, q) }));

    const oppMatches = opps
      .filter(o => o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || o.program.toLowerCase().includes(q))
      .slice(0, 10)
      .map(o => ({ type: 'opportunity', title: `${o.title} • ${o.program}`, snippet: `Deadline ${o.deadline} • ${o.status}` }));

    const alertMatches = status.alerts
      .filter(a => a.message.toLowerCase().includes(q))
      .slice(0, 10)
      .map(a => ({ type: 'alert', title: a.message, snippet: new Date(a.timestamp).toLocaleString() }));

    return [...noteMatches, ...oppMatches, ...alertMatches].slice(0, 20);
  }
}

function snippet(text: string, q: string, span: number = 80): string {
  const i = text.toLowerCase().indexOf(q);
  if (i === -1) return text.slice(0, span);
  const start = Math.max(0, i - Math.floor(span / 2));
  return (start > 0 ? '…' : '') + text.slice(start, start + span) + '…';
}
