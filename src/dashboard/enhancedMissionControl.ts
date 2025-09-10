import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import { MissionControl, MissionControlStatus } from './missionControl.js';
import { AgentSummonerAgent } from '../agents/agentSummonerAgent.js';
import { EnhancedAbacusAgent } from '../agents/enhancedAbacusAgent.js';
import { EnhancedPerplexityResearch } from '../tools/enhancedPerplexityResearch.js';
import { StrategicOrchestrator } from '../orchestrator/strategicOrchestrator.js';
import path from 'path';

export interface SessionMemory {
  sessionId: string;
  startedAt: string;
  lastActiveAt: string;
  context: {
    currentProject?: string;
    activeObjectives?: string[];
    completedTasks?: any[];
    discoveredAgents?: any[];
    researchCosts?: number;
  };
  conversationHistory: Array<{
    timestamp: string;
    type: 'user_input' | 'agent_output' | 'system_event';
    content: string;
    metadata?: any;
  }>;
}

export interface EnhancedMissionControlStatus extends MissionControlStatus {
  agentSummoner: {
    totalSummonings: number;
    averageCost: number;
    successRate: number;
    lastSummoning?: string;
  };
  researchCapabilities: {
    perplexityCredits: number;
    dailyCost: number;
    monthlyQueries: number;
    avgConfidence: number;
  };
  sessionContext: {
    sessionId: string;
    activeDuration: string;
    tasksCompleted: number;
    activeAgents: number;
  };
}

export class EnhancedMissionControl extends MissionControl {
  private agentSummoner: AgentSummonerAgent;
  private enhancedResearcher: EnhancedPerplexityResearch;
  private sessionMemory!: SessionMemory;
  private sessionDir = 'logs/sessions';

  constructor() {
    super();
    
    // Initialize Agent Summoner
    this.agentSummoner = new AgentSummonerAgent('summoner_main', 'meta_coordination');
    
    // Initialize Enhanced Research
    this.enhancedResearcher = new EnhancedPerplexityResearch();
    
    // Initialize or restore session
    this.initializeSession();
  }

  private async initializeSession(): Promise<void> {
    const sessionId = `session_${Date.now()}`;
    
    // Try to restore the most recent session
    try {
      const recentSession = await this.getRecentSession();
      if (recentSession && this.isSessionActive(recentSession)) {
        this.sessionMemory = recentSession;
        this.sessionMemory.lastActiveAt = new Date().toISOString();
        await this.addToHistory('system_event', `Session ${recentSession.sessionId} restored`);
      } else {
        throw new Error('No active session found');
      }
    } catch {
      // Create new session
      this.sessionMemory = {
        sessionId,
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        context: {
          researchCosts: 0
        },
        conversationHistory: []
      };
      await this.addToHistory('system_event', `New session ${sessionId} created`);
    }
    
    // Save session on initialization
    await this.saveSession();
  }

  private isSessionActive(session: SessionMemory): boolean {
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    return hoursSinceActive < 24; // Consider session active if used within 24 hours
  }

