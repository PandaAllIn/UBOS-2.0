import { getEnvOrThrow, getNotionClient } from './helpers.mjs';
import fs from 'node:fs/promises';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');
const existingProjectsId = process.env.NOTION_PROJECTS_DB_ID;

async function deleteIfExists() {
  if (!existingProjectsId) return;
  try {
    await notion.blocks.delete({ block_id: existingProjectsId });
    console.log('Archived previous Projects DB:', existingProjectsId);
  } catch (e) {
    console.log('Skip delete (likely already archived):', existingProjectsId);
  }
}

async function createBasicProjects() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📊 PROJECTS MASTER DATABASE' } }],
    properties: {
      Name: { title: {} },
      Status: { select: {} },
      Priority: { select: {} },
      Location: { rich_text: {} },
    },
  });
  return resp.id;
}

async function main() {
  await deleteIfExists();
  const projectsId = await createBasicProjects();
  console.log('Projects DB (basic) created:', projectsId);
  const ids = { parentPageId, projectsId, createdAt: new Date().toISOString() };
  await fs.writeFile('notion/last_created_ids.json', JSON.stringify(ids, null, 2));
  console.log('Wrote notion/last_created_ids.json');
}

main().catch((e) => { console.error(e); process.exit(1); });

