import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const databaseId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

const desired = {
  'EUFM EU Funding': { status: 'Active', priority: 'P0-Critical', location: 'PROJECTS/EUFM Universal/' },
  'GeoDataCenter': { status: 'Planning', priority: 'P1-High', location: 'PROJECTS/GeoDataCenter/' },
  'Portal Oradea': { status: 'Planning', priority: 'P1-High', location: 'PROJECTS/Portal Oradea/' },
  'Xillela Fastidiosa': { status: 'Active', priority: 'P2-Medium', location: 'PROJECTS/Xillela Fastidiosa/' },
};

async function getAllPages() {
  const pages = [];
  let cursor;
  do {
    const resp = await notion.databases.query({ database_id: databaseId, start_cursor: cursor });
    pages.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function getTitle(page) {
  const t = page.properties?.Name?.title?.[0]?.plain_text || '';
  return t.trim();
}

async function main() {
  const pages = await getAllPages();
  for (const page of pages) {
    const name = getTitle(page);
    const d = desired[name];
    if (!d) continue;
    await notion.pages.update({
      page_id: page.id,
      properties: {
        Status: { select: { name: d.status } },
        Priority: { select: { name: d.priority } },
        Location: { rich_text: [{ text: { content: d.location } }] },
      },
    });
    console.log('Updated:', name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

