import { CodexCLIAgent } from '../agents/codexCLIAgent.js';
import { EUFMAgentSummoner } from '../agents/eufmAgentSummoner.js';
import { AgentSummoner } from '../agents/agentSummoner.js';
import { EnhancedAbacusAgent } from '../agents/enhancedAbacusAgent.js';
import { JulesAgent } from '../agents/julesAgent.js';
import { codexCLI } from './codexCLI.js';
import { promises as fs } from 'fs';
import path from 'path';

export interface ClaudeAgentSession {
  sessionId: string;
  startedAt: string;
  tasksCompleted: number;
  totalCost: number;
  activeAgents: string[];
}

/**
 * Direct agent interface for Claude to use EUFM agents
 * This provides a simplified API for Claude to interact with the agent system
 */
export class ClaudeAgentInterface {
  private session: ClaudeAgentSession;
  private summoner: EUFMAgentSummoner;
  private comprehensiveSummoner: AgentSummoner;
  private codexAgent: CodexCLIAgent;
  private researchAgent: EnhancedAbacusAgent;
  private reviewAgent: JulesAgent;

  constructor() {
    // Initialize session
    this.session = {
      sessionId: `claude_${Date.now()}`,
      startedAt: new Date().toISOString(),
      tasksCompleted: 0,
      totalCost: 0,
      activeAgents: []
    };

    // Initialize agents
    this.summoner = new EUFMAgentSummoner('claude_summoner', 'claude_coordination');
    this.comprehensiveSummoner = new AgentSummoner('claude_comprehensive_summoner', 'claude_agent_discovery');
    this.codexAgent = new CodexCLIAgent('claude_codex', 'claude_development');
    this.researchAgent = new EnhancedAbacusAgent('claude_research', 'claude_analysis');
    this.reviewAgent = new JulesAgent('claude_review', 'claude_quality');
  }

  // === CODEX CLI INTEGRATION ===
  
  async executeCodexTask(task: string, options: {
    mode?: 'agent' | 'chat' | 'full_access';
    timeout?: number;
    targetFiles?: string[];
  } = {}): Promise<string> {
    console.log(`🤖 Claude → Codex CLI: ${task.slice(0, 100)}...`);
    
    const result = await this.codexAgent.run({
      input: task,
      dryRun: false
    });

    this.updateSession('CodexCLI', result.success);

    if (!result.success) {
      throw new Error(`Codex execution failed: ${result.error}`);
    }

    return result.output;
  }

  async generateCode(prompt: string, targetFiles?: string[]): Promise<string> {
    return await this.executeCodexTask(
      `Generate code: ${prompt}${targetFiles ? `\nTarget files: ${targetFiles.join(', ')}` : ''}`,
      { targetFiles }
    );
  }

  async refactorCode(description: string, targetFiles: string[]): Promise<string> {
    return await this.executeCodexTask(
      `Refactor: ${description}\nFiles: ${targetFiles.join(', ')}`,
      { targetFiles }
    );
  }

  async createFeature(featureDescription: string, relevantFiles?: string[]): Promise<string> {
    return await this.executeCodexTask(
      `Add feature: ${featureDescription}${relevantFiles ? `\nRelevant files: ${relevantFiles.join(', ')}` : ''}`,
      { relevantFiles }
    );
  }

  async debugIssue(description: string, relevantFiles?: string[]): Promise<string> {
    return await this.executeCodexTask(
      `Debug: ${description}${relevantFiles ? `\nCheck files: ${relevantFiles.join(', ')}` : ''}`,
      { relevantFiles }
    );
  }

  async reviewCode(files: string[], criteria?: string): Promise<string> {
    const task = criteria ? 
      `Review ${files.join(', ')} for: ${criteria}` :
      `Review ${files.join(', ')} for quality and improvements`;
    
    return await this.executeCodexTask(task, { targetFiles: files });
  }

  async setupProject(requirements: string): Promise<string> {
    return await this.executeCodexTask(`Set up project: ${requirements}`);
  }

  // === RESEARCH CAPABILITIES ===

  async conductResearch(query: string, options: {
    depth?: 'quick' | 'comprehensive' | 'deep';
    domain?: string;
    sources?: 'academic' | 'commercial' | 'mixed';
  } = {}): Promise<string> {
    console.log(`🔍 Claude → Research: ${query.slice(0, 100)}...`);

    const result = await this.researchAgent.run({
      input: query,
      dryRun: false
    });

    this.updateSession('Research', result.success, result.metadata?.researchCost);

    if (!result.success) {
      throw new Error(`Research failed: ${result.error}`);
    }

    return result.output;
  }

  async analyzeRequirements(projectDescription: string): Promise<{
    suggestions: string[];
    cost: number;
    timeline: string;
  }> {
    const analysis = await this.researchAgent.analyzeResearchNeeds(projectDescription);
    
    return {
      suggestions: analysis.recommendedQueries,
      cost: analysis.estimatedCost,
      timeline: analysis.researchStrategy
    };
  }

  // === AGENT SUMMONING ===

  /**
   * Find optimal agent using EUFM-specific summoner (fast, internal knowledge)
   */
  async findOptimalAgent(taskDescription: string): Promise<string> {
    console.log(`🎯 Claude → EUFM Agent Summoner: ${taskDescription.slice(0, 100)}...`);

    const result = await this.summoner.run({
      input: taskDescription,
      dryRun: false
    });

    this.updateSession('EUFMSummoner', result.success);

    if (!result.success) {
      throw new Error(`EUFM agent summoning failed: ${result.error}`);
    }

    return result.output;
  }

