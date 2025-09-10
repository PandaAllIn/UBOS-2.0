import { BaseAgent, AgentRunOptions, AgentContext } from './baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';
import fs from 'fs/promises';
import path from 'path';

export class UBOSDesignSpecAgent extends BaseAgent {
  get type(): string { return 'UBOSDesignSpecAgent'; }

  async run(opts: AgentRunOptions, _ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();
    try {
      const input = (opts.input || '').toLowerCase();

      if (input.includes('spec') || input.includes('dashboard')) {
        const specPath = path.resolve(process.cwd(), 'specs', 'ubos_dashboard_spec.json');
        const specRaw = await fs.readFile(specPath, 'utf-8');
        const spec = JSON.parse(specRaw);
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: 'UBOS Dashboard design spec loaded',
          artifacts: { spec, specPath },
          startedAt,
          finishedAt: this.now()
        };
      }

      if (input.includes('help')) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: 'Commands: "get dashboard spec", "help"',
          startedAt,
          finishedAt: this.now()
        };
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: 'Unsupported command. Try: get dashboard spec',
        startedAt,
        finishedAt: this.now()
      };
    } catch (error: any) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: error?.message || String(error),
        startedAt,
        finishedAt: this.now()
      };
    }
  }
}

