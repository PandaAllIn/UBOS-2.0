#!/usr/bin/env ts-node
import { z } from 'zod';
import { UBOSKernel } from '../kernel/kernel';
import { upsertCitizen, getCitizen, saveCitizen } from '../memory/repo';
import { UBOSCredits } from '../treasury/credits';
import * as path from 'path';
import { SpecInterpreter } from '../kernel/spec-interpreter';
import { AgentMemoryService } from '../agents/memory/agentMemory';

type CmdHandler = (argv: string[]) => Promise<void>;

const idSchema = z.string().min(1);
const amountSchema = z.coerce.number().positive();

function usage() {
  console.log(`
UBOS CLI

Usage:
  npm run cli -- citizen register <id>
  npm run cli -- citizen info <id>
  npm run cli -- credits earn <id> <amount> <source>
  npm run cli -- credits spend <id> <amount> <purpose>
  npm run cli -- services list
  npm run cli -- services request <id> <serviceId> [--params '{"key":"value"}']
  npm run cli -- spec parse <relative-or-absolute-path>
  npm run cli -- agent soul show <agentId>
  npm run cli -- agent register <agentId>
  npm run cli -- agent spawn <type> [--soul <soulIdOrPath>]
  npm run cli -- agent list
  npm run cli -- agent status <agentId>
  npm run cli -- agent task assign <agentId> <taskType> [--data '{"key":"value"}']
  npm run cli -- queue enqueue <taskType> [--data '{"key":"value"}']
  npm run cli -- queue process
  npm run cli -- agent session start <agentId>
  npm run cli -- agent session end <sessionId> [--xp <n>] [--title <t>]
  npm run cli -- founders register
  npm run cli -- founders list
  npm run cli -- founders ceremony
  npm run cli -- genesis status
  npm run cli -- agent attest <agentId>
  npm run cli -- agent memory add <agentId> --text "..."
  npm run cli -- agent memory search <agentId> --query "..." [--k 5]
  npm run cli -- agent memory prune <ttlMs>
  npm run cli -- proposal submit "<title>" [--desc "text"] [--proposer <id>]
  npm run cli -- governance proposals
  npm run cli -- vote cast <citizenId> <proposalId> approve|reject|abstain
  npm run cli -- governance tally <proposalId>
  npm run cli -- specs reload
  npm run cli -- specs watch
  npm run cli -- citizen reward <id> [--xp n] [--credits n] [--title "text"] [--level n]
`);
}

async function ensureBoot(): Promise<UBOSKernel> {
  const kernel = new UBOSKernel();
  try {
    await kernel.boot();
    return kernel;
  } catch (err) {
    console.error('❌ Kernel boot failed:', err);
    process.exit(1);
  }
}

