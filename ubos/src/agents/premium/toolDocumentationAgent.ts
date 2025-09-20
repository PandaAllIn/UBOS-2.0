import { BaseAgent, AgentRunOptions, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import fs from 'fs/promises';
import path from 'path';

// Context7-guided: Tool documentation agent feature definition
const toolDocFeature: AgentFeature = {
  type: 'tool-documentation',
  capabilities: ['documentation-scanning', 'content-extraction', 'tool-inventory'],
  requirements: { tools: ['file-system'] }
};

export class ToolDocumentationAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'tool-documentation') {
    super(id, requirementId, toolDocFeature);
  }

  get type() { return 'tool-docs'; }

  /**
   * Scans the "General TOOLS" directory for documentation files (Markdown, txt, docx, pdf)
   * and returns a structured summary.
   */
  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      const toolsRoot = path.resolve(process.cwd(), 'General TOOLS');
      const docs = await this.collectDocumentation(toolsRoot);

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: JSON.stringify(docs, null, 2),
        startedAt,
        finishedAt: this.getNow()
      };
    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }

  /**
   * Recursively walks a directory and returns an array of documentation entries.
   * Each entry contains the tool name, file path (relative to the repo root),
   * and a short excerpt (first 200 characters) of the file content.
   */
  private async collectDocumentation(dir: string): Promise<Array<{ tool: string; file: string; excerpt: string }>> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const docs: Array<{ tool: string; file: string; excerpt: string }> = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subDocs = await this.collectDocumentation(fullPath);
        docs.push(...subDocs);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.md', '.txt', '.docx', '.pdf'].includes(ext)) {
          const toolName = path.basename(path.dirname(fullPath));
          let content = '';
          try {
            // For binary formats (docx, pdf) we just note the file exists.
            if (['.docx', '.pdf'].includes(ext)) {
              content = `[binary ${ext.substring(1)} file]`
            } else {
              const raw = await fs.readFile(fullPath, 'utf-8');
              content = raw.slice(0, 200).replace(/\s+/g, ' ');
            }
          } catch {
            content = '[unreadable]';
          }

          docs.push({
            tool: toolName,
            file: path.relative(process.cwd(), fullPath),
            excerpt: content
          });
        }
      }
    }

    return docs;
  }
}