  private async getRecentSession(): Promise<SessionMemory | null> {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessionFiles = files
        .filter(f => f.startsWith('session_') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (sessionFiles.length === 0) return null;
      
      const content = await fs.readFile(path.join(this.sessionDir, sessionFiles[0]), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async saveSession(): Promise<void> {
    await fs.mkdir(this.sessionDir, { recursive: true });
    const filename = `${this.sessionMemory.sessionId}.json`;
    const filepath = path.join(this.sessionDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(this.sessionMemory, null, 2));
  }

  private async addToHistory(type: SessionMemory['conversationHistory'][0]['type'], content: string, metadata?: any): Promise<void> {
    this.sessionMemory.conversationHistory.push({
      timestamp: new Date().toISOString(),
      type,
      content,
      metadata
    });
    
    // Keep history manageable (last 100 entries)
    if (this.sessionMemory.conversationHistory.length > 100) {
      this.sessionMemory.conversationHistory = this.sessionMemory.conversationHistory.slice(-100);
    }
    
    this.sessionMemory.lastActiveAt = new Date().toISOString();
    await this.saveSession();
  }

  // Enhanced status that includes Agent Summoner and research capabilities
  async getEnhancedStatus(): Promise<EnhancedMissionControlStatus> {
    const baseStatus = await this.getStatus();
    
    // Get Agent Summoner statistics
    const summonerStats = await this.getAgentSummonerStats();
    
    // Get research capabilities status
    const researchStats = await this.getResearchStats();
    
    // Calculate session context
    const sessionStart = new Date(this.sessionMemory.startedAt);
    const activeDuration = this.formatDuration(Date.now() - sessionStart.getTime());
    const tasksCompleted = this.sessionMemory.context.completedTasks?.length || 0;
    
    return {
      ...baseStatus,
      agentSummoner: summonerStats,
      researchCapabilities: researchStats,
      sessionContext: {
        sessionId: this.sessionMemory.sessionId,
        activeDuration,
        tasksCompleted,
        activeAgents: baseStatus.system.agents.active
      }
    };
  }

  private async getAgentSummonerStats() {
    try {
      const files = await fs.readdir('logs/agent_summoner');
      const summoningFiles = files.filter(f => f.startsWith('summoning_') && f.endsWith('.json'));
      
      if (summoningFiles.length === 0) {
        return {
          totalSummonings: 0,
          averageCost: 0,
          successRate: 0
        };
      }
      
      let totalCost = 0;
      let successful = 0;
      let lastSummoning = '';
      
      for (const file of summoningFiles) {
        try {
          const content = await fs.readFile(path.join('logs/agent_summoner', file), 'utf-8');
          const result = JSON.parse(content);
          totalCost += result.estimatedCost || 0;
          if (result.confidence > 0.7) successful++;
          lastSummoning = file;
        } catch {
          continue;
        }
      }
      
      return {
        totalSummonings: summoningFiles.length,
        averageCost: totalCost / summoningFiles.length,
        successRate: successful / summoningFiles.length,
        lastSummoning: lastSummoning.replace('summoning_', '').replace('.json', '')
      };
    } catch {
      return {
        totalSummonings: 0,
        averageCost: 0,
        successRate: 0
      };
    }
  }

  private async getResearchStats() {
    try {
      const history = await this.enhancedResearcher.getResearchHistory(30);
      const monthlyCost = await this.enhancedResearcher.getTotalResearchCost(30);
      const dailyCost = await this.enhancedResearcher.getTotalResearchCost(1);
      
      const avgConfidence = history.length > 0 ? 
        history.reduce((sum, r) => sum + r.confidence, 0) / history.length : 0;
      
      return {
        perplexityCredits: 1000, // This would be fetched from actual subscription
        dailyCost: Math.round(dailyCost * 100) / 100,
        monthlyQueries: history.length,
        avgConfidence: Math.round(avgConfidence * 100)
      };
    } catch {
      return {
        perplexityCredits: 0,
        dailyCost: 0,
        monthlyQueries: 0,
        avgConfidence: 0
      };
    }
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  // Enhanced task execution with Agent Summoner integration
  async executeEnhancedTask(taskDescription: string, options: { 
    dryRun?: boolean;
    useAgentSummoner?: boolean;
    researchDepth?: 'quick' | 'comprehensive' | 'deep';
    saveContext?: boolean;
  } = {}) {
    await this.addToHistory('user_input', taskDescription);
    await this.addAlert('info', `Starting enhanced task: ${taskDescription}`);
    this.events.emit('progress', { stage: 'analysis', message: 'Analyzing task requirements…', percent: 10 });
    
    try {
      let result;
      
      // Determine if Agent Summoner should be used
      const shouldUseSummoner = options.useAgentSummoner || 
        this.shouldUseAgentSummoner(taskDescription);
      
      if (shouldUseSummoner) {
        // Use Agent Summoner for optimal agent discovery
        this.events.emit('progress', { stage: 'summoning', message: 'Discovering optimal agents…', percent: 30 });
        
        const summonerResult = await this.agentSummoner.run({
          input: taskDescription,
          dryRun: options.dryRun || false
        });
        
        if (summonerResult.success && summonerResult.metadata?.summoningResult) {
          // Execute with discovered optimal configuration
          const optimalConfig = this.parseAgentRecommendations(summonerResult.metadata.summoningResult);
          result = await this.executeWithOptimalConfig(taskDescription, optimalConfig, options);
        } else {
          // Fall back to standard orchestration
          result = await this.orchestrator.execute(taskDescription, options);
        }
        
        await this.addToHistory('agent_output', `Agent Summoner: ${summonerResult.output}`, {
          cost: summonerResult.metadata?.summoningResult?.estimatedCost,
          confidence: summonerResult.metadata?.summoningResult?.confidence
        });
        
      } else {
        // Use standard orchestration for simpler tasks
        this.events.emit('progress', { stage: 'orchestration', message: 'Coordinating standard agents…', percent: 40 });
        result = await this.orchestrator.execute(taskDescription, options);
      }
      
      // Update session context
      if (options.saveContext !== false) {
        await this.updateSessionContext(taskDescription, result);
      }
      
      await this.addToHistory('system_event', `Task completed: ${result.success ? 'Success' : 'Failed'}`, {
        taskId: result.taskId,
        duration: new Date(result.finishedAt).getTime() - new Date(result.startedAt).getTime()
      });
      
      await this.addAlert('info', `Enhanced task completed: ${result.taskId}`);
      this.events.emit('notify', { 
        level: result.success ? 'success' : 'error', 
        message: result.success ? 'Enhanced task completed successfully' : 'Enhanced task execution failed'
      });
      
      return result;
      
    } catch (error: any) {
      await this.addAlert('error', `Enhanced task failed: ${error}`);
      await this.addToHistory('system_event', `Task error: ${error}`, { error: String(error) });
      this.events.emit('notify', { level: 'error', message: 'Enhanced task execution failed' });
      throw error;
    }
  }

  private shouldUseAgentSummoner(taskDescription: string): boolean {
    const summonerTriggers = [
      'what agent', 'which tool', 'best approach', 'optimal solution',
      'how should i', 'what\'s the best way', 'recommend', 'suggest',
      'complex task', 'multiple steps', 'comprehensive analysis'
    ];
    
    const desc = taskDescription.toLowerCase();
    return summonerTriggers.some(trigger => desc.includes(trigger)) ||
           desc.split(' ').length > 15; // Long descriptions likely benefit from agent discovery
  }

  private parseAgentRecommendations(summoningResult: any): any {
    // Parse Agent Summoner results to create optimal execution configuration
    return {
      preferredAgents: summoningResult.discoveredAgents?.slice(0, 3) || [],
      estimatedComplexity: summoningResult.confidence || 0.7,
      recommendedApproach: summoningResult.implementationPlan || 'standard',
      budgetConstraints: summoningResult.estimatedCost || 0
    };
  }

  private async executeWithOptimalConfig(taskDescription: string, config: any, options: any) {
    // Enhanced execution using Agent Summoner recommendations
    // This would integrate the discovered agents and optimal configuration
    // For now, fall back to standard execution with enhanced context
    const enhancedOptions = {
      ...options,
      metadata: {
        agentRecommendations: config.preferredAgents,
        complexity: config.estimatedComplexity,
        approach: config.recommendedApproach
      }
    };
    
    return await this.orchestrator.execute(taskDescription, enhancedOptions);
  }

  private async updateSessionContext(taskDescription: string, result: any): Promise<void> {
    // Update session memory with task completion
    if (!this.sessionMemory.context.completedTasks) {
      this.sessionMemory.context.completedTasks = [] as any[];
    }
    
    this.sessionMemory.context.completedTasks.push({
      taskDescription: taskDescription.slice(0, 100),
      taskId: result.taskId,
      success: result.success,
      completedAt: result.finishedAt
    });
    
    // Update research costs
    if (result.metadata?.cost) {
      this.sessionMemory.context.researchCosts = 
        (this.sessionMemory.context.researchCosts || 0) + result.metadata.cost;
    }
    
    await this.saveSession();
  }

  // Method to get session context for continuity
  getSessionContext(): SessionMemory {
    return { ...this.sessionMemory };
  }

  // Method to restore specific session
  async restoreSession(sessionId: string): Promise<boolean> {
    try {
      const sessionFile = path.join(this.sessionDir, `${sessionId}.json`);
      const content = await fs.readFile(sessionFile, 'utf-8');
      this.sessionMemory = JSON.parse(content);
      this.sessionMemory.lastActiveAt = new Date().toISOString();
      await this.saveSession();
      
      await this.addToHistory('system_event', `Session ${sessionId} manually restored`);
      return true;
    } catch {
      return false;
    }
  }

  // Method to analyze project requirements using enhanced research
  async analyzeProjectRequirements(projectDescription: string): Promise<{
    researchSuggestions: string[];
    estimatedCost: number;
    recommendedApproach: string;
    timelineEstimate: string;
  }> {
    // Use Enhanced Abacus to analyze project requirements
    const enhancedAbacus = new EnhancedAbacusAgent('analysis_temp', 'project_analysis');
    
    const analysis = await enhancedAbacus.analyzeResearchNeeds(projectDescription);
    
    return {
      researchSuggestions: analysis.recommendedQueries,
      estimatedCost: analysis.estimatedCost,
      recommendedApproach: analysis.researchStrategy,
      timelineEstimate: this.estimateTimeline(analysis.recommendedQueries.length)
    };
  }

  private estimateTimeline(queryCount: number): string {
    const minutesPerQuery = 3; // Including processing and review time
    const totalMinutes = queryCount * minutesPerQuery;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  // Export session data for analysis or backup
  async exportSessionData(): Promise<string> {
    const exportData = {
      sessionInfo: {
        sessionId: this.sessionMemory.sessionId,
        duration: this.formatDuration(
          new Date(this.sessionMemory.lastActiveAt).getTime() - 
          new Date(this.sessionMemory.startedAt).getTime()
        ),
        totalInteractions: this.sessionMemory.conversationHistory.length
      },
      context: this.sessionMemory.context,
      recentHistory: this.sessionMemory.conversationHistory.slice(-20),
      systemStatus: await this.getEnhancedStatus(),
      exportedAt: new Date().toISOString()
    };
    
    const exportFilename = `session_export_${this.sessionMemory.sessionId}_${Date.now()}.json`;
    const exportPath = path.join('logs/exports', exportFilename);
    
    await fs.mkdir('logs/exports', { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    return exportPath;
  }
}
