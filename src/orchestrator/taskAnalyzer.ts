import { loadKnowledgeBase } from '../memory/memoryLoader.js';
import { AnalyzedTask, Capability, TaskRequirement } from './types.js';

function detectCapabilities(text: string): Capability[] {
  const t = text.toLowerCase();
  const caps = new Set<Capability>();
  if (/(code|typescript|js|python|bug|refactor|build|test)/.test(t)) caps.add('coding');
  if (/(research|compare|summarize|investigate|find sources|benchmark)/.test(t)) caps.add('research');
  if (/(data|csv|json|analy[sz]e|report|chart|metrics)/.test(t)) caps.add('data');
  if (/(browser|web ui|automation|scrape|navigate|click|form)/.test(t)) caps.add('web_automation');
  if (/(memory|kb|docs|knowledge base|context)/.test(t)) caps.add('memory');
  // Defaults: if nothing matched, infer based on verbs
  if (caps.size === 0) caps.add('research');
  return Array.from(caps);
}

function estimateComplexity(text: string): 'low' | 'medium' | 'high' {
  const len = text.length;
  const signals = [
    /(multi[- ]?step|complex|architecture|orchestrator|framework)/i,
    /(deadline|mission[- ]critical|production)/i,
    /(integrate|refactor|migrate|optimi[sz]e)/i,
  ].reduce((acc, rx) => acc + (rx.test(text) ? 1 : 0), 0);
  if (signals >= 2 || len > 800) return 'high';
  if (signals >= 1 || len > 300) return 'medium';
  return 'low';
}

function estimateResources(capabilities: Capability[], complexity: 'low' | 'medium' | 'high') {
  const base = complexity === 'high' ? 180 : complexity === 'medium' ? 60 : 20;
  const tokens = complexity === 'high' ? 500_000 : complexity === 'medium' ? 150_000 : 50_000;
  const concurrency = Math.min(4, 1 + Math.floor(capabilities.length / 2));
  return { timeMinutes: base, tokens, concurrency };
}

function splitIntoRequirements(text: string, capabilities: Capability[]): TaskRequirement[] {
  // Heuristic split by sentences and capabilities; in practice this would use a model.
  const sentences = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const reqs: TaskRequirement[] = [];
  let idx = 0;
  for (const s of sentences) {
    const caps = detectCapabilities(s).filter((c) => capabilities.includes(c));
    if (!caps.length) continue;
    const complexity = estimateComplexity(s);
    reqs.push({
      id: `req_${++idx}`,
      description: s,
      capabilities: caps,
      estimatedComplexity: complexity,
      estimatedResources: estimateResources(caps, complexity),
      dependencies: [],
      priority: complexity === 'high' ? 1 : complexity === 'medium' ? 2 : 3,
      optimizations: [],
    });
  }
  if (reqs.length === 0) {
    const complexity = estimateComplexity(text);
    reqs.push({
      id: `req_1`,
      description: text,
      capabilities,
      estimatedComplexity: complexity,
      estimatedResources: estimateResources(capabilities, complexity),
      dependencies: [],
      priority: 2,
      optimizations: [],
    });
  }
  // Simple dependency inference: if a requirement mentions "before/first", push it earlier
  const firstIdx = reqs.findIndex((r) => /before|first|setup/i.test(r.description));
  if (firstIdx > 0) {
    const [first] = reqs.splice(firstIdx, 1);
    reqs.unshift(first);
    for (let i = 1; i < reqs.length; i++) reqs[i].dependencies?.push(first.id);
  }
  return reqs;
}

export class TaskAnalyzer {
  async analyze(taskText: string): Promise<AnalyzedTask> {
    const title = taskText.split(/\n/)[0].slice(0, 80);
    const caps = detectCapabilities(taskText);
    const complexity = estimateComplexity(taskText);
    const notes: string[] = [];

    // Use knowledge base to suggest potential links or existing context
    try {
      const kb = await loadKnowledgeBase();
      const related = kb.filter((n) => {
        const q = title.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      });
      if (related.length) notes.push(`Found ${related.length} related notes in knowledge base.`);
    } catch {}

    const requirements = splitIntoRequirements(taskText, caps);

    // Pre-execution optimizations
    for (const r of requirements) {
      if (r.capabilities.includes('coding')) r.optimizations?.push('Add unit tests for critical paths');
      if (r.capabilities.includes('research')) r.optimizations?.push('Use cached knowledge base context to reduce API calls');
      if (r.capabilities.includes('web_automation')) r.optimizations?.push('Batch browser actions to minimize navigation');
    }

    return {
      taskId: `task_${Date.now()}`,
      title,
      original: taskText,
      requirements,
      riskLevel: complexity,
      notes,
    };
  }
}

