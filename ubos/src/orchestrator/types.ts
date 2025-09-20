export type Capability =
  | 'coding'
  | 'research'
  | 'data'
  | 'web_automation'
  | 'memory'
  | 'file_operations'
  | 'system_access'
  | 'agent_discovery'
  | 'meta_analysis';

export interface TaskRequirement {
  id: string;
  description: string;
  capabilities: Capability[];
  dependencies?: string[];
  priority?: number;
  estimatedComplexity: 'low' | 'medium' | 'high';
  estimatedResources: {
    timeMinutes: number;
    tokens?: number;
    concurrency?: number;
  };
  optimizations?: string[];
}

export interface AnalyzedTask {
  taskId: string;
  title: string;
  original: string;
  requirements: TaskRequirement[];
  riskLevel: 'low' | 'medium' | 'high';
  notes?: string[];
}

export interface AgentSpec {
  id: string;
  type:
    | 'CodexAgent'
    | 'CodexCLIAgent'
    | 'CodeReviewAgent'
    | 'AbacusAgent'
    | 'EnhancedAbacusAgent'
    | 'AgentSummonerAgent'
    | 'AgentSummoner'
    | 'EUFMAgentSummoner'
    | 'SmokeTestAgent'
    | 'EUFundingProposalAgent'
    | 'BrowserAgent'
    | 'MemoryAgent'
    | 'TestAgent'
    | 'figma-mcp'
    | 'spec-kit-codex'
    | 'CoordinationAgent'
  | 'UBOSDesignSpecAgent'
  | 'tool-docs'
  | 'enhanced-tool-docs';
  requirementId: string;
  capabilities: Capability[];
  params?: Record<string, unknown>;
}

export interface AgentResult {
  agentId: string;
  requirementId: string;
  success: boolean;
  output: string;
  artifacts?: Record<string, unknown>;
  costUSD?: number;
  startedAt: string;
  finishedAt: string;
  retries?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationPlan {
  task: AnalyzedTask;
  agentSpecs: AgentSpec[];
  parallelBatches: string[][]; // batches of requirementIds to run in parallel
  suggestions: string[];
}

export interface OrchestrationResult {
  taskId: string;
  startedAt: string;
  finishedAt: string;
  plan: OrchestrationPlan;
  results: AgentResult[];
  success: boolean;
  summary: string;
}
