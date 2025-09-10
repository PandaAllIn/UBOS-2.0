import * as fs from 'fs/promises';
import * as path from 'path';
import { getCitizen } from '../memory/repo';

export type Choice = 'approve' | 'reject' | 'abstain';

export interface VoteRecord {
  citizenId: string;
  choice: Choice;
  weight: number;
  balanceAtVote: number;
  levelAtVote: number;
  timestamp: number;
}

export interface ProposalRecord {
  id: string;
  title: string;
  description?: string;
  proposer?: string;
  status: 'open' | 'approved' | 'rejected';
  createdAt: number;
  votes: VoteRecord[];
}

interface GovernanceState { proposals: ProposalRecord[]; updatedAt: number }

function govPath(): string { return path.join(process.cwd(), 'memory', 'governance.json'); }

async function readGov(): Promise<GovernanceState> {
  try { const buf = await fs.readFile(govPath(), 'utf8'); return JSON.parse(buf) as GovernanceState; }
  catch (err: any) { if (err.code === 'ENOENT') return { proposals: [], updatedAt: Date.now() }; throw err; }
}

async function writeGov(state: GovernanceState) { await fs.mkdir(path.dirname(govPath()), { recursive: true }); state.updatedAt = Date.now(); await fs.writeFile(govPath(), JSON.stringify(state, null, 2), 'utf8'); }

function nextId(state: GovernanceState): string {
  const n = state.proposals.length + 1;
  return `proposal-${String(n).padStart(3, '0')}`;
}

export async function submitProposal(title: string, description?: string, proposer?: string): Promise<ProposalRecord> {
  const state = await readGov();
  const rec: ProposalRecord = { id: nextId(state), title, description, proposer, status: 'open', createdAt: Date.now(), votes: [] };
  state.proposals.push(rec);
  await writeGov(state);
  return rec;
}

export async function listProposals(): Promise<ProposalRecord[]> { return (await readGov()).proposals; }

export async function getProposal(id: string): Promise<ProposalRecord | null> { return (await readGov()).proposals.find(p => p.id === id) || null; }

export async function castVote(proposalId: string, citizenId: string, choice: Choice): Promise<VoteRecord> {
  const state = await readGov();
  const p = state.proposals.find((x) => x.id === proposalId);
  if (!p) throw new Error('Proposal not found');
  if (p.status !== 'open') throw new Error('Proposal closed');
  const citizen = await getCitizen(citizenId);
  if (!citizen) throw new Error('Citizen not found');
  const weight = citizen.balance + citizen.level * 100;
  const vote: VoteRecord = { citizenId, choice, weight, balanceAtVote: citizen.balance, levelAtVote: citizen.level, timestamp: Date.now() };
  // Replace prior vote if exists
  p.votes = p.votes.filter((v) => v.citizenId !== citizenId);
  p.votes.push(vote);
  await writeGov(state);
  return vote;
}

function classify(id: string): 'human' | 'ai' | 'unknown' {
  if (id.startsWith('citizen:human:')) return 'human';
  if (id.startsWith('citizen:ai:') || id.startsWith('agent:')) return 'ai';
  return 'unknown';
}

async function isFounder(id: string): Promise<boolean> {
  try {
    const p = path.join(process.cwd(), 'memory', 'state.json');
    const buf = await fs.readFile(p, 'utf8');
    const data = JSON.parse(buf) as { founders?: string[] };
    return !!data.founders?.includes(id);
  } catch {
    return false;
  }
}

export async function tally(proposalId: string): Promise<{ approve: number; reject: number; abstain: number; outcome: 'approved' | 'rejected' | 'no-quorum' }>{
  const state = await readGov();
  const p = state.proposals.find((x) => x.id === proposalId);
  if (!p) throw new Error('Proposal not found');
  const sums = p.votes.reduce((acc, v) => { acc[v.choice] += v.weight; return acc; }, { approve: 0, reject: 0, abstain: 0 } as any);
  // Quorum checks (v1)
  const distinctVoters = new Set(p.votes.map((v) => v.citizenId));
  let hasHuman = false, hasAI = false, founderApproved = false;
  for (const v of p.votes) {
    const kind = classify(v.citizenId);
    if (kind === 'human') hasHuman = true;
    if (kind === 'ai') hasAI = true;
    if (v.choice === 'approve' && await isFounder(v.citizenId)) founderApproved = true;
  }
  const isEmergency = /emergency/i.test(p.title) || /emergency/i.test(p.description || '');
  const quorumMet = (distinctVoters.size >= 3 && hasHuman && hasAI) || (isEmergency && founderApproved);
  let outcome: 'approved' | 'rejected' | 'no-quorum' = 'no-quorum';
  if (quorumMet) {
    outcome = sums.approve > sums.reject ? 'approved' : sums.reject > sums.approve ? 'rejected' : 'no-quorum';
  }
  if (outcome !== 'no-quorum') p.status = outcome;
  await writeGov(state);
  return { approve: sums.approve, reject: sums.reject, abstain: sums.abstain, outcome };
}
