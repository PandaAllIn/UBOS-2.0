import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

async function main() {
  const resp = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: 'API Test Page' } }] } },
  });
  console.log('Created page:', resp.id);
}

main().catch((e) => { console.error(e); process.exit(1); });

