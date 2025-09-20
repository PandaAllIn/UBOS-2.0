import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const projectsDbId = '067267f9-1248-43b1-8406-78115a4da7e0';

async function main() {
  console.log('Populating projects with minimal data...');
  
  const projects = [
    {
      Name: { title: [{ text: { content: 'XF Production' } }] }
    },
    {
      Name: { title: [{ text: { content: 'EUFM EU Funding' } }] }
    },
    {
      Name: { title: [{ text: { content: 'GeoDataCenter' } }] }
    },
    {
      Name: { title: [{ text: { content: 'Portal Oradea' } }] }
    }
  ];

  for (const project of projects) {
    try {
      const page = await notion.pages.create({
        parent: { database_id: projectsDbId },
        properties: project
      });
      console.log(`Created: ${project.Name.title[0].text.content}`);
    } catch (error) {
      console.error(`Failed to create ${project.Name.title[0].text.content}:`, error.message);
    }
  }
}

main().catch(console.error);