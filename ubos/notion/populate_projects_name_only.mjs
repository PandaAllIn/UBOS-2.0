import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const projectsDatabaseId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

const seedProjects = [
  { name: 'EUFM EU Funding' },
  { name: 'GeoDataCenter' },
  { name: 'Portal Oradea' },
  { name: 'Xillela Fastidiosa' },
];

async function main() {
  for (const p of seedProjects) {
    await notion.pages.create({
      parent: { database_id: projectsDatabaseId },
      properties: {
        Name: { title: [{ text: { content: p.name } }] },
      },
    });
    console.log('Added project (name only):', p.name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

