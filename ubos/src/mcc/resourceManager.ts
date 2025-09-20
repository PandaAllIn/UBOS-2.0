import { promises as fs } from 'fs';
import path from 'path';

interface ResourceSnapshot {
  timestamp: string;
  totalConcurrency: number;
  usedConcurrency: number;
  perProject: Record<string, { active: number; max: number }>;
  // Soft accounting for daily spend; can be updated by analytics elsewhere
  todayCostUSD: number;
  dailyBudgetUSD: number;
}

export class ResourceManager {
  private baseDir = 'logs/mcc';
  private stateFile = path.join(this.baseDir, 'resources.json');
  private totalConcurrency = Math.max(2, parseInt(process.env.MCC_MAX_CONCURRENCY || '4', 10));
  private dailyBudgetUSD = Math.max(0, parseFloat(process.env.MCC_DAILY_BUDGET_USD || '0'));
  private usedConcurrency = 0;
  private perProject = new Map<string, { active: number; max: number }>();

  private async persist() {
    await fs.mkdir(this.baseDir, { recursive: true });
    const snap: ResourceSnapshot = {
      timestamp: new Date().toISOString(),
      totalConcurrency: this.totalConcurrency,
      usedConcurrency: this.usedConcurrency,
      perProject: Object.fromEntries(this.perProject.entries()),
      todayCostUSD: 0,
      dailyBudgetUSD: this.dailyBudgetUSD,
    };
    await fs.writeFile(this.stateFile, JSON.stringify(snap, null, 2), 'utf8');
  }

  configureProject(projectId: string, maxConcurrency: number) {
    const cur = this.perProject.get(projectId) || { active: 0, max: Math.max(1, Math.min(8, maxConcurrency)) };
    cur.max = Math.max(1, Math.min(8, maxConcurrency));
    this.perProject.set(projectId, cur);
  }

  canRun(projectId: string): boolean {
    const proj = this.perProject.get(projectId) || { active: 0, max: 1 };
    if (this.usedConcurrency >= this.totalConcurrency) return false;
    if (proj.active >= proj.max) return false;
    return true;
  }

  async allocate(projectId: string): Promise<boolean> {
    if (!this.canRun(projectId)) return false;
    this.usedConcurrency += 1;
    const proj = this.perProject.get(projectId) || { active: 0, max: 1 };
    proj.active += 1;
    this.perProject.set(projectId, proj);
    await this.persist();
    return true;
  }

  async release(projectId: string): Promise<void> {
    this.usedConcurrency = Math.max(0, this.usedConcurrency - 1);
    const proj = this.perProject.get(projectId) || { active: 0, max: 1 };
    proj.active = Math.max(0, proj.active - 1);
    this.perProject.set(projectId, proj);
    await this.persist();
  }
}

