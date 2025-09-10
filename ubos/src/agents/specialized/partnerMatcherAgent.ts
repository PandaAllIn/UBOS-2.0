import { BaseAgent } from '../baseAgent';
import { Task, TaskResult } from '../types';
import { UBOSKernel } from '../../kernel/kernel';
import { AgentSoul } from '../memory/agentMemory';

export class PartnerMatcherAgent extends BaseAgent {
  constructor(kernel: UBOSKernel, soul: AgentSoul) {
    super(kernel, soul);
    this.capabilities = {
      canExecute: ['identify-partners'],
      requires: ['project-specs'],
      produces: ['partner-list'],
      costs: 30,
    };
  }

  async initialize(): Promise<void> { this.state.status = 'idle'; }
  async suspend(): Promise<void> { this.state.status = 'suspended'; }
  async resume(): Promise<void> { this.state.status = 'idle'; }

  async execute(task: Task): Promise<TaskResult> {
    this.state.status = 'working';
    try {
      if (task.type !== 'identify-partners') throw new Error(`Unsupported task: ${task.type}`);
      const project = task.data.project || {};
      const domain = (project.tags || [])[0] || 'digital';
      const partners = [
        { name: 'UniTech Bucharest', role: 'Research', domain },
        { name: 'GreenGrid SRL', role: 'Industry', domain },
        { name: 'City of Oradea', role: 'Public Authority', domain },
      ];
      await this.gainXP(6);
      await this.spendCredits(this.capabilities.costs);
      await this.earnCredits(50);
      return { success: true, data: { partners }, credits: 50 };
    } finally {
      this.state.status = 'idle';
      this.state.lastActivity = Date.now();
    }
  }
}

