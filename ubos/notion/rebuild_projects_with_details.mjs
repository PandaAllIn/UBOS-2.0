import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

const seedProjects = [
  { name: 'EUFM EU Funding', status: 'Active', priority: 'P0-Critical', location: 'PROJECTS/EUFM Universal/' },
  { name: 'GeoDataCenter', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/GeoDataCenter/' },
  { name: 'Portal Oradea', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/Portal Oradea/' },
  { name: 'Xillela Fastidiosa', status: 'Active', priority: 'P2-Medium', location: 'PROJECTS/Xillela Fastidiosa/' },
];

async function archiveExistingDatabases() {
  const children = await notion.blocks.children.list({ block_id: parentPageId });
  for (const b of children.results) {
    if (b.type !== 'child_database') continue;
    const id = b.id;
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      const title = db.title?.[0]?.plain_text || '';
      const t = title.toLowerCase();
      if (t.includes('projects master database') || t.includes('project details')) {
        if (!db.in_trash) {
          await notion.blocks.delete({ block_id: id });
          console.log('Archived old DB:', title || id);
        }
      }
    } catch {}
  }
}

async function createProjectsDB() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📊 PROJECTS MASTER DATABASE' } }],
    properties: { Name: { title: {} } },
  });
  return resp.id;
}

async function createProjectDetailsDB(projectsDbId) {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📋 PROJECT DETAILS' } }],
    properties: {
      Name: { title: {} },
      Project: { relation: { database_id: projectsDbId } },
      Status: { select: { options: [
        { name: 'Active', color: 'green' },
        { name: 'Planning', color: 'blue' },
        { name: 'Complete', color: 'purple' },
        { name: 'On Hold', color: 'yellow' },
      ] } },
      Priority: { select: { options: [
        { name: 'P0-Critical', color: 'red' },
        { name: 'P1-High', color: 'orange' },
        { name: 'P2-Medium', color: 'blue' },
        { name: 'P3-Low', color: 'gray' },
      ] } },
      Location: { rich_text: {} },
    },
  });
  return resp.id;
}

async function main() {
  await archiveExistingDatabases();
  const projectsId = await createProjectsDB();
  console.log('Projects DB:', projectsId);
  const detailsId = await createProjectDetailsDB(projectsId);
  console.log('Project Details DB:', detailsId);

  for (const p of seedProjects) {
    const page = await notion.pages.create({
      parent: { database_id: projectsId },
      properties: { Name: { title: [{ text: { content: p.name } }] } },
    });
    await notion.pages.create({
      parent: { database_id: detailsId },
      properties: {
        Name: { title: [{ text: { content: p.name } }] },
        Project: { relation: [{ id: page.id }] },
        Status: { select: { name: p.status } },
        Priority: { select: { name: p.priority } },
        Location: { rich_text: [{ text: { content: p.location } }] },
      },
    });
    console.log('Seeded:', p.name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

