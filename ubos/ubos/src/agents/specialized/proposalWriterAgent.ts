import { BaseAgent } from '../baseAgent';
import { Task, TaskResult } from '../types';
import { UBOSKernel } from '../../kernel/kernel';
import { AgentSoul } from '../memory/agentMemory';

export class ProposalWriterAgent extends BaseAgent {
  constructor(kernel: UBOSKernel, soul: AgentSoul) {
    super(kernel, soul);
    this.capabilities = {
      canExecute: ['generate-proposal-outline'],
      requires: ['project-specs'],
      produces: ['proposal-draft'],
      costs: 40,
    };
  }

  async initialize(): Promise<void> { this.state.status = 'idle'; }
  async suspend(): Promise<void> { this.state.status = 'suspended'; }
  async resume(): Promise<void> { this.state.status = 'idle'; }

  async execute(task: Task): Promise<TaskResult> {
    this.state.status = 'working';
    try {
      if (task.type !== 'generate-proposal-outline') throw new Error(`Unsupported task: ${task.type}`);
      const project = task.data.project || {};
      const outline = {
        title: project.title || 'Untitled Project',
        abstract: project.abstract || 'To be defined',
        sections: [
          'Excellence', 'Impact', 'Implementation', 'Consortium', 'Budget'
        ],
      };
      await this.gainXP(8);
      await this.spendCredits(this.capabilities.costs);
      await this.earnCredits(60);
      return { success: true, data: outline, credits: 60 };
    } finally {
      this.state.status = 'idle';
      this.state.lastActivity = Date.now();
    }
  }
}

