import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const projectsDatabaseId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

const seedProjects = [
  { name: 'EUFM EU Funding', status: 'Active', priority: 'P0-Critical', location: 'PROJECTS/EUFM Universal/' },
  { name: 'GeoDataCenter', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/GeoDataCenter/' },
  { name: 'Portal Oradea', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/Portal Oradea/' },
  { name: 'Xillela Fastidiosa', status: 'Active', priority: 'P2-Medium', location: 'PROJECTS/Xillela Fastidiosa/' },
];

async function main() {
  for (const p of seedProjects) {
    await notion.pages.create({
      parent: { database_id: projectsDatabaseId },
      properties: {
        Name: { title: [{ text: { content: p.name } }] },
        Status: { select: { name: p.status } },
        Priority: { select: { name: p.priority } },
        Location: { rich_text: [{ text: { content: p.location } }] },
      },
    });
    console.log('Added project:', p.name);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
