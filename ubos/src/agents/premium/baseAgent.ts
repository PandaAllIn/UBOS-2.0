import { AgentResult } from '../../orchestrator/types.js';

export interface AgentContext {
  workingDir?: string;
  shared?: Record<string, unknown>;
}

export interface AgentRunOptions {
  input: string;
  timeoutMs?: number;
  dryRun?: boolean;
  userId?: string;
}

// Context7-guided: AgentFeature interface for consistent agent capabilities
export interface AgentFeature {
  type: string;
  capabilities: string[];
  requirements?: Record<string, unknown>;
}

// Context7-pattern: Unified BaseAgent with feature property + userId validation
export abstract class BaseAgent {
  public id: string;
  public requirementId: string;
  public feature: AgentFeature;
  protected state: {
    id: string;
    initialized: boolean;
    lastRun?: string;
  };

  constructor(id: string, requirementId: string, feature: AgentFeature) {
    this.id = id;
    this.requirementId = requirementId;
    this.feature = feature;
    this.state = {
      id,
      initialized: false
    };
  }

  abstract get type(): string;
  abstract run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult>;

  protected getNow() {
    return new Date().toISOString();
  }

  protected validateAgentOptions(opts: AgentRunOptions): void {
    if (!opts.userId || !opts.userId.trim()) {
      opts.userId = 'system';
    }
    if (typeof opts.input !== 'string') {
      throw new Error('input must be a string');
    }
  }
}
