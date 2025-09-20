import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | undefined;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({ filename: process.env.SQLITE_PATH || ':memory:', driver: sqlite3.Database });
    const db = await dbPromise;
    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        key_prefix TEXT PRIMARY KEY,
        key_hash TEXT NOT NULL,
        tenant_id TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        name TEXT NOT NULL,
        UNIQUE(tenant_id, name)
      );
      CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        user_id TEXT,
        role_id TEXT
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        workflow_id TEXT,
        agent_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS task_executions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'running'
      );
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        provider TEXT,
        model TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        latency_ms INTEGER,
        input_token_count INTEGER,
        output_token_count INTEGER,
        cost_usd REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS usage_aggregates (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        period_start TEXT NOT NULL,
        period_end TEXT NOT NULL,
        unit TEXT NOT NULL,
        value REAL NOT NULL,
        cost_usd REAL NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS rate_limits (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        window_seconds INTEGER NOT NULL,
        max_requests INTEGER,
        max_tokens INTEGER
      );
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        monthly_usd REAL NOT NULL,
        hard_stop INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        condition TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        status TEXT NOT NULL,
        url TEXT,
        response_code INTEGER,
        error_message TEXT,
        sent_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        definition TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tier TEXT CHECK(tier IN ('community', 'pro', 'enterprise')) NOT NULL,
        status TEXT CHECK(status IN ('active', 'cancelled', 'past_due')) NOT NULL,
        monthly_usage_limit INTEGER,
        current_usage INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT
      );
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_type TEXT,
        cost_eur REAL,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return dbPromise;
}

export async function upsertApiKey(prefix: string, hash: string, tenantId: string) {
  const db = await getDb();
  await db.run(`INSERT INTO api_keys(key_prefix, key_hash, tenant_id) VALUES(?,?,?)
                ON CONFLICT(key_prefix) DO UPDATE SET key_hash=excluded.key_hash, tenant_id=excluded.tenant_id`,
    prefix, hash, tenantId);
}

export async function findApiKey(prefix: string, hash: string, tenantId?: string) {
  const db = await getDb();
  return db.get(`SELECT * FROM api_keys WHERE key_prefix=? AND key_hash=? AND (? IS NULL OR tenant_id=?)`, prefix, hash, tenantId ?? null, tenantId ?? null);
}

export async function createTask(id: string, tenantId: string, status: string = 'queued') {
  const db = await getDb();
  await db.run(`INSERT INTO tasks(id, tenant_id, status) VALUES(?,?,?)`, id, tenantId, status);
}

export async function getTask(id: string) {
  const db = await getDb();
  return db.get(`SELECT * FROM tasks WHERE id=?`, id);
}

export async function createUsageEvent(userId: string, serviceType: string, costEur: number, metadata: any) {
  const db = await getDb();
  const metadataJson = JSON.stringify(metadata);
  await db.run(
    `INSERT INTO usage_events(id, user_id, service_type, cost_eur, metadata) VALUES(?, ?, ?, ?, ?)`,
    `evt_${Date.now()}`, userId, serviceType, costEur, metadataJson
  );
}


