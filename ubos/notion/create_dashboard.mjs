import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

const SECTION_TITLES = [
  '📊 Projects',
  '🤖 Agents Activity',
  '💰 Client Pipeline',
  '🇪🇺 EU Funding Opportunities',
  '🏛️ Oradea Partnerships',
];

const DB_TITLE_KEYWORDS = [
  'projects master database',
  'agents activity database',
  'client pipeline database',
  'funding opportunities database',
  'oradea partnerships database',
];

function normalize(s) { return (s || '').toLowerCase(); }

async function discoverChildren() {
  const sections = [];
  const databases = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({ block_id: parentPageId, start_cursor: cursor });
    for (const b of res.results) {
      if (b.type === 'child_page') {
        const title = b.child_page?.title || '';
        if (SECTION_TITLES.some(t => normalize(title) === normalize(t))) {
          sections.push({ id: b.id, title });
        }
      } else if (b.type === 'child_database') {
        try {
          const db = await notion.databases.retrieve({ database_id: b.id });
          const title = db.title?.[0]?.plain_text || '';
          const n = normalize(title);
          if (DB_TITLE_KEYWORDS.some(k => n.includes(k))) {
            databases.push({ id: db.id, title });
          }
        } catch {}
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return { sections, databases };
}

function linkToPageBlock(id) {
  return { object: 'block', link_to_page: { page_id: id } };
}

function linkToDatabaseBlock(id) {
  return { object: 'block', link_to_page: { database_id: id } };
}

async function main() {
  const { sections, databases } = await discoverChildren();

  const dashboard = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: 'EUFM Dashboard' } }] } },
  });

  const children = [];
  children.push({ object: 'block', heading_1: { rich_text: [{ type: 'text', text: { content: 'Sections' } }] } });
  for (const s of sections) {
    children.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: s.title, link: { url: `https://www.notion.so/${s.id.replace(/-/g,'')}` } } }] } });
  }

  children.push({ object: 'block', divider: {} });
  children.push({ object: 'block', heading_1: { rich_text: [{ type: 'text', text: { content: 'Databases' } }] } });
  for (const d of databases) {
    children.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: d.title, link: { url: `https://www.notion.so/${d.id.replace(/-/g,'')}` } } }] } });
  }

  await notion.blocks.children.append({ block_id: dashboard.id, children });
  console.log('Dashboard created:', dashboard.id);
}

main().catch((e) => { console.error(e); process.exit(1); });

