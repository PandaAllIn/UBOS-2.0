import { AgentResult } from '../orchestrator/types.js';

export interface AgentContext {
  workingDir?: string;
  shared?: Record<string, any>;
}

export interface AgentRunOptions {
  input: string;
  timeoutMs?: number;
  dryRun?: boolean;
}

export abstract class BaseAgent {
  constructor(public id: string, public requirementId: string) {}

  abstract get type(): string;
  abstract run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult>;

  protected now() { return new Date().toISOString(); }
}

