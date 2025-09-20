import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { geminiComplete } from '../../adapters/google_gemini.js';

// Context7-guided: Adaptation agent feature definition
const adaptationFeature: AgentFeature = {
  type: 'adaptation',
  capabilities: ['business-analysis', 'requirement-parsing', 'json-generation', 'gemini-integration'],
  requirements: { models: ['gemini-ai'] }
};

export class AdaptationAgent extends BaseAgent {
    constructor(id: string, requirementId: string = 'adaptation-stage1') {
        super(id, requirementId, adaptationFeature);
    }

    get type() { return 'AdaptationAgent'; }

    async run(opts: AgentRunOptions): Promise<AgentResult> {
        const startedAt = this.getNow();
        console.log(`AdaptationAgent running with input: ${opts.input}`);

        const prompt = `
            Analyze the following business requirements and context to generate a structured JSON object.
            The JSON object should identify key business aspects based on the input.
            Input: "${opts.input}"

            Please provide a JSON object with the following structure:
            {
                "industry": "The industry the business operates in.",
                "regulations": ["List of relevant regulations."],
                "stakeholders": ["List of key stakeholders."],
                "constraints": ["List of constraints (e.g., budget, timeline)."],
                "opportunities": ["List of potential opportunities."],
                "riskFactors": ["List of potential risk factors."]
            }
        `;

        try {
            const geminiOutput = await geminiComplete(prompt, 'gemini-2.5-pro');
            
            // Attempt to parse the JSON output from Gemini
            const businessContext = JSON.parse(geminiOutput);

            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: true,
                output: JSON.stringify(businessContext),
                startedAt,
                finishedAt: this.getNow()
            };
        } catch (error) {
            console.error('AdaptationAgent failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: false,
                output: `Failed to analyze business context: ${errorMessage}`,
                startedAt,
                finishedAt: this.getNow()
            };
        }
    }
}
