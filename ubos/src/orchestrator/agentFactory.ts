import { BaseAgent as KernelAgent } from '../agents/baseAgent';
import { AgentConfig, AgentFilter, Task } from '../agents/types';
import { UBOSKernel } from '../kernel/kernel';
import { AgentMemoryService } from '../agents/memory/agentMemory';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { AgentSpec } from './types.js';
import type { BaseAgent as SpecAgent } from '../agents/premium/baseAgent.js';
import { SmokeTestAgent } from '../agents/community/smokeTestAgent.js';
import { MemoryAgent } from '../agents/community/memoryAgent.js';
import { CodexAgent as CommunityCodexAgent } from '../agents/community/codexAgent.js';
import { BrowserAgent } from '../agents/community/browserAgent.js';
import { AbacusAgent } from '../agents/community/abacusAgent.js';
import { CodeReviewAgent } from '../agents/community/codeReviewAgent.js';
import { TestAgent } from '../agents/community/testAgent.js';
import { CodexCLIAgent } from '../agents/premium/codexCLIAgent.js';
import { EnhancedAbacusAgent } from '../agents/premium/enhancedAbacusAgent.js';
import { AgentSummonerAgent } from '../agents/premium/agentSummonerAgent.js';
import { AgentSummoner } from '../agents/premium/agentSummoner.js';
import { EUFMAgentSummoner } from '../agents/premium/eufmAgentSummoner.js';
import { EUFundingProposalAgent } from '../agents/premium/euFundingProposalAgent.js';
import { FigmaMCPAgent } from '../agents/premium/figmaMCPAgent.js';
import { SpecKitCodexAgent } from '../agents/premium/specKitCodexAgent.js';
import { ToolDocumentationAgent } from '../agents/premium/toolDocumentationAgent.js';
import { UBOSDesignSpecAgent } from '../agents/premium/ubosDesignSpecAgent.js';
import { CoordinationAgent } from '../agents/premium/coordinationAgent.js';

type AgentCtor = new (kernel: UBOSKernel, soul: any) => KernelAgent;
type SpecAgentFactory = (spec: AgentSpec) => SpecAgent;

const DEFAULT_SPEC_FACTORIES = new Map<AgentSpec['type'], SpecAgentFactory>([
  ['SmokeTestAgent', (spec) => new SmokeTestAgent(spec.id, spec.requirementId)],
  ['MemoryAgent', (spec) => new MemoryAgent(spec.id, spec.requirementId)],
  ['CodexAgent', (spec) => new CommunityCodexAgent(spec.id, spec.requirementId)],
  ['BrowserAgent', (spec) => new BrowserAgent(spec.id, spec.requirementId)],
  ['AbacusAgent', (spec) => new AbacusAgent(spec.id, spec.requirementId)],
  ['CodeReviewAgent', (spec) => new CodeReviewAgent(spec.id, spec.requirementId)],
  ['TestAgent', (spec) => new TestAgent(spec.id, spec.requirementId)],
  ['CodexCLIAgent', (spec) => new CodexCLIAgent(spec.id, spec.requirementId)],
  ['EnhancedAbacusAgent', (spec) => new EnhancedAbacusAgent(spec.id, spec.requirementId)],
  ['AgentSummonerAgent', (spec) => new AgentSummonerAgent(spec.id, spec.requirementId)],
  ['AgentSummoner', (spec) => new AgentSummoner(spec.id, spec.requirementId)],
  ['EUFMAgentSummoner', (spec) => new EUFMAgentSummoner(spec.id, spec.requirementId)],
  ['EUFundingProposalAgent', (spec) => new EUFundingProposalAgent(spec.id, spec.requirementId)],
  ['figma-mcp', (spec) => new FigmaMCPAgent(spec.id, spec.requirementId)],
  ['spec-kit-codex', (spec) => new SpecKitCodexAgent(spec.id, spec.requirementId)],
  ['tool-docs', (spec) => new ToolDocumentationAgent(spec.id, spec.requirementId)],
  ['enhanced-tool-docs', (spec) => new ToolDocumentationAgent(spec.id, spec.requirementId)],
  ['UBOSDesignSpecAgent', (spec) => new UBOSDesignSpecAgent(spec.id, spec.requirementId)],
  ['CoordinationAgent', (spec) => new CoordinationAgent(spec.id, spec.requirementId)],
]);

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
  private instances = new Map<string, KernelAgent>();
  private readonly specFactories = new Map(DEFAULT_SPEC_FACTORIES);

  constructor(private kernel: UBOSKernel = new UBOSKernel()) {}

  registerAgentType(type: string, agentClass: AgentCtor): void {
    this.registry.set(type, agentClass);
  }

  registerSpecAgent(type: AgentSpec['type'], factory: SpecAgentFactory): void {
    this.specFactories.set(type, factory);
  }

  create(spec: AgentSpec): SpecAgent {
    const factory = this.specFactories.get(spec.type);
    if (!factory) {
      throw new Error(`Unknown agent spec type: ${spec.type}`);
    }
    const normalizedSpec: AgentSpec = {
      ...spec,
      requirementId: spec.requirementId || spec.id,
    };
    const agent = factory(normalizedSpec);
    if (spec.params && typeof spec.params === 'object') {
      Object.assign(agent as object, spec.params);
    }
    return agent;
  }

  async createAgent(type: string, config: AgentConfig): Promise<KernelAgent> {
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

  async spawnAgent(type: string, soulId?: string): Promise<KernelAgent> {
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

  async getAgent(id: string): Promise<KernelAgent | null> {
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

  async assignTask(task: Task, agentId?: string): Promise<KernelAgent> {
    let agent: KernelAgent | null = null;
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

  async findCapableAgent(capability: string): Promise<KernelAgent | null> {
    // naive: iterate instances only
    for (const a of this.instances.values()) {
      const caps = (a as any).capabilities?.canExecute || [];
      if (caps.includes(capability)) return a;
    }
    return null;
  }
}
