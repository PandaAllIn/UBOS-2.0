
import { BaseAgent, AgentRunOptions, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { EUFMPipelineCoordinator } from '../coordinator/eufmPipelineCoordinator.js';
import { promises as fs } from 'fs';
import path from 'path';

// Context7-guided: EUFM agent feature definition
const eufmFeature: AgentFeature = {
  type: 'eufm-pipeline',
  capabilities: ['agent-coordination', 'pipeline-management', 'eufm-integration'],
  requirements: { minAgents: 3 }
};

/**
 * EUFMAgentSummoner - Entry point for the EUFM 4-stage agent pipeline.
 * This agent is responsible for initiating the EUFM pipeline to process a funding request.
 */
export class EUFMAgentSummoner extends BaseAgent {
  private summonerDataDir: string;

  constructor(id: string, requirementId: string = 'eufm-summoner') {
    super(id, requirementId, eufmFeature);
    this.summonerDataDir = path.join('logs', 'research_data', 'agent_summoner');
    this.ensureDirectories();
  }

  get type() { return 'EUFMAgentSummoner'; }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.summonerDataDir, { recursive: true });
  }

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();

    try {
      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] EUFMAgentSummoner would initiate the 4-stage pipeline.',
          startedAt,
          finishedAt: this.getNow()
        };
      }

      console.log(`🚀 Starting EUFM 4-Stage Pipeline for: ${opts.input}`);
      
      const coordinator = new EUFMPipelineCoordinator('coordinator', 'pipeline');
      const result = await coordinator.run(opts);

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: result.output,
        startedAt,
        finishedAt: this.getNow(),
        metadata: { pipelineResult: result }
      };

    } catch (error: unknown) {
      console.error('❌ EUFM Pipeline failed:', error);
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
