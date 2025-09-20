import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { EnhancedPerplexityResearch, ResearchQuery } from '../../tools/enhancedPerplexityResearch.js';

// Context7-guided: Research agent feature definition
const researchFeature: AgentFeature = {
  type: 'research',
  capabilities: ['deep-research', 'analysis', 'perplexity-integration'],
  requirements: { tools: ['perplexity', 'enhanced-research-api'] }
};

export class ResearchAgent extends BaseAgent {
    constructor(id: string, requirementId: string = 'research-stage2') {
        super(id, requirementId, researchFeature);
    }

    get type() { return 'ResearchAgent'; }

    async run(opts: AgentRunOptions): Promise<AgentResult> {
        const startedAt = this.getNow();
        console.log(`ResearchAgent running with input: ${opts.input}`);

        try {
            const researcher = new EnhancedPerplexityResearch();
            const query: ResearchQuery = {
                query: opts.input,
                researchDepth: 'comprehensive',
            };

            const researchResult = await researcher.conductResearch(query);

            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: true,
                output: JSON.stringify(researchResult),
                startedAt,
                finishedAt: this.getNow()
            };
        } catch (error) {
            console.error('ResearchAgent failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: false,
                output: `Failed to conduct research: ${errorMessage}`,
                startedAt,
                finishedAt: this.getNow()
            };
        }
    }
}
