import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

const seedProjects = [
  { name: 'EUFM EU Funding', status: 'Active', priority: 'P0-Critical', location: 'PROJECTS/EUFM Universal/' },
  { name: 'GeoDataCenter', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/GeoDataCenter/' },
  { name: 'Portal Oradea', status: 'Planning', priority: 'P1-High', location: 'PROJECTS/Portal Oradea/' },
  { name: 'Xillela Fastidiosa', status: 'Active', priority: 'P2-Medium', location: 'PROJECTS/Xillela Fastidiosa/' },
];

async function createSectionPage(title) {
  const page = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: { title: { title: [{ text: { content: title } }] } },
  });
  return page.id;
}

function projectTemplateBlocks(p) {
  return [
    { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Overview' } }] } },
    { object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'Project summary and goals.' } }] } },
    { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Key Fields' } }] } },
    { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Status: ${p.status}` } }] } },
    { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Priority: ${p.priority}` } }] } },
    { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Location: ${p.location}` } }] } },
    { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Deadlines' } }] } },
    { object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'Next deadline: TBD' } }] } },
    { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Notes' } }] } },
    { object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: '' } }] } },
  ];
}

async function createProjectPages(projectsSectionId) {
  for (const p of seedProjects) {
    const page = await notion.pages.create({
      parent: { page_id: projectsSectionId },
      properties: { title: { title: [{ text: { content: p.name } }] } },
    });
    await notion.blocks.children.append({
      block_id: page.id,
      children: projectTemplateBlocks(p),
    });
    console.log('Project page created:', p.name);
  }
}

async function main() {
  const projectsId = await createSectionPage('📊 Projects');
  const agentsId = await createSectionPage('🤖 Agents Activity');
  const clientsId = await createSectionPage('💰 Client Pipeline');
  const fundingId = await createSectionPage('🇪🇺 EU Funding Opportunities');
  const partnershipsId = await createSectionPage('🏛️ Oradea Partnerships');
  console.log('Sections created:', { projectsId, agentsId, clientsId, fundingId, partnershipsId });
  await createProjectPages(projectsId);
}

main().catch((e) => { console.error(e); process.exit(1); });

