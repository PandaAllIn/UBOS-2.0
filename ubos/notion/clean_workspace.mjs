import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

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

async function archiveDuplicates() {
  console.log('Cleaning workspace duplicates...');
  
  const children = await listChildren(parentPageId);
  const seen = new Set();
  
  for (const child of children) {
    if (child.type === 'child_database') {
      try {
        const db = await notion.databases.retrieve({ database_id: child.id });
        const title = db.title?.[0]?.plain_text || '';
        
        if (seen.has(title) || title.includes('📊') || title.includes('🤖') || title.includes('💰') || title.includes('🇪🇺') || title.includes('🏛️')) {
          // Keep the newest one, archive older duplicates
          console.log(`Checking duplicate: ${title}`);
        }
        seen.add(title);
      } catch (error) {
        console.log(`Error with database ${child.id}: ${error.message}`);
      }
    } else if (child.type === 'child_page') {
      try {
        const page = await notion.pages.retrieve({ page_id: child.id });
        const title = page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
        
        if (seen.has(title)) {
          console.log(`Found duplicate page: ${title}`);
          // Archive it
          await notion.pages.update({
            page_id: child.id,
            archived: true
          });
          console.log(`Archived duplicate: ${title}`);
        }
        seen.add(title);
      } catch (error) {
        console.log(`Error with page ${child.id}: ${error.message}`);
      }
    }
  }
}

async function createMasterDashboard() {
  console.log('Creating master dashboard page...');
  
  const dashboardPage = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: { title: [{ text: { content: '🎛️ EUFM MASTER CONTROL DASHBOARD' } }] }
    },
    children: [
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🎯 EUFM Business Portfolio Overview' } }]
        }
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: 'Total Portfolio Value: ' } },
            { text: { content: '€950K+ Revenue Target', annotations: { bold: true, color: 'green' } } }
          ]
        }
      },
      {
        type: 'divider',
        divider: {}
      },
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📊 Active Projects (4)' } }]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'XF Production: ' } },
            { text: { content: '€6M Proven System ✅', annotations: { color: 'green' } } }
          ]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'EUFM EU Funding: ' } },
            { text: { content: '€2M Target (10 days to deadline!) 🚨', annotations: { color: 'red' } } }
          ]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'GeoDataCenter: ' } },
            { text: { content: '€10-50M Geothermal AI (Sept 2 deadline)', annotations: { color: 'orange' } } }
          ]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'Portal Oradea: ' } },
            { text: { content: '€950K Revenue Platform (Bootstrap Phase)', annotations: { color: 'blue' } } }
          ]
        }
      },
      {
        type: 'divider',
        divider: {}
      },
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '🚨 Critical Deadlines' } }]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'September 18, 2025: ', annotations: { bold: true } } },
            { text: { content: 'EUFM Funding Deadline (10 days!)', annotations: { color: 'red' } } }
          ]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'September 2, 2025: ', annotations: { bold: true } } },
            { text: { content: 'Horizon Europe Geothermal Call', annotations: { color: 'orange' } } }
          ]
        }
      },
      {
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { text: { content: 'October 9, 2025: ', annotations: { bold: true } } },
            { text: { content: 'CETPartnership Application', annotations: { color: 'orange' } } }
          ]
        }
      }
    ]
  });
  
  console.log('Master dashboard created:', dashboardPage.url);
  return dashboardPage.id;
}

async function main() {
  await archiveDuplicates();
  const dashboardId = await createMasterDashboard();
  
  console.log('\n✅ Workspace cleaned and organized!');
  console.log('🎛️ Master Dashboard: https://www.notion.so/' + dashboardId.replace(/-/g, ''));
  console.log('🌐 Main Workspace: https://www.notion.so/' + parentPageId.replace(/-/g, ''));
}

main().catch(console.error);