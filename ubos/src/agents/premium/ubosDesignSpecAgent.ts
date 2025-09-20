import { BaseAgent, AgentRunOptions, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import fs from 'fs/promises';
import path from 'path';

// Context7-guided: UBOS design specification agent feature definition
const ubosDesignFeature: AgentFeature = {
  type: 'ubos-design-spec',
  capabilities: ['spec-loading', 'design-documentation', 'requirements-management'],
  requirements: { specs: ['dashboard', 'api', 'ui'] }
};

export class UBOSDesignSpecAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'ubos-design-agent') {
    super(id, requirementId, ubosDesignFeature);
  }

  get type(): string { return 'UBOSDesignSpecAgent'; }

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
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
          finishedAt: this.getNow()
        };
      }

      if (input.includes('help')) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: 'Commands: "get dashboard spec", "help"',
          startedAt,
          finishedAt: this.getNow()
        };
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: 'Unsupported command. Try: get dashboard spec',
        startedAt,
        finishedAt: this.getNow()
      };
    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }
}
