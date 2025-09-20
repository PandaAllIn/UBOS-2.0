import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { geminiComplete } from '../../adapters/google_gemini.js';
import { SpecKitProject, SpecKitTask } from '../premium/specKitCodexAgent.js';

const agentFeature: AgentFeature = {
    type: 'specs-writer',
    capabilities: ['generation', 'planning', 'creation'],
    requirements: { models: ['gemini-ai'] }
};

export class SpecsWriterAgent extends BaseAgent {
    constructor(id: string, reqId: string = 'specs-writer-stage3') {
        super(id, reqId, agentFeature);
    }

    get type() { return 'SpecsWriterAgent'; }

    async run(opts: AgentRunOptions): Promise<AgentResult> {
        const startedAt = this.getNow();
        console.log(`SpecsWriterAgent running with input: ${opts.input}`);

        try {
            const researchResult = JSON.parse(opts.input);

            const prompt = `
                Based on the following research results, generate a structured SpecKitProject JSON object.
                The project should include a name, description, and a list of tasks with high-level details.

                Research Results: ${JSON.stringify(researchResult, null, 2)}

                Please provide a JSON object with the following structure:
                {
                    "name": "Project Name",
                    "description": "Project Description",
                    "tasks": [
                        {
                            "id": "task_1",
                            "title": "Task Title",
                            "description": "Task Description",
                            "priority": "medium",
                            "estimatedHours": 4,
                            "dependencies": [],
                            "status": "pending",
                            "assignedAgent": "codex"
                        }
                    ],
                    "specPath": "/specs/project_spec.md",
                    "planPath": "/plan/project_plan.md"
                }
            `;

            const geminiOutput = await geminiComplete(prompt, 'gemini-2.5-pro');
            const projectSpecification: SpecKitProject = JSON.parse(geminiOutput);

            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: true,
                output: JSON.stringify(projectSpecification),
                startedAt,
                finishedAt: this.getNow()
            };
        } catch (error) {
            console.error('SpecsWriterAgent failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                agentId: this.id,
                requirementId: this.requirementId,
                success: false,
                output: `Failed to generate project specification: ${errorMessage}`,
                startedAt,
                finishedAt: this.getNow()
            };
        }
    }
}