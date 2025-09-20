import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import * as yaml from 'yaml';
import crypto from 'crypto';
import vm from 'vm';
import { z } from 'zod';

export interface SpecMetadata {
  version: string;
  type: string;
  status: 'draft' | 'proposed' | 'approved' | 'executable' | string;
  author?: string;
  backing?: unknown;
}

export interface UserStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface TaskDef {
  id: string;
  type: 'implementation' | 'validation' | 'research' | string;
  description: string;
  validation: string[];
  estimatedCredits: number;
  dependencies?: string[];
}

export interface ExecutableConfig {
  config: unknown;
  tasks: TaskDef[];
  validators: unknown[];
  hooks: unknown;
}

export interface ParsedSpec {
  metadata: SpecMetadata;
  userStories: UserStory[];
  implementation: Record<string, unknown> & { beforeInit?: unknown; afterInit?: unknown; onMetamorphosis?: unknown };
  acceptanceCriteria: string[];
  interfaces: Array<{ language?: string; code: string }>;
  dependencies: string[];
  raw: string;
}

export class SpecInterpreter {
  private specCache: Map<string, ParsedSpec> = new Map();
  private registryPath = path.join(process.cwd(), 'logs', 'specs', 'registry.json');
  private changelogPath = path.join(process.cwd(), 'logs', 'specs', 'changelog.json');

  async parseSpec(specPath: string): Promise<ParsedSpec> {
    const abs = this.resolveSpecPath(specPath);
    console.log(`🔍 Parsing spec: ${abs}`);

    const content = await fs.readFile(abs, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    // Fallback metadata scan from a YAML block under "## Metadata"
    const metadataFromYaml = this.extractMetadataYaml(body);

    const metadata: SpecMetadata = {
      version: (frontmatter as { version?: string }).version || metadataFromYaml.version || '1.0.0',
      type: (frontmatter as { type?: string }).type || metadataFromYaml.type || 'spec',
      status: (frontmatter as { status?: 'draft' | 'proposed' | 'approved' | 'executable' | string }).status || metadataFromYaml.status || 'draft',
      author: (frontmatter as { author?: string }).author || metadataFromYaml.author,
    };

    const parsed: ParsedSpec = {
      metadata,
      userStories: this.extractUserStories(body),
      implementation: this.extractImplementationBlocks(body),
      acceptanceCriteria: this.extractAcceptanceCriteria(body),
      interfaces: this.extractInterfaces(body),
      dependencies: this.extractDependencies(body),
      raw: content,
    };

    await this.validateSpec(parsed);
    await this.recordChangelog(abs, content, parsed.metadata);
    console.log(`📘 Spec version: ${parsed.metadata.version} • status: ${parsed.metadata.status}`);
    this.specCache.set(abs, parsed);
    return parsed;
  }

  async toExecutable(spec: ParsedSpec): Promise<ExecutableConfig> {
    console.log(`⚡ Converting spec to executable: ${spec.metadata.type}`);
    const safe = this.safeHooks(spec.implementation);
    return {
      config: this.generateConfig(spec),
      tasks: this.generateTasks(spec),
      validators: this.generateValidators(spec),
      hooks: safe,
    };
  }

  private resolveSpecPath(p: string): string {
    const candidates = [
      path.isAbsolute(p) ? p : path.join(process.cwd(), p),
      path.join(process.cwd(), 'ubos', p),
      path.join(__dirname, '../../', p),
    ];
    return candidates.find((c) => c) as string;
  }

  private extractMetadataYaml(markdown: string): Partial<SpecMetadata> {
    const metaSection = /##\s*Metadata[\s\S]*?```yaml\n([\s\S]*?)```/i.exec(markdown);
    if (!metaSection) return {};
    try {
      const obj = yaml.parse(metaSection[1]);
      const flat: Record<string, unknown> = { ...obj };
      return {
        version: flat.version as string,
        type: flat.type as string,
        status: flat.status as 'draft' | 'proposed' | 'approved' | 'executable' | string,
        author: flat.author as string,
        backing: flat.backing_assets,
      } as Partial<SpecMetadata>;
    } catch {
      return {};
    }
  }

  private extractUserStories(markdown: string): UserStory[] {
    const stories: UserStory[] = [];
    const storyRegex = /###\s*User Story:?\s*(.+?)\n([\s\S]*?)(?=\n##|\n###|$)/g;
    let match: RegExpExecArray | null;
    while ((match = storyRegex.exec(markdown)) !== null) {
      const title = match[1].trim();
      const description = match[2].trim();
      stories.push({
        title,
        description,
        acceptanceCriteria: this.extractCriteria(description),
      });
    }
    return stories;
  }

  private extractCriteria(text: string): string[] {
    const lines = text.split(/\r?\n/);
    return lines
      .map((l) => l.trim())
      .filter((l) => /^-\s*\[?(\s*[xX\s]?)?\]?\s+/.test(l))
      .map((l) => l.replace(/^-?[[\s]*[xX\s]?\]?\s+/, ''));
  }

  private extractCodeBlocks(markdown: string): Array<{ language?: string; code: string }> {
    const blocks: Array<{ language?: string; code: string }> = [];
    const regex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      blocks.push({ language: match[1], code: match[2] });
    }
    return blocks;
  }

