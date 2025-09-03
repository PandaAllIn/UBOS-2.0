import { promises as fs } from 'fs';
import path from 'path';
import { TaskAnalyzer } from './taskAnalyzer.js';
import { CapabilityMapper } from './capabilityMapper.js';
import { ExecutionCoordinator } from './executionCoordinator.js';
import { PatternLearner } from '../intelligence/patternLearner.js';
import { ProactiveAdvisor } from '../intelligence/proactiveAdvisor.js';
import { AnalyzedTask, OrchestrationPlan, OrchestrationResult } from './types.js';

export class StrategicOrchestrator {
  private analyzer = new TaskAnalyzer();
  private mapper = new CapabilityMapper();
  private coordinator = new ExecutionCoordinator();
  private learner = new PatternLearner();
  private advisor = new ProactiveAdvisor();
  private baseDir = 'logs/orchestrator';

  private async saveJson(rel: string, data: any) {
    const out = path.join(this.baseDir, rel);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, JSON.stringify(data, null, 2), 'utf8');
  }

  private async listRuns(): Promise<string[]> {
    try { return (await fs.readdir(this.baseDir)).filter((f) => f.startsWith('run_') && f.endsWith('.json')); } catch { return []; }
  }

  async analyze(task: string): Promise<{ analyzed: AnalyzedTask; suggestions: string[] }> {
    const analyzed = await this.analyzer.analyze(task);
    const suggestions: string[] = [];
    // Proactive advice
    try {
      const adv = await this.advisor.advise();
      suggestions.push(...adv.systemSuggestions);
    } catch {}
    // Requirement-level suggestions
    for (const r of analyzed.requirements) suggestions.push(...(r.optimizations || []));
    return { analyzed, suggestions: Array.from(new Set(suggestions)) };
  }

  async plan(analyzed: AnalyzedTask): Promise<OrchestrationPlan> {
    const agentSpecs = (
      await Promise.all(
        analyzed.requirements.map((r) => this.mapper.map(r.id, r.description, r.capabilities))
      )
    ).flat();
    // batch by simple dependency: requirements with no deps in batch 1, etc.
    const idToDeps = new Map(analyzed.requirements.map((r) => [r.id, new Set(r.dependencies || [])]));
    const remaining = new Set(analyzed.requirements.map((r) => r.id));
    const batches: string[][] = [];
    while (remaining.size) {
      const ready: string[] = [];
      for (const id of Array.from(remaining)) {
        const deps = idToDeps.get(id)!;
        if (Array.from(deps).every((d) => !remaining.has(d))) ready.push(id);
      }
      if (ready.length === 0) { // break circular deps
        ready.push(...Array.from(remaining));
      }
      batches.push(ready);
      ready.forEach((r) => remaining.delete(r));
    }
    const suggestions: string[] = analyzed.notes ? [...analyzed.notes] : [];
    return { task: analyzed, agentSpecs, parallelBatches: batches, suggestions };
  }

  async execute(taskText: string, opts: { dryRun?: boolean } = {}): Promise<OrchestrationResult> {
    const startedAt = new Date().toISOString();
    const { analyzed } = await this.analyze(taskText);
    const plan = await this.plan(analyzed);
    const inputByReq = Object.fromEntries(plan.task.requirements.map((r) => [r.id, r.description]));
    const results = await this.coordinator.execute(plan, inputByReq, { dryRun: opts.dryRun, concurrency: plan.task.requirements.length });
    const success = results.every((r) => r.success);
    const finishedAt = new Date().toISOString();
    const summary = success ? 'All agents completed successfully.' : 'Some agents failed; review errors.';
    const run: OrchestrationResult = { taskId: plan.task.taskId, startedAt, finishedAt, plan, results, success, summary };

    await this.saveJson(`run_${plan.task.taskId}.json`, run);
    await this.learner.updateFromRun(run).catch(() => {});
    return run;
  }

  async optimize(): Promise<string[]> {
    const adv = await this.advisor.advise();
    return adv.systemSuggestions;
  }

  async history(): Promise<{ files: string[]; latest?: OrchestrationResult }> {
    const files = (await this.listRuns()).sort();
    let latest: OrchestrationResult | undefined;
    if (files.length) {
      const txt = await fs.readFile(path.join(this.baseDir, files[files.length - 1]), 'utf8');
      latest = JSON.parse(txt);
    }
    return { files, latest };
  }
}

