import { BaseAgent } from '../baseAgent';
import { Task, TaskResult } from '../types';
import { UBOSKernel } from '../../kernel/kernel';
import { AgentSoul } from '../memory/agentMemory';

export class BusinessDevelopmentAgent extends BaseAgent {
  constructor(kernel: UBOSKernel, soul: AgentSoul) {
    super(kernel, soul);
    this.capabilities = {
      canExecute: [
        'analyze-funding-call',
        'match-project-to-funding',
        'generate-proposal-outline',
        'calculate-roi',
        'identify-partners',
      ],
      requires: ['funding-database', 'project-specs'],
      produces: ['proposal-draft', 'partner-list', 'roi-report'],
      costs: 50,
    };
  }

  async initialize(): Promise<void> {
    await this.remember('funding-programs', {
      'horizon-europe': { budget: '95.5B', focus: ['digital', 'green', 'health'] },
      'digital-europe': { budget: '7.5B', focus: ['AI', 'cybersecurity', 'digital-skills'] },
      'connecting-europe': { budget: '33.7B', focus: ['transport', 'energy', 'digital'] },
    });
    this.state.status = 'idle';
  }

  async execute(task: Task): Promise<TaskResult> {
    this.state.status = 'working';
    let result: TaskResult;
    try {
      switch (task.type) {
        case 'analyze-funding-call':
          result = await this.analyzeFundingCall(task);
          break;
        case 'match-project-to-funding':
          result = await this.matchProjectToFunding(task);
          break;
        case 'generate-proposal-outline':
          result = await this.generateProposalOutline(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      await this.gainXP(10);
      await this.spendCredits(this.capabilities.costs);
      await this.earnCredits(result.credits || 0);
      return result;
    } finally {
      this.state.status = 'idle';
      this.state.lastActivity = Date.now();
    }
  }

  async suspend(): Promise<void> { this.state.status = 'suspended'; }
  async resume(): Promise<void> { this.state.status = 'idle'; }

  private async analyzeFundingCall(task: Task): Promise<TaskResult> {
    const call = task.data.fundingCall || {};
    const analysis = {
      program: call.program,
      deadline: call.deadline,
      budget: call.budget,
      requirements: (call.requirements || []).slice(0, 5),
      scoringCriteria: ['excellence', 'impact', 'implementation'],
      competitionLevel: 'medium',
      successProbability: 0.65,
    };
    return { success: true, data: analysis, credits: 75 };
  }

  private async matchProjectToFunding(task: Task): Promise<TaskResult> {
    const project = task.data.project || {};
    const programs = (await this.recall('funding-programs')) || {};
    const matches: Array<{ program: string; score: number; rationale: string; nextSteps: string[] }> = [];
    for (const [program, details] of Object.entries<Record<string, unknown>>(programs)) {
      const focus = (details as { focus?: string[] }).focus || [];
      const tags = project.tags || [];
      const overlap = focus.filter((f: string) => tags.includes(f)).length;
      const score = Math.min(1, 0.3 + overlap * 0.2);
      if (score > 0.5) {
        matches.push({
          program,
          score,
          rationale: `Overlap on ${overlap} focus areas`,
          nextSteps: ['Validate eligibility', 'Draft outline', 'Identify partners'],
        });
      }
    }
    return { success: true, data: { matches, recommendedProgram: matches[0]?.program }, credits: 80 };
  }

  private async generateProposalOutline(task: Task): Promise<TaskResult> {
    const project = task.data.project || {};
    const outline = {
      title: project.title || 'Untitled Project',
      sections: [
        'Excellence: objectives, methodology, innovation',
        'Impact: outcomes, exploitation, dissemination',
        'Implementation: workplan, risks, resources',
        'Consortium: partners, roles, management',
        'Budget: costs, justification, funding request',
      ],
    };
    return { success: true, data: outline, credits: 60 };
  }
}
