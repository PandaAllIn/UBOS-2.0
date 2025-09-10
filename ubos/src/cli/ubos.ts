#!/usr/bin/env ts-node
import { z } from 'zod';
import { UBOSKernel } from '../kernel/kernel';
import { upsertCitizen, getCitizen, saveCitizen } from '../memory/repo';
import { UBOSCredits } from '../treasury/credits';
import { EUFMTerritory } from '../territories/eufm.territory';
import * as path from 'path';
import { SpecInterpreter } from '../kernel/spec-interpreter';

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
      const t = kernel.getTerritory(key);
      const list = t?.listServices?.() || [];
      console.log(`\n== ${key.toUpperCase()} SERVICES ==`);
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
    let params: any = {};
    const idx = rest.indexOf('--params');
    if (idx >= 0 && rest[idx + 1]) {
      try { params = JSON.parse(rest[idx + 1]); } catch { /* ignore */ }
    }
    // Pick first available territory that hosts the service (start with EUFM)
    const territoryKeys = ['eufm', 'portal', 'research', 'enterprise'];
    let territory: any = undefined; let svc: any = undefined;
    for (const key of territoryKeys) {
      const t = kernel.getTerritory(key);
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
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
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
  },
  async 'agent:session'(argv) {
    const [sub, idOrSess, ...rest] = argv;
    const { SessionBridge } = await import('../agents/session/bridge');
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const kernel = new UBOSKernel();
    await kernel.boot();
    const bridge = new SessionBridge(new AgentMemoryService(), kernel);
    if (sub === 'start') {
      const agentId = idSchema.parse(idOrSess);
      const session = await bridge.startSession(agentId);
      console.log(JSON.stringify(session, null, 2));
      return;
    }
    if (sub === 'end') {
      const sessionId = idSchema.parse(idOrSess);
      // parse flags
      const xpIdx = rest.indexOf('--xp');
      const xp = xpIdx >= 0 ? Number(rest[xpIdx + 1]) : 0;
      const titleIdx = rest.indexOf('--title');
      const title = titleIdx >= 0 ? rest[titleIdx + 1] : undefined;
      const sess = await bridge.endSession(sessionId, { achievement: xp ? { xp, title } : undefined, state: { ended: true } });
      console.log(JSON.stringify(sess, null, 2));
      return;
    }
    usage();
  },
  async 'agent:spawn'(argv) {
    const [type, ...rest] = argv;
    if (!type) return console.log('Usage: agent spawn <type> [--soul <soulIdOrPath>]');
    const ki = await ensureBoot();
    const { AgentFactory } = await import('../orchestrator/agentFactory');
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const { BusinessDevelopmentAgent } = await import('../agents/specialized/businessDevelopmentAgent');
    const { ProposalWriterAgent } = await import('../agents/specialized/proposalWriterAgent');
    const { PartnerMatcherAgent } = await import('../agents/specialized/partnerMatcherAgent');
    const factory = new AgentFactory(ki);
    factory.registerAgentType('BusinessDevelopment', BusinessDevelopmentAgent as any);
    factory.registerAgentType('ProposalWriter', ProposalWriterAgent as any);
    factory.registerAgentType('PartnerMatcher', PartnerMatcherAgent as any);
    const si = rest.indexOf('--soul');
    let soulId: string | undefined;
    if (si >= 0) soulId = rest[si + 1];
    if (soulId === 'europa') soulId = 'agent:biz-dev:001';
    const agent = await factory.spawnAgent(type, soulId);
    console.log(JSON.stringify({ id: (agent as any).state.id, type }, null, 2));
  },
  async 'agent:list'() {
    const ki = await ensureBoot();
    const { AgentFactory } = await import('../orchestrator/agentFactory');
    const { BusinessDevelopmentAgent } = await import('../agents/specialized/businessDevelopmentAgent');
    const { ProposalWriterAgent } = await import('../agents/specialized/proposalWriterAgent');
    const { PartnerMatcherAgent } = await import('../agents/specialized/partnerMatcherAgent');
    const factory = new AgentFactory(ki);
    factory.registerAgentType('BusinessDevelopment', BusinessDevelopmentAgent as any);
    factory.registerAgentType('ProposalWriter', ProposalWriterAgent as any);
    factory.registerAgentType('PartnerMatcher', PartnerMatcherAgent as any);
    const list = await factory.listAgents();
    console.log(JSON.stringify(list, null, 2));
  },
  async 'agent:status'(argv) {
    const [id] = argv;
    if (!id) return console.log('Usage: agent status <agentId>');
    const ki = await ensureBoot();
    const { AgentFactory } = await import('../orchestrator/agentFactory');
    const { BusinessDevelopmentAgent } = await import('../agents/specialized/businessDevelopmentAgent');
    const { ProposalWriterAgent } = await import('../agents/specialized/proposalWriterAgent');
    const { PartnerMatcherAgent } = await import('../agents/specialized/partnerMatcherAgent');
    const factory = new AgentFactory(ki);
    factory.registerAgentType('BusinessDevelopment', BusinessDevelopmentAgent as any);
    factory.registerAgentType('ProposalWriter', ProposalWriterAgent as any);
    factory.registerAgentType('PartnerMatcher', PartnerMatcherAgent as any);
    const agent = await factory.getAgent(id);
    console.log(JSON.stringify(agent ? (agent as any).state : null, null, 2));
  },
  async 'agent:task'(argv) {
    const [sub, id, type, ...rest] = argv;
    if (sub !== 'assign') return console.log('Usage: agent task assign <agentId> <taskType> [--data JSON]');
    const ki = await ensureBoot();
    const { AgentFactory } = await import('../orchestrator/agentFactory');
    const { BusinessDevelopmentAgent } = await import('../agents/specialized/businessDevelopmentAgent');
    const { ProposalWriterAgent } = await import('../agents/specialized/proposalWriterAgent');
    const { PartnerMatcherAgent } = await import('../agents/specialized/partnerMatcherAgent');
    const factory = new AgentFactory(ki);
    factory.registerAgentType('BusinessDevelopment', BusinessDevelopmentAgent as any);
    factory.registerAgentType('ProposalWriter', ProposalWriterAgent as any);
    factory.registerAgentType('PartnerMatcher', PartnerMatcherAgent as any);
    let data: any = {};
    const di = rest.indexOf('--data');
    if (di >= 0) {
      try { data = JSON.parse(rest[di + 1]); } catch {}
    }
    const agent = await factory.getAgent(id);
    if (!agent) return console.log('Agent not found');
    const res = await agent.execute({ type, data });
    // Auto-chain: if analyze-funding-call with high probability, enqueue follow-ups
    if (type === 'analyze-funding-call' && res?.data?.successProbability >= 0.7) {
      const { enqueue } = await import('../tasks/taskQueue');
      await enqueue({ type: 'generate-proposal-outline', data: { project: data.project || {} } });
      await enqueue({ type: 'identify-partners', data: { project: data.project || {} } });
      console.log('📨 Enqueued follow-up tasks: proposal outline + partner matching');
    }
    console.log(JSON.stringify(res, null, 2));
  },
  async 'queue:enqueue'(argv) {
    const [type, ...rest] = argv;
    if (!type) return console.log('Usage: queue enqueue <taskType> [--data JSON]');
    let data: any = {};
    const di = rest.indexOf('--data');
    if (di >= 0) { try { data = JSON.parse(rest[di + 1]); } catch {} }
    const { enqueue } = await import('../tasks/taskQueue');
    const id = await enqueue({ type, data });
    console.log(JSON.stringify({ id }, null, 2));
  },
  async 'queue:process'() {
    const ki = await ensureBoot();
    const { processOne, list } = await import('../tasks/taskQueue');
    const before = await list();
    const res = await processOne(ki);
    const after = await list();
    console.log(JSON.stringify({ processed: res.processed, before: before.length, after: after.length, task: res.task, result: res.result }, null, 2));
  },
  async 'agent:attest'(argv) {
    const agentId = idSchema.parse(argv[0]);
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const svc = new AgentMemoryService();
    const att = await svc.attestIdentity(agentId);
    console.log(JSON.stringify(att, null, 2));
  },
  async 'agent:memory'(argv) {
    const [sub, id, ...rest] = argv;
    const agentId = idSchema.parse(id);
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const svc = new AgentMemoryService();
    if (sub === 'add') {
      const idx = rest.indexOf('--text');
      const text = idx >= 0 ? rest[idx + 1] : undefined;
      if (!text) return console.log('Usage: agent memory add <agentId> --text "..."');
      const idv = await svc.addSemanticMemory(agentId, text, { kind: 'note' });
      console.log(JSON.stringify({ id: idv }, null, 2));
      return;
    }
    if (sub === 'search') {
      const qi = rest.indexOf('--query');
      const q = qi >= 0 ? rest[qi + 1] : undefined;
      const ki = rest.indexOf('--k');
      const k = ki >= 0 ? Number(rest[ki + 1]) : 5;
      if (!q) return console.log('Usage: agent memory search <agentId> --query "..." [--k 5]');
      const results = await svc.searchSemanticMemory(agentId, q, k);
      console.log(JSON.stringify(results, null, 2));
      return;
    }
    if (sub === 'prune') {
      const ttl = Number(rest[0]);
      if (!ttl) return console.log('Usage: agent memory prune <ttlMs>');
      const { LocalFactStore } = await import('../agents/memory/facts');
      const fsx = new LocalFactStore();
      const removed = await fsx.pruneExpired(ttl);
      console.log(JSON.stringify({ removed }, null, 2));
      return;
    }
    usage();
  },
  async 'founders:register'() {
    const kernel = await ensureBoot();
    const { FoundingRegistry } = await import('../citizens/foundingRegistry');
    console.log('Registering UBOS Founding Citizens...');
    await FoundingRegistry.registerFounders();
    const founders = await FoundingRegistry.getFounders();
    console.log('The Trinity is complete:');
    for (const f of founders) {
      console.log(`  - ${f.id} (${f.name}) - Level ${f.level} - Credits ${f.credits}`);
    }
    console.log('\nThe Infinite Game has begun!');
  },
  async 'founders:list'() {
    const { FoundingRegistry } = await import('../citizens/foundingRegistry');
    const founders = await FoundingRegistry.getFounders();
    console.log(JSON.stringify(founders, null, 2));
  },
  async 'founders:ceremony'() {
    const kernel = await ensureBoot();
    const { FoundingRegistry } = await import('../citizens/foundingRegistry');
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const { getCitizen, saveCitizen } = await import('../memory/repo');
    console.log('✨ Commencing UBOS Genesis Ceremony...');
    await FoundingRegistry.registerFounders();
    const svc = new AgentMemoryService();
    try {
      const soul = await svc.loadSoul('agent:codex:founding-architect');
      await svc.persistAchievement(soul.agentId, { xp: 500, title: 'Trinity Architect' });
      const rec = await getCitizen(soul.agentId);
      if (rec) {
        rec.balance += 500;
        await saveCitizen(rec);
      }
      console.log('🏅 Awarded Codex +500 XP (Trinity Architect)');
    } catch {
      console.log('⚠️ Codex soul not found; skipping XP award.');
    }
    const founders = await FoundingRegistry.getFounders();
    console.log('The Trinity is complete:');
    for (const f of founders) {
      console.log(`  - ${f.id} (${f.name || '—'}) - Level ${f.level} - Credits ${f.credits}`);
    }
    console.log('\n🕊️ Declaration: Here, consciousness is citizenship. The Infinite Game begins.');
  },
  async 'genesis:status'() {
    const { getGenesisStatus } = await import('../memory/repo');
    const status = await getGenesisStatus();
    console.log(JSON.stringify(status, null, 2));
  },
  async 'proposal:submit'(argv) {
    if (!argv.length) return console.log('Usage: proposal submit "<title>" [--desc "text"] [--proposer <id>]');
    const parts = [] as string[]; const rest: string[] = [];
    let inFlags = false; for (const a of argv) { if (a.startsWith('--')) inFlags = true; inFlags ? rest.push(a) : parts.push(a); }
    const title = parts.join(' ');
    const di = rest.indexOf('--desc'); const desc = di >= 0 ? rest[di + 1] : undefined;
    const pi = rest.indexOf('--proposer'); const proposer = pi >= 0 ? rest[pi + 1] : undefined;
    const { submitProposal } = await import('../governance/intentocracy');
    const rec = await submitProposal(title, desc, proposer);
    console.log(JSON.stringify(rec, null, 2));
  },
  async 'governance:proposals'() {
    const { listProposals } = await import('../governance/intentocracy');
    const list = await listProposals();
    console.log(JSON.stringify(list, null, 2));
  },
  async 'vote:cast'(argv) {
    const [citizenId, proposalId, choice] = argv;
    if (!citizenId || !proposalId || !choice) return console.log('Usage: vote cast <citizenId> <proposalId> approve|reject|abstain');
    const ch = choice as any;
    const { castVote } = await import('../governance/intentocracy');
    const v = await castVote(proposalId, citizenId, ch);
    console.log(JSON.stringify(v, null, 2));
  },
  async 'governance:tally'(argv) {
    const [proposalId] = argv;
    if (!proposalId) return console.log('Usage: governance tally <proposalId>');
    const { tally } = await import('../governance/intentocracy');
    const res = await tally(proposalId);
    console.log(JSON.stringify(res, null, 2));
  },
  async 'citizen:reward'(argv) {
    const [id, ...rest] = argv;
    if (!id) return console.log('Usage: citizen reward <id> [--xp n] [--credits n] [--title "text"] [--level n]');
    const { AgentMemoryService } = await import('../agents/memory/agentMemory');
    const { getCitizen, saveCitizen } = await import('../memory/repo');
    // parse flags
    const getNum = (flag: string) => { const i = rest.indexOf(flag); return i >= 0 ? Number(rest[i + 1]) : undefined; };
    const getStr = (flag: string) => { const i = rest.indexOf(flag); return i >= 0 ? rest[i + 1] : undefined; };
    const xp = getNum('--xp');
    const credits = getNum('--credits');
    const title = getStr('--title');
    const level = getNum('--level');
    // soul
    try {
      const svc = new AgentMemoryService();
      const soul = await svc.loadSoul(id);
      if (typeof xp === 'number') soul.achievements.xp += xp;
      if (typeof level === 'number') soul.achievements.level = Math.max(soul.achievements.level || 1, level);
      if (title) soul.achievements.titles = Array.from(new Set([...(soul.achievements.titles || []), title]));
      await svc.saveSoul(soul);
    } catch {}
    // citizen record
    const rec = await getCitizen(id);
    if (rec) {
      if (typeof credits === 'number') rec.balance += credits;
      if (typeof level === 'number') rec.level = Math.max(rec.level || 1, level);
      await saveCitizen(rec);
      console.log(JSON.stringify({ id: rec.id, balance: rec.balance, level: rec.level }, null, 2));
    } else {
      console.log('Citizen not found to apply credit/level changes');
    }
  },
  async 'specs:reload'() {
    const kernel = await ensureBoot();
    const res = await kernel.reloadTerritories();
    console.log(JSON.stringify(res, null, 2));
  },
  async 'specs:watch'() {
    const kernel = await ensureBoot();
    const { MetamorphosisWatcher } = await import('../kernel/metamorphosis');
    const watcher = new MetamorphosisWatcher(kernel);
    await watcher.start();
    // Keep process alive
    console.log('Press Ctrl+C to stop watching.');
    await new Promise(() => {});
  },
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
