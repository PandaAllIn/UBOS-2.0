import { promises as fs } from 'fs';
import path from 'path';
import { ProjectConfig, ProjectConfigSchema, ProjectStatus, ScheduledTask, ScheduledTaskSchema } from './types.js';

export class ProjectRegistry {
  private baseDir = 'logs/mcc';
  private projectsFile = path.join(this.baseDir, 'projects.json');
  private tasksFile = path.join(this.baseDir, 'tasks.json');
  private statusesFile = path.join(this.baseDir, 'statuses.json');

  private async ensureDirs() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private async readJson<T>(file: string, fallback: T): Promise<T> {
    try {
      const txt = await fs.readFile(file, 'utf8');
      return JSON.parse(txt) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(file: string, data: unknown) {
    await this.ensureDirs();
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  }

  async listProjects(): Promise<ProjectConfig[]> {
    const arr = await this.readJson<ProjectConfig[]>(this.projectsFile, []);
    return arr.map((p) => ProjectConfigSchema.parse(p));
  }

  async getProject(id: string): Promise<ProjectConfig | undefined> {
    const list = await this.listProjects();
    return list.find((p) => p.id === id);
  }

  async upsertProject(cfg: ProjectConfig): Promise<void> {
    const list = await this.listProjects();
    const i = list.findIndex((p) => p.id === cfg.id);
    if (i >= 0) list[i] = ProjectConfigSchema.parse(cfg); else list.push(ProjectConfigSchema.parse(cfg));
    await this.writeJson(this.projectsFile, list);
    // ensure status exists
    const s = await this.getStatus(cfg.id);
    if (!s) await this.updateStatus({ id: cfg.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activeTasks: 0, completedTasks: 0, failedTasks: 0, todayCostUSD: 0 });
  }

  async removeProject(id: string): Promise<void> {
    const list = await this.listProjects();
    await this.writeJson(this.projectsFile, list.filter((p) => p.id !== id));
  }

  async getStatus(id: string): Promise<ProjectStatus | undefined> {
    const statuses = await this.readJson<Record<string, ProjectStatus>>(this.statusesFile, {});
    return statuses[id];
  }

  async updateStatus(status: ProjectStatus): Promise<void> {
    const statuses = await this.readJson<Record<string, ProjectStatus>>(this.statusesFile, {});
    statuses[status.id] = { ...status, updatedAt: new Date().toISOString() };
    await this.writeJson(this.statusesFile, statuses);
  }

  async listTasks(projectId?: string): Promise<ScheduledTask[]> {
    const list = await this.readJson<ScheduledTask[]>(this.tasksFile, []);
    const parsed = list.map((t) => ScheduledTaskSchema.parse(t));
    return projectId ? parsed.filter((t) => t.projectId === projectId) : parsed;
  }

  async addTask(task: Omit<ScheduledTask, 'id' | 'createdAt' | 'state' | 'attempts'> & { id?: string }): Promise<ScheduledTask> {
    const list = await this.listTasks();
    const id = task.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rec: ScheduledTask = ScheduledTaskSchema.parse({
      ...task,
      id,
      createdAt: new Date().toISOString(),
      state: 'queued',
      attempts: 0,
    });
    list.push(rec);
    await this.writeJson(this.tasksFile, list);
    return rec;
  }

  async updateTask(task: ScheduledTask): Promise<void> {
    const list = await this.listTasks();
    const i = list.findIndex((t) => t.id === task.id);
    if (i === -1) throw new Error(`Task not found: ${task.id}`);
    list[i] = ScheduledTaskSchema.parse(task);
    await this.writeJson(this.tasksFile, list);
  }

  async nextRunnableTask(now: Date = new Date()): Promise<ScheduledTask | undefined> {
    const list = await this.listTasks();
    const queued = list.filter((t) => t.state === 'queued');
    // notBefore constraint
    const eligible = queued.filter((t) => !t.notBefore || new Date(t.notBefore) <= now);
    // sort by priority (low number = higher priority) then FIFO
    eligible.sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));
    return eligible[0];
  }
}

