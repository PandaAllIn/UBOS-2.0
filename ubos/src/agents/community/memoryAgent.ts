import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { loadKnowledgeBase, toContext, findNotesByQuery } from '../../memory/memoryLoader.js';

// Context7-guided: Memory agent feature definition
const memoryFeature: AgentFeature = {
  type: 'memory',
  capabilities: ['knowledge-retrieval', 'context-management', 'notes-search'],
  requirements: { memoryFiles: ['markdown', 'txt'] }
};

export class MemoryAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'memory-retrieval') {
    super(id, requirementId, memoryFeature);
  }

  get type() { return 'MemoryAgent'; }
  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      const notes = await loadKnowledgeBase();
      const results = findNotesByQuery(notes, opts.input);
      const context = toContext(results, { maxBytes: 8000 });
      const output = results.length
        ? `Found ${results.length} related notes. Context preview:\n\n${context}`
        : 'No direct matches in knowledge base.';
      return { agentId: this.id, requirementId: this.requirementId, success: true, output, startedAt, finishedAt: this.getNow(), artifacts: { matched: results.map(r => ({ path: r.path, title: r.title })) } };
    } catch (e: unknown) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: (e as Error)?.message || String(e), startedAt, finishedAt: this.getNow() };
    }
  }
}
