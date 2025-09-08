import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const databaseId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

async function main() {
  const db = await notion.databases.retrieve({ database_id: databaseId });
  console.log('Database title:', db.title?.[0]?.plain_text || '(untitled)');
  console.log('Database id:', db.id);
  if (!db.properties) {
    console.log('No properties field found. Full object follows for debugging:');
    console.log(JSON.stringify(db, null, 2));
    return;
  }
  console.log('Properties:');
  for (const [name, def] of Object.entries(db.properties)) {
    console.log(`- ${name} (${def.type}) -> id=${def.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
