import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { claudeInterface } from './claudeAgentInterface.js';
import { codexCLI } from './codexCLI.js';
import { repoRoot } from '../utils/paths.js';

const execAsync = promisify(exec);
const ROOT = repoRoot();

function has(val?: string) {
  return Boolean(val && String(val).trim().length > 0);
}

async function commandExists(cmd: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`command -v ${cmd}`);
    return stdout.trim().length > 0;
  } catch {
    try {
      const { stdout } = await execAsync(`which ${cmd}`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
}

async function readJsonSafe<T = any>(p: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(p, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function listAgents(): Promise<string[]> {
  try {
    const files = await fs.readdir(path.join(ROOT, 'src/agents'));
    return files.filter(f => f.endsWith('.ts')).sort();
  } catch {
    return [];
  }
}

export interface Gpt5Status {
  ok: boolean;
  collaborationHealthy: boolean;
  gpt5: {
    openaiKey: boolean;
    esm: boolean;
    tsStrict: boolean;
  };
  claude: {
    claudeCLI: boolean;
    codexAvailable: boolean;
    agentsReady: string[];
    sessionId: string;
    tasksCompleted: number;
    totalCost: number;
    recentTasks: number;
  };
  env: {
    openai: boolean;
    anthropic: boolean;
    gemini: boolean;
    perplexity: boolean;
  };
  agents: string[];
}

export async function getGpt5Status(): Promise<Gpt5Status> {
  const [claudeCLI, codexStatus, clStatus, pkg, tsconfig, agents] = await Promise.all([
    commandExists('claude'),
    codexCLI.getStatus(),
    claudeInterface.getSystemStatus(),
    readJsonSafe<{ type?: string }>(path.join(ROOT, 'package.json')),
    readJsonSafe<{ compilerOptions?: { strict?: boolean; module?: string } }>(path.join(ROOT, 'tsconfig.json')),
    listAgents()
  ]);

  const env = {
    openai: has(process.env.OPENAI_API_KEY),
    anthropic: has(process.env.ANTHROPIC_API_KEY),
    gemini: has(process.env.GEMINI_API_KEY),
    perplexity: has(process.env.PERPLEXITY_API_KEY)
  };

  const gpt5 = {
    openaiKey: env.openai,
    esm: (pkg?.type === 'module'),
    tsStrict: Boolean(tsconfig?.compilerOptions?.strict)
  };

  const claude = {
    claudeCLI,
    codexAvailable: codexStatus.available,
    agentsReady: clStatus.agentsReady,
    sessionId: clStatus.session.sessionId,
    tasksCompleted: clStatus.session.tasksCompleted,
    totalCost: clStatus.session.totalCost,
    recentTasks: codexStatus.recentTasks
  };

  const collaborationHealthy =
    gpt5.openaiKey &&
    (env.anthropic || claudeCLI) &&
    claude.codexAvailable;

  return {
    ok: true,
    collaborationHealthy,
    gpt5,
    claude,
    env,
    agents
  };
}

function flag(ok: boolean) {
  return ok ? '✅' : '❌';
}

export async function printGpt5Status(): Promise<void> {
  const s = await getGpt5Status();
  console.log('=== GPT-5 + Claude Collaboration Status ===');
  console.log(`Claude CLI available: ${flag(s.claude.claudeCLI)}`);
  console.log(`Codex CLI available: ${flag(s.claude.codexAvailable)} (recent tasks: ${s.claude.recentTasks})`);
  console.log(`OpenAI key: ${flag(s.env.openai)} | Anthropic: ${flag(s.env.anthropic)} | Gemini: ${flag(s.env.gemini)} | Perplexity: ${flag(s.env.perplexity)}`);
  console.log(`ESM mode: ${flag(s.gpt5.esm)} | TS strict: ${flag(s.gpt5.tsStrict)}`);
  console.log(`Agents (${s.agents.length}): ${s.agents.slice(0, 12).join(', ')}${s.agents.length > 12 ? `, ...+${s.agents.length - 12} more` : ''}`);
  console.log(`Claude session: ${s.claude.sessionId} | tasks: ${s.claude.tasksCompleted} | cost: $${s.claude.totalCost.toFixed(4)}`);
  console.log(`Collaboration Health: ${s.collaborationHealthy ? 'HEALTHY ✅' : 'ISSUES DETECTED ⚠️'}`);
  if (!s.collaborationHealthy) {
    console.log('Hints: Need OpenAI key for GPT-5, Anthropic key or Claude CLI present, and Codex CLI available.');
  }
}

