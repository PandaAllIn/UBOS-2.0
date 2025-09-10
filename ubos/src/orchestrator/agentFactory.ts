import { BaseAgent } from '../agents/baseAgent';
import { AgentConfig, AgentFilter, Task } from '../agents/types';
import { UBOSKernel } from '../kernel/kernel';
import { AgentMemoryService } from '../agents/memory/agentMemory';
import * as fs from 'fs/promises';
import * as path from 'path';

type AgentCtor = new (kernel: UBOSKernel, soul: any) => BaseAgent;

type AgentRecord = {
  id: string;
  type: string;
  soulId: string;
  name?: string;
  status: string;
  createdAt: number;
  updatedAt: number;
};

type AgentsState = { agents: AgentRecord[] };

function agentsPath(): string { return path.join(process.cwd(), 'memory', 'agents.json'); }

async function readAgents(): Promise<AgentsState> {
  try { const buf = await fs.readFile(agentsPath(), 'utf8'); return JSON.parse(buf) as AgentsState; }
  catch (err: any) { if (err.code === 'ENOENT') return { agents: [] }; throw err; }
}
async function writeAgents(state: AgentsState) { await fs.mkdir(path.dirname(agentsPath()), { recursive: true }); await fs.writeFile(agentsPath(), JSON.stringify(state, null, 2), 'utf8'); }

export class AgentFactory {
  private registry = new Map<string, AgentCtor>();
  private instances = new Map<string, BaseAgent>();

  constructor(private kernel: UBOSKernel) {}

  registerAgentType(type: string, agentClass: AgentCtor): void {
    this.registry.set(type, agentClass);
  }

  async createAgent(type: string, config: AgentConfig): Promise<BaseAgent> {
    const Ctor = this.registry.get(type);
    if (!Ctor) throw new Error(`Unknown agent type: ${type}`);
    const mem = new AgentMemoryService();
    const soulId = config.soulId || config.id || `${type}-${Date.now()}`;
    const soul = await mem.loadSoul(soulId).catch(() => ({ agentId: soulId, type } as any));
    const agent = new Ctor(this.kernel, soul as any);
    this.instances.set(soulId, agent);
    // persist record
    const state = await readAgents();
    const now = Date.now();
    const existing = state.agents.find((a) => a.id === soulId);
    if (existing) {
      existing.type = type; existing.updatedAt = now; existing.soulId = soulId; existing.name = config.name || existing.name; existing.status = 'idle';
    } else {
      state.agents.push({ id: soulId, type, soulId, name: config.name, status: 'idle', createdAt: now, updatedAt: now });
    }
    await writeAgents(state);
    return agent;
  }

  async spawnAgent(type: string, soulId?: string): Promise<BaseAgent> {
    const agent = await this.createAgent(type, { soulId });
    await agent.initialize();
    // Auto-register as citizen with soul achievements (default behavior)
    try {
      const mem = new AgentMemoryService();
      const soul = await mem.loadSoul((agent as any).state.id);
      await this.kernel.registerCitizenRecord({ id: soul.agentId, balance: soul.achievements?.xp || 0, level: soul.achievements?.level || 1 });
    } catch {
      // ignore if soul not available
    }
    return agent;
  }

  async getAgent(id: string): Promise<BaseAgent | null> {
    if (this.instances.has(id)) return this.instances.get(id)!;
    // Rehydrate from state
    const state = await readAgents();
    const rec = state.agents.find((a) => a.id === id);
    if (!rec) return null;
    const type = rec.type;
    const Ctor = this.registry.get(type);
    if (!Ctor) return null;
    const mem = new AgentMemoryService();
    const soul = await mem.loadSoul(rec.soulId).catch(() => ({ agentId: rec.soulId, type } as any));
    const agent = new Ctor(this.kernel, soul as any);
    this.instances.set(rec.id, agent);
    return agent;
  }

  async listAgents(filter?: AgentFilter): Promise<AgentRecord[]> {
    const state = await readAgents();
    return state.agents.filter((a) => (!filter?.type || a.type === filter.type));
  }

  async suspendAgent(id: string): Promise<void> {
    const a = await this.getAgent(id); await a?.suspend();
  }
  async resumeAgent(id: string): Promise<void> {
    const a = await this.getAgent(id); await a?.resume();
  }
  async destroyAgent(id: string): Promise<void> {
    const state = await readAgents();
    state.agents = state.agents.filter((a) => a.id !== id);
    await writeAgents(state);
    this.instances.delete(id);
  }

  async assignTask(task: Task, agentId?: string): Promise<BaseAgent> {
    let agent: BaseAgent | null = null;
    if (agentId) agent = await this.getAgent(agentId);
    if (!agent) {
      // naive pick: first agent
      const list = await this.listAgents();
      if (!list.length) throw new Error('No agents available');
      agent = await this.getAgent(list[0].id);
    }
    if (!agent) throw new Error('Agent not found');
    await agent.execute(task);
    return agent;
  }

  async findCapableAgent(capability: string): Promise<BaseAgent | null> {
    // naive: iterate instances only
    for (const a of this.instances.values()) {
      const caps = (a as any).capabilities?.canExecute || [];
      if (caps.includes(capability)) return a;
    }
    return null;
  }
}
