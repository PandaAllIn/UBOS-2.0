import { UBOSKernel } from '../kernel/kernel';
import { AgentCapabilities, AgentState, Task, TaskResult } from './types';
import { AgentMemoryService, AgentSoul } from './memory/agentMemory';
import { UBOSCredits } from '../treasury/credits';

export abstract class BaseAgent {
  protected state: AgentState;
  protected capabilities: AgentCapabilities;
  protected memory: AgentMemoryService;

  constructor(protected kernel: UBOSKernel, soul: AgentSoul) {
    this.memory = new AgentMemoryService();
    this.state = {
      id: soul.agentId,
      type: (soul as any).type || 'AGENT',
      soul,
      status: 'idle',
      memory: {},
      credits: 0,
      xp: soul.achievements?.xp || 0,
      level: soul.achievements?.level || 1,
      lastActivity: Date.now(),
    };
    this.capabilities = { canExecute: [], requires: [], produces: [], costs: 0 };
  }

  // Lifecycle hooks
  abstract initialize(): Promise<void>;
  abstract execute(task: Task): Promise<TaskResult>;
  abstract suspend(): Promise<void>;
  abstract resume(): Promise<void>;

  // Common methods
  async earnCredits(amount: number): Promise<void> {
    this.state.credits += amount;
    const citizen = await this.kernel.getCitizenRecord(this.state.id);
    if (citizen) {
      const credits = new UBOSCredits(this.state.id, { balance: citizen.balance, transactions: citizen.transactions });
      await credits.earn(amount, 'agent-task');
      citizen.balance = credits.getBalance();
      citizen.transactions = credits.getTransactions();
      const { saveCitizen } = await import('../memory/repo');
      await saveCitizen(citizen);
    }
  }

  async spendCredits(amount: number): Promise<boolean> {
    if (this.state.credits >= amount) {
      this.state.credits -= amount;
      return true;
    }
    const citizen = await this.kernel.getCitizenRecord(this.state.id);
    if (citizen) {
      const credits = new UBOSCredits(this.state.id, { balance: citizen.balance, transactions: citizen.transactions });
      const ok = await credits.spend(amount, 'agent-task');
      if (ok) {
        citizen.balance = credits.getBalance();
        citizen.transactions = credits.getTransactions();
        const { saveCitizen } = await import('../memory/repo');
        await saveCitizen(citizen);
      }
      return ok;
    }
    return false;
  }

  async gainXP(amount: number): Promise<void> {
    this.state.xp += amount;
    this.state.lastActivity = Date.now();
    const soul = await this.memory.loadSoul(this.state.id);
    soul.achievements.xp += amount;
    await this.memory.saveSoul(soul);
    await this.checkLevel();
  }

  async checkLevel(): Promise<number> {
    const prev = this.state.level;
    const thresholds = [0, 1000, 3000, 7000, 15000, 30000];
    const newLevel = thresholds.filter((t) => this.state.xp >= t).length;
    this.state.level = newLevel;
    if (newLevel > prev) {
      // could unlock capabilities
    }
    return this.state.level;
  }

  async remember(key: string, value: any): Promise<void> {
    const soul = await this.memory.loadSoul(this.state.id);
    soul.memory.longTerm = {
      ...(soul.memory.longTerm || {}),
      agentMemory: { ...((soul.memory.longTerm as any)?.agentMemory || {}), [key]: value },
    } as any;
    await this.memory.saveSoul(soul);
  }

  async recall(key: string): Promise<any> {
    const soul = await this.memory.loadSoul(this.state.id);
    return (soul.memory.longTerm as any)?.agentMemory?.[key];
  }

  // Collaboration stubs
  async requestHelp(fromAgent: string, task: Task): Promise<any> {
    return { requestedFrom: fromAgent, task };
  }

  async delegateTask(toAgent: string, task: Task): Promise<any> {
    return { delegatedTo: toAgent, task };
  }
}

