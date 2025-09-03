export type Capability = 'coding' | 'research' | 'data' | 'web_automation' | 'memory';

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
  type: 'CodexAgent' | 'JulesAgent' | 'AbacusAgent' | 'BrowserAgent' | 'MemoryAgent';
  requirementId: string;
  capabilities: Capability[];
  params?: Record<string, any>;
}

export interface AgentResult {
  agentId: string;
  requirementId: string;
  success: boolean;
  output: string;
  artifacts?: Record<string, any>;
  costUSD?: number;
  startedAt: string;
  finishedAt: string;
  retries?: number;
  error?: string;
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

