import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import * as yaml from 'yaml';

export interface SpecMetadata {
  version: string;
  type: string;
  status: 'draft' | 'proposed' | 'approved' | 'executable' | string;
  author?: string;
  backing?: any;
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
  config: any;
  tasks: TaskDef[];
  validators: any[];
  hooks: any;
}

export interface ParsedSpec {
  metadata: SpecMetadata;
  userStories: UserStory[];
  implementation: Record<string, any> & { beforeInit?: any; afterInit?: any; onMetamorphosis?: any };
  acceptanceCriteria: string[];
  interfaces: Array<{ language?: string; code: string }>;
  dependencies: string[];
  raw: string;
}

export class SpecInterpreter {
  private specCache: Map<string, ParsedSpec> = new Map();

  async parseSpec(specPath: string): Promise<ParsedSpec> {
    const abs = this.resolveSpecPath(specPath);
    console.log(`🔍 Parsing spec: ${abs}`);

    const content = await fs.readFile(abs, 'utf8');
    const { data: frontmatter, content: body } = matter(content);

    // Fallback metadata scan from a YAML block under "## Metadata"
    const metadataFromYaml = this.extractMetadataYaml(body);

    const metadata: SpecMetadata = {
      version: (frontmatter as any).version || metadataFromYaml.version || '1.0.0',
      type: (frontmatter as any).type || metadataFromYaml.type || 'spec',
      status: (frontmatter as any).status || metadataFromYaml.status || 'draft',
      author: (frontmatter as any).author || metadataFromYaml.author,
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
    this.specCache.set(abs, parsed);
    return parsed;
  }

  async toExecutable(spec: ParsedSpec): Promise<ExecutableConfig> {
    console.log(`⚡ Converting spec to executable: ${spec.metadata.type}`);
    return {
      config: this.generateConfig(spec),
      tasks: this.generateTasks(spec),
      validators: this.generateValidators(spec),
      hooks: {
        beforeInit: spec.implementation.beforeInit,
        afterInit: spec.implementation.afterInit,
        onMetamorphosis: spec.implementation.onMetamorphosis,
      },
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
      const flat: any = { ...obj };
      return {
        version: flat.version,
        type: flat.type,
        status: flat.status,
        author: flat.author,
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
      .filter((l) => /^-\s*\[?\s*[xX\s]?\]?\s+/.test(l))
      .map((l) => l.replace(/^-[\s\[]*[xX\s]?\]?\s+/, ''));
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
    const impl: Record<string, any> = {};
    // Hook blocks pattern: ```typescript beforeInit/afterInit/onMetamorphosis
    const hooks = /(beforeInit|afterInit|onMetamorphosis)\s*:?\s*\n```[\s\S]*?```/gi;
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
    const regex = /Depends on:?\s*([\w\-\./]+(?:\s*,\s*[\w\-\./]+)*)/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(markdown)) !== null) {
      deps.push(...match[1].split(',').map((s) => s.trim()));
    }
    return Array.from(new Set(deps));
  }

  private async validateSpec(spec: ParsedSpec): Promise<void> {
    if (!spec.metadata.type) throw new Error('Spec missing type');
    if (!spec.metadata.version) throw new Error('Spec missing version');
  }

  private generateConfig(spec: ParsedSpec): any {
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

  private generateValidators(spec: ParsedSpec): any[] {
    return spec.acceptanceCriteria.map((c) => ({ rule: c }));
  }
}

