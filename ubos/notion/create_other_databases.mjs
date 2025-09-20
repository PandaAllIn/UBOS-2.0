import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');
const projectsDbId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

async function createAgentsActivity() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '🤖 AGENTS ACTIVITY DATABASE' } }],
    properties: {
      'Agent Name': { title: {} },
      Project: { relation: { database_id: projectsDbId } },
    },
  });
  console.log('Agents Activity DB:', resp.id);
}

async function createClientPipeline() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '💰 EUFM CLIENT PIPELINE DATABASE' } }],
    properties: {
      'Client Name': { title: {} },
    },
  });
  console.log('Client Pipeline DB:', resp.id);
}

async function createFundingOpportunities() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '🇪🇺 EU FUNDING OPPORTUNITIES DATABASE' } }],
    properties: {
      'Program Name': { title: {} },
      'Target Projects': { relation: { database_id: projectsDbId } },
    },
  });
  console.log('Funding Opportunities DB:', resp.id);
}

async function createPartnerships() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '🏛️ ORADEA PARTNERSHIPS DATABASE' } }],
    properties: {
      'Contact Name': { title: {} },
    },
  });
  console.log('Partnerships DB:', resp.id);
}

async function main() {
  await createAgentsActivity();
  await createClientPipeline();
  await createFundingOpportunities();
  await createPartnerships();
}

main().catch((e) => { console.error(e); process.exit(1); });

