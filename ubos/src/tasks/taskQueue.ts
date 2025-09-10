import * as fs from 'fs/promises';
import * as path from 'path';
import { Task } from '../agents/types';
import { AgentFactory } from '../orchestrator/agentFactory';
import { UBOSKernel } from '../kernel/kernel';
import { BusinessDevelopmentAgent } from '../agents/specialized/businessDevelopmentAgent';
import { ProposalWriterAgent } from '../agents/specialized/proposalWriterAgent';
import { PartnerMatcherAgent } from '../agents/specialized/partnerMatcherAgent';

type QueueState = { tasks: Array<Task & { id: string }>; updatedAt: number };

function queuePath(): string { return path.join(process.cwd(), 'memory', 'tasks.json'); }

async function readQueue(): Promise<QueueState> {
  try { const buf = await fs.readFile(queuePath(), 'utf8'); return JSON.parse(buf) as QueueState; }
  catch (err: any) { if (err.code === 'ENOENT') return { tasks: [], updatedAt: Date.now() }; throw err; }
}

async function writeQueue(state: QueueState) { await fs.mkdir(path.dirname(queuePath()), { recursive: true }); state.updatedAt = Date.now(); await fs.writeFile(queuePath(), JSON.stringify(state, null, 2), 'utf8'); }

export async function enqueue(task: Task): Promise<string> {
  const state = await readQueue();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  state.tasks.push({ ...task, id });
  await writeQueue(state);
  return id;
}

export async function list(): Promise<Array<Task & { id: string }>> {
  const state = await readQueue();
  return state.tasks;
}

export async function dequeue(): Promise<(Task & { id: string }) | null> {
  const state = await readQueue();
  const item = state.tasks.shift() || null;
  await writeQueue(state);
  return item;
}

export async function processOne(kernel: UBOSKernel): Promise<{ processed: boolean; task?: any; result?: any }>{
  const item = await dequeue();
  if (!item) return { processed: false };
  const factory = new AgentFactory(kernel);
  factory.registerAgentType('BusinessDevelopment', BusinessDevelopmentAgent as any);
  factory.registerAgentType('ProposalWriter', ProposalWriterAgent as any);
  factory.registerAgentType('PartnerMatcher', PartnerMatcherAgent as any);
  // naive: pick capable agent by type mapping
  let agentId: string | undefined;
  if (item.type === 'generate-proposal-outline') agentId = 'agent:proposal-writer:001';
  if (item.type === 'identify-partners') agentId = 'agent:partner-matcher:001';
  // try to get agent, if not spawn
  let agent = agentId ? await factory.getAgent(agentId) : null;
  if (!agent) {
    const t = item.type === 'generate-proposal-outline' ? 'ProposalWriter' : item.type === 'identify-partners' ? 'PartnerMatcher' : 'BusinessDevelopment';
    const soulId = t === 'ProposalWriter' ? 'agent:proposal-writer:001' : t === 'PartnerMatcher' ? 'agent:partner-matcher:001' : undefined;
    agent = await factory.spawnAgent(t, soulId);
  }
  const res = await agent!.execute(item);
  return { processed: true, task: item, result: res };
}