  private extractInterfaces(markdown: string) {
    return this.extractCodeBlocks(markdown).filter((b) =>
      ['ts', 'tsx', 'typescript', 'interface', 'yaml'].includes((b.language || '').toLowerCase())
    );
  }

  private extractImplementationBlocks(markdown: string) {
    const impl: Record<string, unknown> = {};
    // Hook blocks pattern: ```typescript beforeInit/afterInit/onMetamorphosis
    const blocks = this.extractCodeBlocks(markdown);
    blocks.forEach((b) => {
      const key = (b.language || '').toLowerCase();
      if (key.includes('beforeinit')) impl.beforeInit = b.code;
      if (key.includes('afterinit')) impl.afterInit = b.code;
      if (key.includes('onmetamorphosis')) impl.onMetamorphosis = b.code;
    });
    return impl;
  }

  private extractAcceptanceCriteria(markdown: string): string[] {
    // Search for a section titled Acceptance Criteria
    const section = /##\s*Acceptance Criteria\n([\s\S]*?)(?=\n##|$)/i.exec(markdown);
    if (!section) return [];
    return this.extractCriteria(section[1]);
  }

  private extractDependencies(markdown: string): string[] {
    const deps: string[] = [];
    const regex = /Depends on:?\s*([\w\-\.\/]+(?:\s*,\s*[\w\-\.\/]+)*)/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      deps.push(...match[1].split(',').map((s) => s.trim()));
    }
    return Array.from(new Set(deps));
  }

  private async validateSpec(spec: ParsedSpec): Promise<void> {
    const SemVer = /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
    const MetadataSchema = z.object({
      version: z.string().regex(SemVer, 'version must be semver (e.g., 1.0.0)'),
      type: z.string().min(1),
      status: z.string().min(1),
      author: z.string().optional(),
      backing: z.unknown().optional(),
    });
    MetadataSchema.parse(spec.metadata);

    // Invariants
    if (spec.userStories.length > 0 && spec.acceptanceCriteria.length === 0) {
      console.warn('⚠️ Spec has user stories but no acceptance criteria');
    }
    if (['approved', 'executable'].includes((spec.metadata.status || '').toLowerCase()) &&
        spec.acceptanceCriteria.length === 0) {
      throw new Error('Executable/approved specs must include acceptance criteria');
    }
  }

  private async recordChangelog(specAbsPath: string, raw: string, meta: SpecMetadata): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      const hash = crypto.createHash('sha256').update(raw).digest('hex');

      // Load registry
      let registry: Record<string, { version: string; hash: string; updatedAt: string }> = {};
      try {
        registry = JSON.parse(await fs.readFile(this.registryPath, 'utf8'));
      } catch {}

      const prev = registry[specAbsPath];
      if (!prev || prev.hash !== hash) {
        const prevRaw = prev ? await this.tryLoadRawByHash() : undefined;
        const diff = this.diffStats(prevRaw || '', raw);

        // Append to changelog
        const entry = {
          ts: new Date().toISOString(),
          path: specAbsPath,
          from: prev?.version || null,
          to: meta.version,
          diff,
        };
        let changelog: { ts: string; path: string; from: string | null; to: string; diff: { added: number; removed: number; same: number } }[] = [];
        try {
          changelog = JSON.parse(await fs.readFile(this.changelogPath, 'utf8'));
        } catch {}
        changelog.push(entry);
        await fs.writeFile(this.changelogPath, JSON.stringify(changelog, null, 2));

        // Update registry
        registry[specAbsPath] = { version: meta.version, hash, updatedAt: entry.ts };
        await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2));
      }
    } catch (err) {
      console.warn('⚠️ Failed to record changelog:', err instanceof Error ? err.message : err);
    }
  }

  private async tryLoadRawByHash(): Promise<string | undefined> {
    // Placeholder: In a future version we could store raw snapshots by content hash.
    return undefined;
  }

  private diffStats(a: string, b: string): { added: number; removed: number; same: number } {
    const aLines = a.split(/\r?\n/);
    const bLines = b.split(/\r?\n/);
    const aSet = new Map<string, number>();
    aLines.forEach((l) => aSet.set(l, (aSet.get(l) || 0) + 1));
    let same = 0;
    const bSet = new Map<string, number>();
    bLines.forEach((l) => bSet.set(l, (bSet.get(l) || 0) + 1));
    for (const [line, cnt] of bSet) {
      const inA = aSet.get(line) || 0;
      same += Math.min(inA, cnt);
    }
    const removed = Math.max(0, aLines.length - same);
    const added = Math.max(0, bLines.length - same);
    return { added, removed, same };
  }

  private generateConfig(spec: ParsedSpec): unknown {
    return {
      type: spec.metadata.type,
      stories: spec.userStories.map((s) => s.title),
      dependencies: spec.dependencies,
    };
  }

  private generateTasks(spec: ParsedSpec): TaskDef[] {
    return spec.userStories.map((s, i) => ({
      id: `story-${i + 1}`,
      type: 'implementation',
      description: s.title,
      validation: s.acceptanceCriteria,
      estimatedCredits: 100,
    }));
  }

  private generateValidators(spec: ParsedSpec): unknown[] {
    return spec.acceptanceCriteria.map((c) => ({ rule: c }));
  }

  // Create safe wrappers around hook code blocks
  private safeHooks(impl: Record<string, unknown>): { beforeInit?: Function; afterInit?: Function; onMetamorphosis?: Function } {
    const wrap = (code?: string) => {
      if (!code || typeof code !== 'string' || !code.trim()) return undefined;
      // Very defensive sandbox: no process, require, globalThis minimized
      const sandbox: Record<string, unknown> = {
        console: {
          log: (...args: unknown[]) => console.log('[spec-hook]', ...args),
          warn: (...args: unknown[]) => console.warn('[spec-hook]', ...args),
          error: (...args: unknown[]) => console.error('[spec-hook]', ...args),
        },
      };
      const context = vm.createContext(sandbox, { name: 'spec-hook' });
      const script = new vm.Script(`(function() { ${code}\n })()`, { filename: 'spec-hook.vm' });
      return () => {
        try {
          script.runInContext(context, { timeout: 50 });
        } catch (err) {
          console.warn('⚠️ Spec hook execution blocked/failed:', err instanceof Error ? err.message : err);
        }
      };
    };
    return {
      beforeInit: wrap(impl.beforeInit as string),
      afterInit: wrap(impl.afterInit as string),
      onMetamorphosis: wrap(impl.onMetamorphosis as string),
    };
  }
}