import { getDb } from './db.js';

export async function recordRequest(opts: { id: string; tenantId: string; provider?: string; model?: string; latencyMs?: number; inputTokens?: number; outputTokens?: number; costUsd?: number }) {
  const db = await getDb();
  await db.run(`INSERT OR REPLACE INTO requests(id, tenant_id, provider, model, status, latency_ms, input_token_count, output_token_count, cost_usd, created_at)
                VALUES(?,?,?,?, 'completed', ?, ?, ?, ?, datetime('now'))`,
    opts.id, opts.tenantId, opts.provider ?? null, opts.model ?? null, opts.latencyMs ?? null, opts.inputTokens ?? null, opts.outputTokens ?? null, opts.costUsd ?? null);
}

export async function usageAggregate(tenantId: string, from?: string, to?: string, unit: 'requests'|'tokens'|'cost_usd' = 'requests') {
  const db = await getDb();
  const where: string[] = ['tenant_id = ?'];
  const params: any[] = [tenantId];
  if (from) { where.push('created_at >= ?'); params.push(from); }
  if (to) { where.push('created_at <= ?'); params.push(to); }
  let select = 'COUNT(*) as value';
  if (unit === 'tokens') select = 'COALESCE(SUM(input_token_count + output_token_count),0) as value';
  if (unit === 'cost_usd') select = 'COALESCE(SUM(cost_usd),0) as value';
  const row = await db.get(`SELECT ${select} FROM requests WHERE ${where.join(' AND ')}`, ...params);
  return { unit, value: row?.value ?? 0 };
}


