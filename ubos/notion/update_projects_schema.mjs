import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const databaseId = getEnvOrThrow('NOTION_PROJECTS_DB_ID');

async function main() {
  const properties = {
    Status: {
      select: {
        options: [
          { name: 'Active', color: 'green' },
          { name: 'Planning', color: 'blue' },
          { name: 'Complete', color: 'purple' },
          { name: 'On Hold', color: 'yellow' },
        ],
      },
    },
    Priority: {
      select: {
        options: [
          { name: 'P0-Critical', color: 'red' },
          { name: 'P1-High', color: 'orange' },
          { name: 'P2-Medium', color: 'blue' },
          { name: 'P3-Low', color: 'gray' },
        ],
      },
    },
    Location: { rich_text: {} },
    'Budget Allocated': { number: { format: 'euro' } },
    'Budget Target': { number: { format: 'euro' } },
    'Health Score': { formula: { expression: 'if(prop("Budget Target") > 0, prop("Budget Allocated") / prop("Budget Target"), 0)' } },
    Progress: { number: { format: 'percent' } },
    'Next Deadline': { date: {} },
    'Assigned Agents': { multi_select: { options: [] } },
    'Last Updated': { last_edited_time: {} },
  };

  const resp = await notion.databases.update({ database_id: databaseId, properties });
  console.log('Updated schema for database:', resp.id);
}

main().catch((e) => { console.error(e); process.exit(1); });

