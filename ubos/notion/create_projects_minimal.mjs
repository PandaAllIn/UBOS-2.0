import { getEnvOrThrow, getNotionClient } from './helpers.mjs';
import fs from 'node:fs/promises';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

async function main() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📊 PROJECTS MASTER DATABASE' } }],
    properties: { Name: { title: {} } },
  });
  console.log('Projects DB (minimal) created:', resp.id);
  await fs.writeFile('notion/last_created_ids.json', JSON.stringify({
    parentPageId,
    projectsId: resp.id,
    createdAt: new Date().toISOString(),
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

