import type { AgentResult } from '../orchestrator/types.js';

export class ResultAggregator {
  private results: AgentResult[] = [];

  add(result: AgentResult) {
    this.results.push(result);
  }

  getAll(): AgentResult[] {
    return [...this.results];
  }

  success(): boolean {
    return this.results.length > 0 && this.results.every((r) => r.success);
  }

  summary(): string {
    if (this.results.length === 0) return 'No results.';
    const ok = this.results.filter((r) => r.success).length;
    const fail = this.results.length - ok;
    const lines = [
      `Results: ${ok} success, ${fail} failure(s).`,
      ...this.results.map((r) => `- [${r.success ? 'OK' : 'ERR'}] ${r.agentId}/${r.requirementId}: ${truncate(r.output || r.error || '', 140)}`),
    ];
    return lines.join('\n');
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

