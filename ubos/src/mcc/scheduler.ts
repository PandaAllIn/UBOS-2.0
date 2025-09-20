import { ProjectRegistry } from './projectRegistry.js';
import { ResourceManager } from './resourceManager.js';
import { ScheduledTask } from './types.js';
import { StrategicOrchestrator } from '../orchestrator/strategicOrchestrator.js';
import { promises as fs } from 'fs';
import path from 'path';

export interface SchedulerOptions {
  tickMs?: number;
  dryRun?: boolean;
}

export class AutomatedScheduler {
  private running = false;
  private timer?: NodeJS.Timeout;
  private registry = new ProjectRegistry();
  private resources = new ResourceManager();
  private orchestrator = new StrategicOrchestrator();
  private baseDir = 'logs/mcc';

  constructor(private opts: SchedulerOptions = {}) {}

  private async log(evt: Record<string, unknown>) {
    await fs.mkdir(this.baseDir, { recursive: true });
    const file = path.join(this.baseDir, `scheduler_${new Date().toISOString().slice(0, 10)}.log`);
    await fs.appendFile(file, JSON.stringify({ ts: new Date().toISOString(), ...evt }) + '\n', 'utf8');
  }

  private withinWindow(project: { schedule?: { enabled?: boolean, windows?: string[], timezone?: string } }, now: Date): boolean {
    const { schedule } = project;
    if (!schedule?.enabled) return false;
    if (!schedule?.windows?.length) return true;
    // Interpret windows in project timezone as HH:MM-HH:MM
    const fmt = (d: Date) => d.toLocaleTimeString('en-GB', { hour12: false, timeZone: schedule.timezone || 'UTC', hour: '2-digit', minute: '2-digit' });
    const cur = fmt(now);
    return schedule.windows.some((w: string) => {
      const [start, end] = w.split('-');
      return start <= cur && cur <= end;
    });
  }

  private async runTask(task: ScheduledTask, project: { id: string; name: string; description?: string }) {
    const allocated = await this.resources.allocate(task.projectId);
    if (!allocated) return; // Someone else took the slot

    try {
      // Mark task running
      task.state = 'running';
      task.attempts += 1;
      await this.registry.updateTask(task);
      await this.log({ level: 'info', msg: `Running task ${task.id} for ${task.projectId}` });

      // Augment task with project context
      const contextPrefix = project.description ? `Project ${project.name} Context: ${project.description}\n` : `Project ${project.name}\n`;
      const description = contextPrefix + task.description;
      const run = await this.orchestrator.execute(description, { dryRun: this.opts.dryRun });

      // Persist run mapping for traceability
      const mapPath = path.join(this.baseDir, 'runs', `${task.id}.json`);
      await fs.mkdir(path.dirname(mapPath), { recursive: true });
      await fs.writeFile(mapPath, JSON.stringify({ taskId: task.id, projectId: task.projectId, orchestratorRun: `logs/orchestrator/run_${run.taskId}.json` }, null, 2));

      // Mark done
      task.state = run.success ? 'completed' : 'failed';
      task.lastError = run.success ? undefined : run.summary;
      await this.registry.updateTask(task);
      await this.log({ level: run.success ? 'info' : 'error', msg: `Task ${task.id} ${task.state}` });
    } catch (err: unknown) {
      task.state = task.attempts < task.maxAttempts ? 'queued' : 'failed';
      task.lastError = (err as Error)?.message || String(err);
      // backoff: notBefore in 10 minutes for retry
      if (task.state === 'queued') {
        const t = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        task.notBefore = t;
      }
      await this.registry.updateTask(task);
      await this.log({ level: 'error', msg: `Task ${task.id} failed`, error: task.lastError });
    } finally {
      await this.resources.release(task.projectId);
    }
  }

  private async tick() {
    if (!this.running) return;
    try {
      const now = new Date();
      const projects = await this.registry.listProjects();

      // configure per-project limits
      for (const p of projects) this.resources.configureProject(p.id, p.maxConcurrency || 1);

      // fetch next eligible task by project scheduling windows and global resources
      const next = await this.registry.nextRunnableTask(now);
      if (!next) return;
      const project = projects.find((p) => p.id === next.projectId);
      if (!project) return;
      if (!this.withinWindow(project, now)) return;
      if (!this.resources.canRun(project.id)) return;

      // Fire and forget; allow parallelism up to resource limits
      void this.runTask(next, project);
    } catch (e: unknown) {
      await this.log({ level: 'error', msg: 'Scheduler tick error', error: (e as Error)?.message || String(e) });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    const interval = Math.max(1000, this.opts.tickMs ?? 5000);
    this.timer = setInterval(() => this.tick(), interval);
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
  }
}
