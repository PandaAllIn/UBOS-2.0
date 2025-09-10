import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { EUFMTerritory, Service as EufmService } from '../territories/eufm.territory';
import { GenericTerritory, GenericService } from '../territories/generic.territory';
import { SpecInterpreter } from './spec-interpreter';
import { CreditBacking } from '../treasury/credit-backing';
import { hasGenesisBlock, createGenesisBlock } from '../memory/repo';
import { FoundingRegistry } from '../citizens/foundingRegistry';

interface Spec {
  metadata: Record<string, unknown>;
  implementation: string;
  interfaces: any[];
}

export class UBOSKernel {
  private specs: Map<string, Spec> = new Map();
  private territories: Map<string, any> = new Map();
  private booted = false;

  async boot(): Promise<void> {
    const traceId = `boot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    console.log(`🌟 UBOS Kernel Booting... (trace=${traceId})`);
    console.log('📜 Loading Constitution...');

    // Legacy constitution (root) for compatibility
    await this.loadSpec('constitution.spec.md');

    // New spec-driven constitution under kernel/
    try {
      const interpreter = new SpecInterpreter();
      const constitutionSpec = await interpreter.parseSpec('specs/kernel/constitution.spec.md');
      const executable = await interpreter.toExecutable(constitutionSpec);
      // Store/spec map for visibility
      this.specs.set('kernel/constitution', {
        metadata: constitutionSpec.metadata as unknown as Record<string, unknown>,
        implementation: constitutionSpec.raw,
        interfaces: constitutionSpec.interfaces,
      });
      console.log(`⚙️ Spec Interpreter initialized for constitution v${(constitutionSpec.metadata as any).version}`);
      void executable; // placeholder for future execution hooks
    } catch (err) {
      console.warn('⚠️ Spec Interpreter: kernel constitution not found or failed to parse.', err instanceof Error ? err.message : err);
    }

    await this.initializeCredits();
    await this.initializeTerritories(traceId);
    await this.initializeCitizens();

    // Genesis block and founding citizens
    try {
      const hasGenesis = await hasGenesisBlock();
      if (!hasGenesis) {
        await FoundingRegistry.registerFounders();
        console.log('🌟 UBOS Genesis: The Trinity is established');
      }
    } catch (err) {
      console.warn('⚠️ Genesis setup skipped:', err instanceof Error ? err.message : err);
    }

    this.booted = true;
    console.log(`✅ UBOS Kernel Ready - Digital Nation Active (trace=${traceId})`);
    console.log('🎮 Infinite Game Started');
  }

  private async loadSpec(specFile: string): Promise<Spec> {
    const candidatePaths = [
      // When compiled, this points to dist/src/kernel/../../specs
      path.join(__dirname, '../../specs', specFile),
      // Fallback to project root (works with ts-node and dev)
      path.resolve(process.cwd(), 'specs', specFile),
    ];

    let content: string | undefined;
    for (const p of candidatePaths) {
      try {
        content = await fs.readFile(p, 'utf8');
        break;
      } catch (_) {
        // try next
      }
    }

    if (!content) {
      throw new Error(`Spec not found in: ${candidatePaths.join(' | ')}`);
    }

    const { data, content: body } = matter(content);

    const spec: Spec = {
      metadata: data as Record<string, unknown>,
      implementation: body,
      interfaces: this.extractInterfaces(body),
    };

    this.specs.set(specFile, spec);
    console.log(`📋 Loaded spec: ${specFile}`);
    return spec;
  }

  private extractInterfaces(markdown: string): any[] {
    const codeBlocks: string[] = [];
    const regex = /```(?:typescript|javascript|yaml)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      codeBlocks.push(match[1]);
    }
    // For future: parse codeBlocks and return interface descriptors
    return codeBlocks;
  }

  async interpretSpec(specName: string): Promise<Spec> {
    const spec = this.specs.get(specName);
    if (!spec) throw new Error(`Spec not found: ${specName}`);

    console.log(`🔍 Interpreting spec: ${specName}`);
    // Placeholder: could convert markdown + metadata to runtime config
    return spec;
  }

  private async initializeCredits(): Promise<void> {
    console.log('💰 Initializing Credit System...');
    const backing = new CreditBacking();
    console.log(`🏦 Backing ratio: €1 = ${backing.getBackingRatio()} UBOSC`);
  }

  private async initializeTerritories(traceId?: string): Promise<void> {
    console.log('🏛️ Initializing Territories...');
    // Load from specs first
    const loaded = await this.loadTerritorySpecs(traceId);
    if (loaded.size > 0) {
      for (const [key, territory] of loaded) {
        await (territory as any).initialize?.();
        this.territories.set(key, territory);
      }
    } else {
      // Fallback to hardcoded EUFM territory
      const eufm = new EUFMTerritory();
      await eufm.initialize();
      this.territories.set('eufm', eufm);
    }
  }

  public async loadTerritorySpecs(traceId?: string): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    try {
      const dir = path.resolve(process.cwd(), 'specs', 'territories');
      const files = await fs.readdir(dir);
      const interpreter = new SpecInterpreter();
      const eventLogPath = path.resolve(process.cwd(), 'logs', 'specs', 'territories_events.json');
      await fs.mkdir(path.dirname(eventLogPath), { recursive: true });
      for (const f of files) {
        if (!f.endsWith('.spec.md')) continue;
        const full = path.join(dir, f);
        const spec = await interpreter.parseSpec(full);
        const raw = spec.raw;
        const id = f.replace(/\.spec\.md$/, '');
        // Extract services list from markdown under '## Services'
        const services = this.extractServices(raw);
        const display = id.toUpperCase();
        if (id === 'eufm') {
          const svc: EufmService[] = services.map((s) => ({ id: s.id, name: s.id, price: s.price }));
          const eufm = new EUFMTerritory(svc);
          map.set('eufm', eufm);
        } else {
          const svc: GenericService[] = services.map((s) => ({ id: s.id, name: s.id, price: s.price }));
          map.set(id, new GenericTerritory(id, display, svc));
        }

        // Log event
        const evt = {
          ts: new Date().toISOString(),
          traceId,
          file: full,
          id,
          version: spec.metadata.version,
          services: services.map((s) => s.id)
        };
        try {
          let events: any[] = [];
          try { events = JSON.parse(await fs.readFile(eventLogPath, 'utf8')); } catch {}
          events.push(evt);
          await fs.writeFile(eventLogPath, JSON.stringify(events, null, 2));
        } catch (err) {
          console.warn('⚠️ Failed to write territory event:', err instanceof Error ? err.message : err);
        }
      }
    } catch (err) {
      console.warn('⚠️ Territory spec loading failed or none found:', err instanceof Error ? err.message : err);
    }
    return map;
  }

  private extractServices(markdown: string): Array<{ id: string; price: number }> {
    const sectionMatch = /##\s*Services\n([\s\S]*?)(?=\n##|$)/i.exec(markdown);
    if (!sectionMatch) return [];
    const lines = sectionMatch[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const services: Array<{ id: string; price: number }> = [];
    for (const line of lines) {
      // Match patterns like: - eu-discovery: 100 credits
      const m = /^-\s*([a-z0-9-]+)\s*:\s*(\d+)/i.exec(line);
      if (m) {
        const id = m[1].toLowerCase();
        const price = Number(m[2]);
        if (!/^[a-z0-9-]+$/.test(id) || !Number.isFinite(price)) continue;
        services.push({ id, price });
      }
    }
    return services;
  }

  getTerritory(key: string): any | undefined {
    return this.territories.get(key);
  }

  getTerritoryKeys(): string[] {
    return Array.from(this.territories.keys());
  }

  public async reloadTerritories(): Promise<{ registered: string[] }> {
    const loaded = await this.loadTerritorySpecs();
    // Replace map contents
    this.territories.clear();
    for (const [key, territory] of loaded) {
      await (territory as any).initialize?.();
      this.territories.set(key, territory);
    }
    const keys = Array.from(this.territories.keys());
    console.log(`🔄 Metamorphosis: territories reloaded -> [${keys.join(', ')}]`);
    return { registered: keys };
  }

  private async initializeCitizens(): Promise<void> {
    console.log('👥 Initializing Citizens...');
  }

  // Registration and retrieval bridge to memory repo
  async registerCitizenRecord(rec: { id: string; balance?: number; level?: number }): Promise<void> {
    const { upsertCitizen, saveCitizen, getCitizen } = await import('../memory/repo');
    const existing = await getCitizen(rec.id);
    if (existing) {
      if (rec.balance !== undefined) existing.balance = rec.balance;
      if (rec.level !== undefined) existing.level = rec.level;
      await saveCitizen(existing);
    } else {
      const created = await upsertCitizen(rec.id);
      if (rec.balance !== undefined) created.balance = rec.balance;
      if (rec.level !== undefined) created.level = rec.level;
      await saveCitizen(created);
    }
  }

  async getCitizenRecord(id: string) {
    const { getCitizen } = await import('../memory/repo');
    return getCitizen(id);
  }
}
