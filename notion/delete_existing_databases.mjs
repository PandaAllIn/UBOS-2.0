import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

const TARGET_TITLES = [
  '📊 PROJECTS MASTER DATABASE',
  '🤖 AGENTS ACTIVITY DATABASE',
  '💰 EUFM CLIENT PIPELINE DATABASE',
  '🇪🇺 EU FUNDING OPPORTUNITIES DATABASE',
  '🏛️ ORADEA PARTNERSHIPS DATABASE',
];

function isTargetTitle(titleArray) {
  const title = (titleArray?.[0]?.plain_text || '').trim();
  if (!title) return false;
  const lower = title.toLowerCase();
  // Robust contains checks to catch slight variations
  return (
    TARGET_TITLES.includes(title) ||
    lower.includes('projects master database') ||
    lower.includes('agents activity database') ||
    lower.includes('client pipeline database') ||
    lower.includes('funding opportunities database') ||
    lower.includes('oradea partnerships database')
  );
}

async function main() {
  console.log('Scanning parent page for child databases:', parentPageId);
  // List child blocks under the parent page
  const children = await notion.blocks.children.list({ block_id: parentPageId });
  const dbBlocks = children.results.filter((b) => b.type === 'child_database');
  if (dbBlocks.length === 0) {
    console.log('No child databases found under the parent page.');
    return;
  }

  for (const dbBlock of dbBlocks) {
    const id = dbBlock.id;
    try {
      const db = await notion.databases.retrieve({ database_id: id });
      if (!isTargetTitle(db.title)) {
        console.log('Skipping non-target database:', db.title?.[0]?.plain_text || id);
        continue;
      }
      if (db.in_trash) {
        console.log('Already archived (in_trash):', db.title?.[0]?.plain_text || id);
        continue;
      }
      await notion.blocks.delete({ block_id: id });
      console.log('Archived database:', db.title?.[0]?.plain_text || id);
    } catch (err) {
      const msg = err?.body?.message || String(err);
      if (msg.includes("archived")) {
        console.log('Already archived:', id);
      } else if (msg.includes('Could not find')) {
        console.log('Not found (may be moved or deleted):', id);
      } else {
        console.error('Error archiving database', id, msg);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