  /**
   * Comprehensive agent summoning using proven 3-step research methodology
   * For discovering external agents and tools beyond EUFM system
   */
  async discoverExternalAgents(taskDescription: string): Promise<string> {
    console.log(`🧙‍♂️ Claude → Comprehensive Agent Summoner: ${taskDescription.slice(0, 100)}...`);

    const result = await this.comprehensiveSummoner.run({
      input: taskDescription,
      dryRun: false
    });

    this.updateSession('ComprehensiveSummoner', result.success);

    if (!result.success) {
      throw new Error(`Comprehensive agent summoning failed: ${result.error}`);
    }

    return result.output;
  }

  async quickAnalysis(task: string): Promise<string> {
    return await this.summoner.quickAnalysis(task);
  }

  // === SYSTEM STATUS ===

  async getSystemStatus(): Promise<{
    session: ClaudeAgentSession;
    codexAvailable: boolean;
    agentsReady: string[];
    recentTasks: string[];
  }> {
    const codexStatus = await codexCLI.getStatus();
    const recentLogs = await codexCLI.getRecentLogs(3);
    
    return {
      session: { ...this.session },
      codexAvailable: codexStatus.available,
      agentsReady: ['CodexCLI', 'Research', 'Summoner', 'Review'],
      recentTasks: recentLogs.map(log => 
        log.split('\n')[0].replace('=== ', '').replace(' ===', '')
      )
    };
  }

  // === DIRECT SYSTEM ACCESS ===

  async directCodexCommand(command: string): Promise<string> {
    console.log(`⚡ Claude → Direct Codex: ${command}`);
    return await codexCLI.quickTask(command);
  }

  async checkCodexAvailable(): Promise<boolean> {
    const status = await codexCLI.getStatus();
    return status.available;
  }

  // === FILE OPERATIONS ===

  async readProjectFile(filePath: string): Promise<string> {
    try {
      const fullPath = path.resolve('/Users/panda/Desktop/EUFM', filePath);
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error}`);
    }
  }

  async writeProjectFile(filePath: string, content: string): Promise<void> {
    try {
      const fullPath = path.resolve('/Users/panda/Desktop/EUFM', filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Could not write file ${filePath}: ${error}`);
    }
  }

  async listProjectFiles(directory: string = ''): Promise<string[]> {
    try {
      const fullPath = path.resolve('/Users/panda/Desktop/EUFM', directory);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map(entry => 
        entry.isDirectory() ? `${entry.name}/` : entry.name
      );
    } catch (error) {
      throw new Error(`Could not list directory ${directory}: ${error}`);
    }
  }

  // === WORKFLOW AUTOMATION ===

  async executeWorkflow(steps: Array<{
    type: 'codex' | 'research' | 'analyze';
    task: string;
    options?: any;
  }>): Promise<{
    results: string[];
    totalTime: number;
    totalCost: number;
  }> {
    const startTime = Date.now();
    const results = [];
    let totalCost = 0;

    for (const step of steps) {
      console.log(`📋 Workflow Step: ${step.type} - ${step.task.slice(0, 50)}...`);
      
      let result = '';
      switch (step.type) {
        case 'codex':
          result = await this.executeCodexTask(step.task, step.options);
          break;
        case 'research':
          result = await this.conductResearch(step.task, step.options);
          break;
        case 'analyze':
          result = await this.quickAnalysis(step.task);
          break;
      }
      
      results.push(result);
    }

    const totalTime = Date.now() - startTime;
    
    return {
      results,
      totalTime,
      totalCost: this.session.totalCost
    };
  }

  // === SESSION MANAGEMENT ===

  private updateSession(agentType: string, success: boolean, cost: number = 0) {
    if (success) {
      this.session.tasksCompleted++;
    }
    
    this.session.totalCost += cost;
    
    if (!this.session.activeAgents.includes(agentType)) {
      this.session.activeAgents.push(agentType);
    }
  }

  async saveSession(): Promise<string> {
    const sessionPath = `/Users/panda/Desktop/EUFM/logs/claude_sessions/${this.session.sessionId}.json`;
    await fs.mkdir(path.dirname(sessionPath), { recursive: true });
    await fs.writeFile(sessionPath, JSON.stringify(this.session, null, 2));
    return sessionPath;
  }

  getSession(): ClaudeAgentSession {
    return { ...this.session };
  }

  // === HELPER METHODS ===

  async estimateTaskComplexity(taskDescription: string): Promise<{
    complexity: 'simple' | 'moderate' | 'complex';
    recommendedAgent: string;
    estimatedTime: string;
    estimatedCost: number;
  }> {
    const analysis = await this.quickAnalysis(taskDescription);
    
    // Parse the analysis (this would be enhanced with proper parsing)
    return {
      complexity: 'moderate', // Would be parsed from analysis
      recommendedAgent: 'CodexCLI', // Would be parsed from analysis
      estimatedTime: '5-10 minutes',
      estimatedCost: 0.05
    };
  }
}

// Singleton instance for easy access
export const claudeInterface = new ClaudeAgentInterface();

// Convenience functions for direct use
export async function useCodex(task: string): Promise<string> {
  return await claudeInterface.executeCodexTask(task);
}

export async function research(query: string, depth: 'quick' | 'comprehensive' | 'deep' = 'comprehensive'): Promise<string> {
  return await claudeInterface.conductResearch(query, { depth });
}

export async function findBestAgent(task: string): Promise<string> {
  return await claudeInterface.findOptimalAgent(task);
}

export async function analyzeTask(task: string): Promise<any> {
  return await claudeInterface.estimateTaskComplexity(task);
}

// Quick status check
export async function systemReady(): Promise<boolean> {
  const status = await claudeInterface.getSystemStatus();
  return status.codexAvailable && status.agentsReady.length > 0;
}

