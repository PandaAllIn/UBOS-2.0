import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();

// Database IDs from last_created_ids.json
const dbIds = {
  projects: '067267f9-1248-43b1-8406-78115a4da7e0',
  agents: '23e19fee-0dc1-4962-949b-de9430ad62ab', 
  clients: '29c02fe4-b4d4-4cb2-9dd8-3d1038fb3739',
  funding: 'feede14d-c41c-42e9-90b7-d0c0a2047685',
  partnerships: 'a11a92f8-298f-4be0-a314-fbdc82d50aa7'
};

async function populateAgents() {
  console.log('Populating Agent Activity...');
  const agents = [
    'AgentSummoner', 'Enhanced Abacus', 'Codex CLI', 'Jules', 
    'OradeaBusinessAgent', 'EUFundingProposal', 'CountryCodeValidator', 'SessionMemoryUpdater'
  ];
  
  for (const agent of agents) {
    try {
      await notion.pages.create({
        parent: { database_id: dbIds.agents },
        properties: {
          Name: { title: [{ text: { content: `${agent} - System Operational` } }] }
        }
      });
      console.log(`Created agent: ${agent}`);
    } catch (error) {
      console.error(`Failed agent ${agent}:`, error.message);
    }
  }
}

async function populateClients() {
  console.log('Populating EUFM Clients...');
  const clients = [
    'Romanian Manufacturing SME #1',
    'University of Oradea Research',
    'Bihor County Municipality',
    'Eurostars Program Participant',
    'Innovation Fund Prospect'
  ];
  
  for (const client of clients) {
    try {
      await notion.pages.create({
        parent: { database_id: dbIds.clients },
        properties: {
          Name: { title: [{ text: { content: client } }] }
        }
      });
      console.log(`Created client: ${client}`);
    } catch (error) {
      console.error(`Failed client ${client}:`, error.message);
    }
  }
}

async function populateFunding() {
  console.log('Populating EU Funding Opportunities...');
  const opportunities = [
    'Horizon Europe - Geothermal Resources (Sept 2, 2025)',
    'CETPartnership - Geothermal Energy (Oct 9, 2025)', 
    'EUFM Funding Deadline (Sept 18, 2025)',
    'Innovation Fund - Large Scale Demo',
    'ERDF - Regional Digital Transformation'
  ];
  
  for (const opp of opportunities) {
    try {
      await notion.pages.create({
        parent: { database_id: dbIds.funding },
        properties: {
          Name: { title: [{ text: { content: opp } }] }
        }
      });
      console.log(`Created funding: ${opp}`);
    } catch (error) {
      console.error(`Failed funding ${opp}:`, error.message);
    }
  }
}

async function populatePartnerships() {
  console.log('Populating Oradea Partnerships...');
  const contacts = [
    'Mihai Jurca - City Manager',
    'Prof. Teodor Maghiar - University Rector',
    'Chamber of Commerce Bihor',
    'Oradea Tech Hub - Community Manager',
    'Work+ Offices - Coworking Space'
  ];
  
  for (const contact of contacts) {
    try {
      await notion.pages.create({
        parent: { database_id: dbIds.partnerships },
        properties: {
          Name: { title: [{ text: { content: contact } }] }
        }
      });
      console.log(`Created partnership: ${contact}`);
    } catch (error) {
      console.error(`Failed partnership ${contact}:`, error.message);
    }
  }
}

async function main() {
  console.log('Populating all databases with basic data...');
  
  await populateAgents();
  await populateClients(); 
  await populateFunding();
  await populatePartnerships();
  
  console.log('\n✅ All databases populated! Check your Notion workspace.');
  console.log('🌐 Workspace URL: https://www.notion.so/267a1564b45e8013aa58e1c722bb1ce8');
}

main().catch(console.error);