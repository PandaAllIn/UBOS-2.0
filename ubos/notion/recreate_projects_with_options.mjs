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

async function createProjectsWithOptions() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📊 PROJECTS MASTER DATABASE' } }],
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            { name: 'Active', color: 'green' },
            { name: 'Planning', color: 'blue' },
            { name: 'Complete', color: 'purple' },
            { name: 'On Hold', color: 'yellow' },
          ],
        },
      },
      Priority: {
        select: {
          options: [
            { name: 'P0-Critical', color: 'red' },
            { name: 'P1-High', color: 'orange' },
            { name: 'P2-Medium', color: 'blue' },
            { name: 'P3-Low', color: 'gray' },
          ],
        },
      },
      Location: { rich_text: {} },
    },
  });
  return resp.id;
}

async function main() {
  await deleteIfExists();
  const projectsId = await createProjectsWithOptions();
  console.log('Projects DB (options) created:', projectsId);
  const ids = { parentPageId, projectsId, createdAt: new Date().toISOString() };
  await fs.writeFile('notion/last_created_ids.json', JSON.stringify(ids, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

