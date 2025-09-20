import { getEnvOrThrow, getNotionClient } from './helpers.mjs';
import fs from 'node:fs/promises';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

async function createProjectsDatabase() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '📊 PROJECTS MASTER DATABASE' } }],
    properties: {
      // IMPORTANT: Use the canonical title property name "Name"
      Name: { title: {} },
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
      'Budget Allocated': { number: { format: 'euro' } },
      'Budget Target': { number: { format: 'euro' } },
      'Health Score': { formula: { expression: 'if(prop("Budget Target") > 0, prop("Budget Allocated") / prop("Budget Target"), 0)' } },
      Progress: { number: { format: 'percent' } },
      'Next Deadline': { date: {} },
      'Assigned Agents': { multi_select: { options: [] } },
      Location: { rich_text: {} },
      'Last Updated': { last_edited_time: {} },
    },
  });
  return resp.id;
}

async function createAgentsActivityDatabase(projectsDbId) {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: '🤖 AGENTS ACTIVITY DATABASE' } }],
    properties: {
      'Agent Name': { title: {} },
      'Action Description': { rich_text: {} },
      Project: { relation: { database_id: projectsDbId } },
      Status: { select: { options: [
        { name: 'In Progress', color: 'blue' },
        { name: 'Completed', color: 'green' },
        { name: 'Failed', color: 'red' },
      ] } },
      'Start Time': { date: {} },
      'End Time': { date: {} },
      // Keep duration as plain number; computed in app/UI to avoid formula encoding issues
      'Duration (Minutes)': { number: { format: 'number' } },
      Cost: { number: { format: 'dollar' } },
      'Files Created/Modified': { rich_text: {} },
      'Results Summary': { rich_text: {} },
      'Next Action Required': { rich_text: {} },
    },
  });
  return resp.id;
}

async function createClientPipelineDatabase() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: '💰 EUFM CLIENT PIPELINE DATABASE' } }],
    properties: {
      'Client Name': { title: {} },
      'Company Type': { select: { options: [
        { name: 'SME', color: 'blue' },
        { name: 'Municipality', color: 'green' },
        { name: 'University', color: 'purple' },
        { name: 'NGO', color: 'yellow' },
      ] } },
      'Contact Person': { rich_text: {} },
      Email: { email: {} },
      Phone: { phone_number: {} },
      LinkedIn: { url: {} },
      'Project Value': { number: { format: 'euro' } },
      'Commission Rate': { number: { format: 'percent' } },
      'Potential Revenue': { formula: { expression: 'prop("Project Value") * prop("Commission Rate")' } },
      Status: { select: { options: [
        { name: 'Lead', color: 'gray' },
        { name: 'Consultation', color: 'blue' },
        { name: 'Proposal', color: 'yellow' },
        { name: 'Contract', color: 'orange' },
        { name: 'Active', color: 'green' },
      ] } },
      'EU Program': { rich_text: {} },
      Deadline: { date: {} },
      Probability: { select: { options: [
        { name: '10%', color: 'gray' },
        { name: '25%', color: 'blue' },
        { name: '50%', color: 'yellow' },
        { name: '75%', color: 'orange' },
        { name: '90%', color: 'green' },
      ] } },
      'Last Contact': { date: {} },
      'Next Action': { rich_text: {} },
    },
  });
  return resp.id;
}

async function createFundingOpportunitiesDatabase(projectsDbId) {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: '🇪🇺 EU FUNDING OPPORTUNITIES DATABASE' } }],
    properties: {
      'Program Name': { title: {} },
      'Call Title': { rich_text: {} },
      'Budget Available': { number: { format: 'euro' } },
      'Max Grant Size': { number: { format: 'euro' } },
      'Application Deadline': { date: {} },
      'Relevance Score': { select: { options: Array.from({ length: 10 }, (_, i) => ({ name: String(i + 1), color: 'blue' })) } },
      'Target Projects': { relation: { database_id: projectsDbId } },
      Status: { select: { options: [
        { name: 'Monitoring', color: 'gray' },
        { name: 'Applying', color: 'blue' },
        { name: 'Submitted', color: 'yellow' },
        { name: 'Awarded', color: 'green' },
        { name: 'Rejected', color: 'red' },
      ] } },
      'Success Probability': { select: { options: [
        { name: '10%', color: 'gray' },
        { name: '25%', color: 'blue' },
        { name: '50%', color: 'yellow' },
        { name: '75%', color: 'orange' },
        { name: '90%', color: 'green' },
      ] } },
      'Application Lead': { rich_text: {} },
      'Required Documents': { rich_text: {} },
      Notes: { rich_text: {} },
    },
  });
  return resp.id;
}

async function createPartnershipsDatabase() {
  const resp = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ text: { content: '🏛️ ORADEA PARTNERSHIPS DATABASE' } }],
    properties: {
      'Contact Name': { title: {} },
      Position: { rich_text: {} },
      Organization: { rich_text: {} },
      'Contact Type': { select: { options: [
        { name: 'Government', color: 'blue' },
        { name: 'Academic', color: 'purple' },
        { name: 'Business', color: 'green' },
        { name: 'Coworking', color: 'yellow' },
      ] } },
      Priority: { select: { options: [
        { name: 'High', color: 'red' },
        { name: 'Medium', color: 'orange' },
        { name: 'Low', color: 'yellow' },
      ] } },
      Email: { email: {} },
      Phone: { phone_number: {} },
      LinkedIn: { url: {} },
      'Meeting Status': { select: { options: [
        { name: 'Not Contacted', color: 'gray' },
        { name: 'Scheduled', color: 'blue' },
        { name: 'Met', color: 'green' },
        { name: 'Follow-up', color: 'yellow' },
      ] } },
      'Partnership Level': { select: { options: [
        { name: 'Potential', color: 'gray' },
        { name: 'Initial', color: 'blue' },
        { name: 'Active', color: 'green' },
        { name: 'Strategic', color: 'purple' },
      ] } },
      'Value Proposition': { rich_text: {} },
      'Last Contact': { date: {} },
      'Next Action': { rich_text: {} },
    },
  });
  return resp.id;
}

async function main() {
  console.log('Creating Notion databases under parent page:', parentPageId);
  const projectsId = await createProjectsDatabase();
  console.log('Projects DB:', projectsId);
  const agentsId = await createAgentsActivityDatabase(projectsId);
  console.log('Agents Activity DB:', agentsId);
  const clientsId = await createClientPipelineDatabase();
  console.log('Client Pipeline DB:', clientsId);
  const fundingId = await createFundingOpportunitiesDatabase(projectsId);
  console.log('Funding Opportunities DB:', fundingId);
  const partnershipsId = await createPartnershipsDatabase();
  console.log('Partnerships DB:', partnershipsId);

  const ids = {
    parentPageId,
    projectsId,
    agentsId,
    clientsId,
    fundingId,
    partnershipsId,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile('notion/last_created_ids.json', JSON.stringify(ids, null, 2));
  console.log('Wrote notion/last_created_ids.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