const handlers: Record<string, CmdHandler> = {
  async 'citizen:register'(argv) {
    const id = idSchema.parse(argv[0]);
    await ensureBoot();
    const rec = await upsertCitizen(id);
    console.log(`
🪪 Welcome, Citizen ${rec.id}.
🌱 The Infinite Game recognizes your intention.
💰 Starting credits: ${rec.balance}
`);
  },

  async 'citizen:info'(argv) {
    const id = idSchema.parse(argv[0]);
    await ensureBoot();
    const rec = await getCitizen(id);
    if (!rec) {
      console.log(`Citizen ${id} not found. Try: citizen register ${id}`);
      return;
    }
    console.log(JSON.stringify({ id: rec.id, balance: rec.balance, level: rec.level, transactions: rec.transactions.length }, null, 2));
  },
  async 'citizen:show'(argv) {
    return handlers['citizen:info'](argv);
  },

  async 'credits:earn'(argv) {
    const [idStr, amountStr, ...sourceParts] = argv;
    const id = idSchema.parse(idStr);
    const amount = amountSchema.parse(amountStr);
    const source = sourceParts.join(' ') || 'unspecified';
    await ensureBoot();
    const rec = (await getCitizen(id)) || (await upsertCitizen(id));
    const credits = new UBOSCredits(rec.id, { balance: rec.balance, transactions: rec.transactions });
    await credits.earn(amount, source);
    rec.balance = credits.getBalance();
    rec.transactions = credits.getTransactions();
    await saveCitizen(rec);
    console.log(`✅ Balance: ${rec.balance}`);
  },

  async 'credits:spend'(argv) {
    const [idStr, amountStr, ...purposeParts] = argv;
    const id = idSchema.parse(idStr);
    const amount = amountSchema.parse(amountStr);
    const purpose = purposeParts.join(' ') || 'unspecified';
    await ensureBoot();
    const rec = await getCitizen(id);
    if (!rec) {
      console.log(`Citizen ${id} not found. Try: citizen register ${id}`);
      return;
    }
    const credits = new UBOSCredits(rec.id, { balance: rec.balance, transactions: rec.transactions });
    const ok = await credits.spend(amount, purpose);
    if (!ok) {
      console.log('❌ Insufficient credits');
      return;
    }
    rec.balance = credits.getBalance();
    rec.transactions = credits.getTransactions();
    await saveCitizen(rec);
    console.log(`✅ Balance: ${rec.balance}`);
  },

  async 'services:list'() {
    const kernel = await ensureBoot();
    const keys = kernel.getTerritoryKeys();
    if (!keys.length) return console.log('No territories available.');
    for (const key of keys) {
      const t = kernel.getTerritory(key) as any;
      const list = t?.listServices?.() || [];
      console.log(`
== ${key.toUpperCase()} SERVICES ==`);
      for (const s of list) console.log(`- ${s.name || s.id}: ${s.price} credits`);
    }
  },

  async 'services:request'(argv) {
    const [idStr, serviceId, ...rest] = argv;
    const id = idSchema.parse(idStr);
    const kernel = await ensureBoot();
    const rec = await getCitizen(id);
    if (!rec) {
      console.log(`Citizen ${id} not found. Try: citizen register ${id}`);
      return;
    }
    // Parse optional --params JSON
    let params: Record<string, unknown> = {};
    const idx = rest.indexOf('--params');
    if (idx >= 0 && rest[idx + 1]) {
      try { params = JSON.parse(rest[idx + 1]); } catch { /* ignore */ }
    }
    // Pick first available territory that hosts the service (start with EUFM)
    const territoryKeys = ['eufm', 'portal', 'research', 'enterprise'];
    let territory: { getService?: (id: string) => { price: number }, requestService: (id: string, params: Record<string, unknown>, balance: number) => Promise<void> } | undefined = undefined;
    let svc: { price: number } | undefined = undefined;
    for (const key of territoryKeys) {
      const t = kernel.getTerritory(key) as any;
      if (!t) continue;
      const s = t.getService?.(serviceId);
      if (s) { territory = t; svc = s; break; }
    }
    if (!territory || !svc) {
      console.log(`Service not found: ${serviceId}`);
      return;
    }
    if (!svc) {
      console.log(`Service not found: ${serviceId}`);
      return;
    }
    // Check and spend credits up-front (authoritative);
    if (rec.balance < svc.price) {
      console.log(`❌ Need ${svc.price} credits, have ${rec.balance}`);
      return;
    }
    const credits = new UBOSCredits(rec.id, { balance: rec.balance, transactions: rec.transactions });
    const spent = await credits.spend(svc.price, `service:${serviceId}`);
    if (!spent) {
      console.log('❌ Unable to spend credits');
      return;
    }
    await territory.requestService(serviceId, params, credits.getBalance());
    rec.balance = credits.getBalance();
    rec.transactions = credits.getTransactions();
    await saveCitizen(rec);
    console.log(`✅ Service executed. New balance: ${rec.balance}`);
  },

  async 'spec:parse'(argv) {
    const rel = argv[0];
    if (!rel) {
      console.log('Usage: spec parse <relative-or-absolute-path>');
      return;
    }
    await ensureBoot();
    const p = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    const interpreter = new SpecInterpreter();
    const parsed = await interpreter.parseSpec(p);
    console.log(JSON.stringify({ metadata: parsed.metadata, stories: parsed.userStories.map(s => s.title), dependencies: parsed.dependencies }, null, 2));
  },
  async 'agent:soul'(argv) {
    const [sub, id] = argv;
    if (sub !== 'show') return usage();
    const agentId = idSchema.parse(id);
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const svc = new AgentMemoryService();
    const soul = await svc.loadSoul(agentId);
    console.log(JSON.stringify({ agentId: soul.agentId, xp: soul.achievements.xp, level: soul.achievements.level, titles: soul.achievements.titles }, null, 2));
  },
  async 'agent:register'(argv) {
    const agentId = idSchema.parse(argv[0]);
    await ensureBoot();
    const { AgentRegistrar } = await import('../agents/registration');
    const svc = new AgentMemoryService();
    const soul = await svc.loadSoul(agentId);
    const kernel = new UBOSKernel();
    await kernel.boot();
    const registrar = new AgentRegistrar(kernel);
    const res = await registrar.registerAgent(soul);
    soul.credentials.registrationTx = res.registrationTx;
    await svc.saveSoul(soul);
    console.log(`🤝 Agent registered as citizen ${res.id}. Balance: ${res.balance}, Level: ${res.level}`);
  }
};

function route(argv: string[]) {
  const [domain, action, ...rest] = argv;
  if (!domain) return usage();
  const key = action ? `${domain}:${action}` : domain;
  const handler = handlers[key];
  if (!handler) return usage();
  handler(rest).catch((err) => {
    console.error('❌ Command failed:', err);
    process.exit(1);
  });
}

route(process.argv.slice(2));
