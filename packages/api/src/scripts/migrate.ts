import { getDb } from '../lib/db.js';

async function main() {
  const db = await getDb();
  await db.exec(`
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
  `);
  console.log('✅ Migration complete');
}

main().catch((e) => { console.error('❌ Migration failed:', e); process.exit(1); });


