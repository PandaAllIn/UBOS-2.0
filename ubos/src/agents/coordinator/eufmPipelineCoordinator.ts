import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { AdaptationAgent } from '../stage1/adaptationAgent.js';
import { ResearchAgent } from '../stage2/researchAgent.js';
import { SpecsWriterAgent } from '../stage3/specsWriterAgent.js';

// Context7-guided: EUFM coordinator feature definition
const eufmCoordinatorFeature: AgentFeature = {
  type: 'eufm-coordinator',
  capabilities: ['pipeline-orchestration', 'multi-stage-execution', 'error-handling'],
  requirements: { stages: ['adaptation', 'research', 'specs', 'builder'] }
};

export class EUFMPipelineCoordinator extends BaseAgent {
    private stage1: AdaptationAgent;
    private stage2: ResearchAgent;
    private stage3: SpecsWriterAgent;

    constructor(id: string, requirementId: string) {
        super(id, requirementId, eufmCoordinatorFeature);
        // TODO: Fix stage agent constructors when those agents are updated
        this.stage1 = new AdaptationAgent('stage1');
        this.stage2 = new ResearchAgent('stage2');
        this.stage3 = new SpecsWriterAgent('stage3');
    }

    get type() { return 'EUFMPipelineCoordinator'; }

    async run(opts: AgentRunOptions): Promise<AgentResult> {
        const startedAt = this.getNow();
        console.log(`EUFMPipelineCoordinator running with input: ${opts.input}`);
        
        try {
            // Stage 1: Business Context Analysis
            const stage1Result = await this.stage1.run({ input: opts.input, userId: opts.userId });
            if (!stage1Result.success) {
                throw new Error(`Stage 1 (Adaptation) failed: ${stage1Result.error}`);
            }

            // Stage 2: Deep Research
            const stage2Result = await this.stage2.run({ input: stage1Result.output, userId: opts.userId });
            if (!stage2Result.success) {
                throw new Error(`Stage 2 (Research) failed: ${stage2Result.error}`);
            }

            // Stage 3: Specification Generation
            const stage3Result = await this.stage3.run({ input: stage2Result.output, userId: opts.userId });
            if (!stage3Result.success) {
                throw new Error(`Stage 3 (SpecsWriter) failed: ${stage3Result.error}`);
            }

            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: true,
                output: stage3Result.output,
                startedAt,
                finishedAt: this.getNow()
            };
        } catch (error) {
            console.error('EUFMPipelineCoordinator failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: false,
                output: `Pipeline failed: ${errorMessage}`,
                startedAt,
                finishedAt: this.getNow()
            };
        }
    }
}
