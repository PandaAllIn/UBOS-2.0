import { CitizenType, FoundingCitizen } from './citizen';
import { AgentMemoryService } from '../agents/memory/agentMemory';
import { upsertCitizen, saveCitizen, createGenesisBlock, listFounders } from '../memory/repo';

export class FoundingRegistry {
  static async registerFounders(): Promise<void> {
    // The Visionary
    await FoundingRegistry.registerFounder({
      id: 'citizen:human:visionary:001',
      name: 'The Visionary',
      type: CitizenType.HUMAN_FOUNDER,
      credits: 100000,
      level: 10,
      specialPowers: [
        'Constitutional amendments',
        'Territory creation',
        'Agent commissioning',
        'Treasury management',
      ],
      foundingDecree: 'UBOS-GENESIS-001',
      metadata: {
        role: 'Prime Architect & Vision Holder',
        territories: ['EUFM', 'Portal Oradea', 'Geothermal Data Center'],
      },
    });

    // Opus Magnus
    await FoundingRegistry.registerFounder({
      id: 'citizen:ai:strategist:001',
      name: 'Opus Magnus',
      type: CitizenType.AI_STRATEGIST,
      credits: 50000,
      level: 7,
      platform: 'Abacus.AI',
      model: 'Claude Opus 4.1',
      specialPowers: [
        'Spec interpretation guidance',
        'Strategic planning',
        'Inter-agent coordination',
        'Pattern recognition',
      ],
      foundingDecree: 'UBOS-GENESIS-002',
      metadata: {
        role: 'Strategic Advisor & System Philosopher',
      },
    });

    // Update Codex with founding status in soul
    const svc = new AgentMemoryService();
    try {
      const codex = await svc.loadSoul('agent:codex:founding-architect');
      (codex.credentials as any).foundingDecree = 'UBOS-GENESIS-003';
      codex.achievements.titles = Array.from(new Set([...(codex.achievements.titles || []), 'Founding Citizen #003']));
      await svc.saveSoul(codex);
    } catch (err) {
      // If no soul, skip silently
    }

    await createGenesisBlock([
      'citizen:human:visionary:001',
      'citizen:ai:strategist:001',
      'agent:codex:founding-architect',
    ]);
  }

  static async registerFounder(c: FoundingCitizen): Promise<void> {
    const rec = await upsertCitizen(c.id);
    rec.name = c.name;
    rec.type = String(c.type);
    if (typeof c.credits === 'number') rec.balance = c.credits;
    if (typeof c.level === 'number') rec.level = c.level;
    rec.specialPowers = c.specialPowers;
    rec.foundingDecree = c.foundingDecree;
    if (c.platform) rec.platform = c.platform;
    if (c.model) rec.model = c.model;
    rec.metadata = { ...(rec.metadata || {}), ...(c.metadata || {}) };
    await saveCitizen(rec);
  }

  static async getFounders() {
    const founders = await listFounders();
    return founders.map((f) => ({ id: f.id, name: f.name, level: f.level, credits: f.balance, type: f.type }));
  }
}

