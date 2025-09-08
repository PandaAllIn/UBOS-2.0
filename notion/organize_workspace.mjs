import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

const DATA_PAGE_TITLE = 'Data';
const VIEWS_PAGE_TITLE = 'Views';

const DB_KEYWORDS = [
  'projects master database',
  'agents activity database',
  'client pipeline database',
  'funding opportunities database',
  'oradea partnerships database',
];

function norm(s) { return (s || '').toLowerCase(); }

async function listChildren(blockId) {
  const results = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({ block_id: blockId, start_cursor: cursor });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function ensurePage(title) {
  const children = await listChildren(parentPageId);
  const existing = children.find((b) => b.type === 'child_page' && b.child_page?.title === title);
  if (existing) return existing.id;
  const page = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: title } }] } },
  });
  return page.id;
}

async function discoverDatabases() {
  const children = await listChildren(parentPageId);
  const dbs = [];
  for (const b of children) {
    if (b.type !== 'child_database') continue;
    try {
      const db = await notion.databases.retrieve({ database_id: b.id });
      const title = db.title?.[0]?.plain_text || '';
      if (DB_KEYWORDS.some((k) => norm(title).includes(k))) {
        dbs.push({ id: db.id, title });
      }
    } catch {}
  }
  return dbs;
}

function linkTo(id, title) {
  return {
    object: 'block',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: title, link: { url: `https://www.notion.so/${id.replace(/-/g, '')}` } } },
      ],
    },
  };
}

async function buildDataPage(dataPageId, databases) {
  const children = [
    { object: 'block', heading_1: { rich_text: [{ type: 'text', text: { content: 'Databases' } }] } },
  ];
  for (const d of databases) children.push(linkTo(d.id, d.title));
  await notion.blocks.children.append({ block_id: dataPageId, children });
}

async function buildViewsPage(viewsPageId, databases) {
  const projectsDb = databases.find((d) => norm(d.title).includes('projects master database'));
  const fundingDb = databases.find((d) => norm(d.title).includes('funding opportunities database'));
  const clientsDb = databases.find((d) => norm(d.title).includes('client pipeline database'));

  const children = [];
  children.push({ object: 'block', heading_1: { rich_text: [{ type: 'text', text: { content: 'Quick Views (manual filters)' } }] } });
  children.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'Open a database link below and apply suggested filters/sorts in the UI. Saved views creation is not yet available via API.' } }] } });

  if (projectsDb) {
    children.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Projects' } }] } });
    children.push(linkTo(projectsDb.id, 'Projects by Status (Board: Group by Status)'));
    children.push(linkTo(projectsDb.id, 'Projects by Priority (List: Sort by Priority)'));
    children.push(linkTo(projectsDb.id, 'Projects Deadlines (Calendar: Next Deadline)'));
  }
  if (fundingDb) {
    children.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Funding Opportunities' } }] } });
    children.push(linkTo(fundingDb.id, 'Funding by Deadline (Calendar: Application Deadline)'));
    children.push(linkTo(fundingDb.id, 'Funding by Status (Board: Status)'));
  }
  if (clientsDb) {
    children.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Client Pipeline' } }] } });
    children.push(linkTo(clientsDb.id, 'Clients by Probability (Board: Probability)'));
  }

  await notion.blocks.children.append({ block_id: viewsPageId, children });
}

async function main() {
  const dataPageId = await ensurePage(DATA_PAGE_TITLE);
  const viewsPageId = await ensurePage(VIEWS_PAGE_TITLE);
  const databases = await discoverDatabases();
  await buildDataPage(dataPageId, databases);
  await buildViewsPage(viewsPageId, databases);
  console.log('Organized workspace. Data page:', dataPageId, 'Views page:', viewsPageId);
}

main().catch((e) => { console.error(e); process.exit(1); });

