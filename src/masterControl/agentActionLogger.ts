import { promises as fs } from 'fs';
import path from 'path';

export interface AgentAction {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  details: string;
  category: 'system' | 'development' | 'research' | 'automation' | 'coordination';
  status: 'started' | 'completed' | 'failed' | 'in_progress';
  duration?: number;
  files_modified?: string[];
  resources_used?: {
    api_calls?: number;
    compute_time?: number;
    tokens_consumed?: number;
  };
  context?: {
    project_id?: string;
    task_id?: string;
    parent_action?: string;
    related_actions?: string[];
  };
  output?: {
    summary: string;
    metrics?: Record<string, any>;
    next_steps?: string[];
  };
}

export interface SystemSnapshot {
  timestamp: string;
  active_agents: string[];
  system_health: number;
  projects_status: Record<string, string>;
  recent_actions: AgentAction[];
  system_metrics: {
    total_actions: number;
    success_rate: number;
    avg_duration: number;
    active_projects: number;
  };
}

export class AgentActionLogger {
  private logPath: string;
  private snapshotPath: string;
  private actions: AgentAction[] = [];
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.logPath = path.join('logs', 'master_control', 'agent_actions.json');
    this.snapshotPath = path.join('logs', 'master_control', 'system_snapshot.json');
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });
      
      // Load existing actions
      try {
        const data = await fs.readFile(this.logPath, 'utf-8');
        this.actions = JSON.parse(data);
      } catch (readError: any) {
        if (readError.code !== 'ENOENT') {
          console.error('❌ Failed to read existing agent actions log:', readError);
          // If file exists but is corrupted, we start fresh but log the error
        }
        this.actions = [];
      }
      
    } catch (error: any) {
      console.error('❌ Failed to initialize AgentActionLogger (mkdir or initial read):', error);
      throw error; // Re-throw to indicate a critical initialization failure
    }
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      // Should not happen if constructor is called correctly, but as a safeguard
      this.initializationPromise = this.initialize();
      await this.initializationPromise;
    }
  }

  async logAction(action: Omit<AgentAction, 'id' | 'timestamp'>): Promise<string> {
    await this.ensureInitialized();

    const actionWithMeta: AgentAction = {
      id: this.generateActionId(),
      timestamp: new Date().toISOString(),
      ...action
    };

    this.actions.push(actionWithMeta);
    
    // Keep only last 1000 actions to prevent file bloat
    if (this.actions.length > 1000) {
      this.actions = this.actions.slice(-1000);
    }

    await this.saveActions();
    console.log(`📝 Agent action logged: ${action.agent} - ${action.action}`);
    
    return actionWithMeta.id;
  }

  async updateActionStatus(
    actionId: string, 
    status: AgentAction['status'], 
    updates?: Partial<AgentAction>
  ): Promise<void> {
    await this.ensureInitialized();
    const action = this.actions.find(a => a.id === actionId);
    if (action) {
      action.status = status;
      if (updates) {
        Object.assign(action, updates);
      }
      
      // Calculate duration if completing action
      if (status === 'completed' || status === 'failed') {
        const startTime = new Date(action.timestamp).getTime();
        const endTime = Date.now();
        action.duration = Math.round((endTime - startTime) / 1000); // seconds
      }

      await this.saveActions();
      console.log(`📊 Action ${actionId} status updated: ${status}`);
    }
  }

  async getRecentActions(limit: number = 50): Promise<AgentAction[]> {
    await this.ensureInitialized();
    return this.actions.slice(-limit).reverse(); // Most recent first
  }

  async getActionsByAgent(agent: string, limit: number = 20): Promise<AgentAction[]> {
    await this.ensureInitialized();
    return this.actions
      .filter(a => a.agent === agent)
      .slice(-limit)
      .reverse();
  }

  async getActionsByCategory(category: AgentAction['category'], limit: number = 30): Promise<AgentAction[]> {
    await this.ensureInitialized();
    return this.actions
      .filter(a => a.category === category)
      .slice(-limit)
      .reverse();
  }

  async getActiveActions(): Promise<AgentAction[]> {
    await this.ensureInitialized();
    return this.actions.filter(a => 
      a.status === 'started' || a.status === 'in_progress'
    );
  }

  async generateSystemSnapshot(): Promise<SystemSnapshot> {
    await this.ensureInitialized();

    const recentActions = await this.getRecentActions(100);
    const activeActions = await this.getActiveActions();
    
    // Get unique agents from recent actions
    const activeAgents = [...new Set(recentActions
      .filter(a => Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000) // Last 24h
      .map(a => a.agent)
    )];

    // Calculate success rate
    const completedActions = recentActions.filter(a => 
      a.status === 'completed' || a.status === 'failed'
    );
    const successRate = completedActions.length > 0 
      ? Math.round((completedActions.filter(a => a.status === 'completed').length / completedActions.length) * 100) 
      : 100;

    // Calculate average duration
    const actionsWithDuration = recentActions.filter(a => a.duration !== undefined);
    const avgDuration = actionsWithDuration.length > 0
      ? Math.round(actionsWithDuration.reduce((sum, a) => sum + (a.duration || 0), 0) / actionsWithDuration.length)
      : 0;

    // Get project statuses (would integrate with project registry)
    const projectsStatus: Record<string, string> = {};
    recentActions.forEach(action => {
      if (action.context?.project_id) {
        projectsStatus[action.context.project_id] = action.status;
      }
    });

    const snapshot: SystemSnapshot = {
      timestamp: new Date().toISOString(),
      active_agents: activeAgents,
      system_health: Math.min(100, successRate + (activeActions.length === 0 ? 10 : 0)),
      projects_status: projectsStatus,
      recent_actions: recentActions.slice(0, 20),
      system_metrics: {
        total_actions: this.actions.length,
        success_rate: successRate,
        avg_duration: avgDuration,
        active_projects: Object.keys(projectsStatus).length
      }
    };

    await fs.writeFile(this.snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    return snapshot;
  }

  async searchActions(query: {
    agent?: string;
    category?: AgentAction['category'];
    status?: AgentAction['status'];
    dateFrom?: Date;
    dateTo?: Date;
    fileModified?: string;
  }): Promise<AgentAction[]> {
    await this.ensureInitialized();

    return this.actions.filter(action => {
      if (query.agent && action.agent !== query.agent) return false;
      if (query.category && action.category !== query.category) return false;
      if (query.status && action.status !== query.status) return false;
      if (query.dateFrom && new Date(action.timestamp) < query.dateFrom) return false;
      if (query.dateTo && new Date(action.timestamp) > query.dateTo) return false;
      if (query.fileModified && 
          (!action.files_modified || !action.files_modified.includes(query.fileModified))) {
        return false;
      }
      return true;
    });
  }

  private async saveActions(): Promise<void> {
    try {
      await fs.writeFile(this.logPath, JSON.stringify(this.actions, null, 2), 'utf-8');
    } catch (error: any) {
      console.error('❌ Failed to save agent actions:', error);
      throw error; // Re-throw to indicate a critical failure
    }
  }

  // Utility method for agents to quickly log start of work
  async startWork(agent: string, action: string, details: string, category: AgentAction['category'] = 'development'): Promise<string> {
    return this.logAction({
      agent,
      action,
      details,
      category,
      status: 'started'
    });
  }

  // Utility method for agents to quickly complete work
  async completeWork(actionId: string, summary: string, filesModified?: string[]): Promise<void> {
    await this.updateActionStatus(actionId, 'completed', {
      files_modified: filesModified,
      output: { summary }
    });
  }

  // Get coordination timeline for agents
  async getCoordinationTimeline(hours: number = 24): Promise<AgentAction[]> {
    await this.ensureInitialized();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.actions
      .filter(a => new Date(a.timestamp) > cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const agentActionLogger = new AgentActionLogger();

export const agentActionLogger = new AgentActionLogger();