// Context7-integration: Importing AgentFeature from premium baseAgent for consistency
import { AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';

export interface AgentContext {
  workingDir?: string;
  shared?: Record<string, unknown>;
}

export interface AgentRunOptions {
  userId?: string;
  input: string;
  timeoutMs?: number;
  dryRun?: boolean;
}

// Context7-guided: Community BaseAgent with consistent feature interface
export abstract class BaseAgent {
  public id: string;
  public feature: AgentFeature;
  protected capabilities: AgentFeature['capabilities'];
  protected state: { id: string; initialized: boolean };

  constructor(id: string, feature: AgentFeature) {
    this.id = id;
    this.feature = feature;
    this.capabilities = feature.capabilities;
    this.state = { id, initialized: true };
  }

  abstract run(options: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult>;

  protected getNow() { return new Date().toISOString(); }

  protected validateOptions(options: AgentRunOptions): void {
    if (!options.userId || !options.userId.trim()) {
      options.userId = 'system';
    }
    if (typeof options.input !== 'string') {
      throw new Error('input must be a string');
    }
  }
}
