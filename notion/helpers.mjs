import 'dotenv/config';
import { Client } from '@notionhq/client';

export function getEnvOrThrow(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val.trim();
}

export function getNotionClient() {
  const token = getEnvOrThrow('NOTION_TOKEN');
  // Temporarily omit explicit version to maximize compatibility for create
  return new Client({ auth: token });
}

export async function getDatabasePropertiesMap(notion, database_id) {
  const db = await notion.databases.retrieve({ database_id });
  // Return mapping: { propName: { id, type } }
  return Object.fromEntries(
    Object.entries(db.properties).map(([name, def]) => [name, { id: def.id, type: def.type }])
  );
}
