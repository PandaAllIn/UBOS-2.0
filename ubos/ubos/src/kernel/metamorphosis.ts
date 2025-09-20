import * as fs from 'fs';
import * as path from 'path';
import { UBOSKernel } from './kernel';

async function isProposalApproved(titleIncludes: string): Promise<boolean> {
  try {
    const p = path.join(process.cwd(), 'memory', 'governance.json');
    const buf = await fs.promises.readFile(p, 'utf8');
    const data = JSON.parse(buf) as { proposals?: Array<{ id: string; title: string; status: string }> };
    return !!data.proposals?.some((pr) => pr.status === 'approved' && pr.title.toLowerCase().includes(titleIncludes.toLowerCase()));
  } catch {
    return false;
  }
}

export class MetamorphosisWatcher {
  private watcher?: fs.FSWatcher;
  private debounceTimer?: NodeJS.Timeout;

  constructor(private kernel: UBOSKernel, private specsDir = path.join(process.cwd(), 'specs', 'territories')) {}

  async start(): Promise<void> {
    const approved = await isProposalApproved('Metamorphosis Watcher');
    if (!approved) {
      console.warn('⚠️ Metamorphosis Watcher running without approved governance (development mode).');
    }
    try {
      await fs.promises.mkdir(this.specsDir, { recursive: true });
    } catch {}
    this.watcher = fs.watch(this.specsDir, { recursive: false }, () => this.scheduleReload());
    console.log(`👁️  Metamorphosis watching: ${this.specsDir}`);
  }

  private scheduleReload() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.reload().catch((e) => console.error('Reload failed:', e)), 250);
  }

  async reload(): Promise<void> {
    await this.kernel.reloadTerritories();
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}