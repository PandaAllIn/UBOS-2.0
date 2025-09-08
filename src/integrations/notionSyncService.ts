import 'dotenv/config';
import { Client } from '@notionhq/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import { projectRegistry, ProjectMetadata } from '../masterControl/projectRegistry.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { FundingOpportunityScanner } from '../dashboard/fundingOpportunityScanner.js';

function envOrThrow(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var ${key}`);
  return v.trim();
}

function mapStatus(p: ProjectMetadata['status']): string {
  switch (p) {
    case 'active': return 'Active';
    case 'planned': return 'Planning';
    case 'completed': return 'Complete';
    case 'paused': return 'On Hold';
    default: return 'Active';
  }
}

function mapPriority(p: ProjectMetadata['priority']): string {
  switch (p) {
    case 'P0': return 'P0-Critical';
    case 'P1': return 'P1-High';
    case 'P2': return 'P2-Medium';
    case 'P3': return 'P3-Low';
    default: return 'P2-Medium';
  }
}

export class NotionSyncService {
  private notion: Client;
  private parentPageId: string;
  private projectsDbId: string | undefined;
  private scanner = new FundingOpportunityScanner();

  constructor() {
    this.notion = new Client({ auth: envOrThrow('NOTION_TOKEN') });
    this.parentPageId = envOrThrow('NOTION_PARENT_PAGE_ID');
    this.projectsDbId = process.env.NOTION_PROJECTS_DB_ID?.trim() || undefined;
  }

  private async listChildren(blockId: string) {
    const results: any[] = [];
    let cursor: string | undefined;
    do {
      const res = await this.notion.blocks.children.list({ block_id: blockId, start_cursor: cursor });
      results.push(...res.results);
      cursor = (res as any).has_more ? (res as any).next_cursor : undefined;
    } while (cursor);
    return results;
  }

  private async ensureSection(title: string): Promise<string> {
    const children = await this.listChildren(this.parentPageId);
    const existing = children.find((b: any) => b.type === 'child_page' && b.child_page?.title === title);
    if (existing) return existing.id;
    const page = await this.notion.pages.create({
      parent: { page_id: this.parentPageId },
      properties: { title: { title: [{ text: { content: title } }] } },
    } as any);
    return (page as any).id;
  }

  private async upsertProjectPage(projectsSectionId: string, p: ProjectMetadata): Promise<void> {
    // Try to find an existing page by title
    const children = await this.listChildren(projectsSectionId);
    const existing = children.find((b: any) => b.type === 'child_page' && (b.child_page?.title || '') === p.name);
    let pageId: string;
    if (existing) {
      pageId = existing.id;
      // Update content by appending a fresh summary block set (non-destructive)
    } else {
      const page = await this.notion.pages.create({
        parent: { page_id: projectsSectionId },
        properties: { title: { title: [{ text: { content: p.name } }] } },
      } as any);
      pageId = (page as any).id;
    }

    const health = `${p.metrics.healthScore}%`;
    const progress = `${p.metrics.progressPercentage}%`;
    const status = mapStatus(p.status);
    const priority = mapPriority(p.priority);
    const budget = `${p.budget.allocated.toLocaleString()} ${p.budget.currency}` + (p.budget.target ? ` / target ${p.budget.target.toLocaleString()} ${p.budget.currency}` : '');
    const nextMilestone = p.timeline.milestones
      .filter(m => m.status === 'pending' || m.status === 'in_progress')
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    const summaryBlocks: any[] = [
      { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Current Summary' } }] } },
      { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Status: ${status}` } }] } },
      { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Priority: ${priority}` } }] } },
      { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Health: ${health} | Progress: ${progress}` } }] } },
      { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Budget: ${budget}` } }] } },
      { object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Location: ${p.location.baseDirectory}` } }] } },
      { object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: `Last Updated: ${new Date(p.metrics.lastUpdated).toLocaleString()}` } }] } },
    ];
    if (nextMilestone) {
      summaryBlocks.push({ object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `Next Milestone: ${nextMilestone.name} on ${nextMilestone.date}` } }] } });
    }

    await this.notion.blocks.children.append({ block_id: pageId, children: summaryBlocks });
  }

  private async tryUpsertProjectsDatabase(p: ProjectMetadata): Promise<void> {
    if (!this.projectsDbId) return;
    try {
      // Best-effort create a page in DB with Name and optionally other properties
      await this.notion.pages.create({
        parent: { database_id: this.projectsDbId },
        properties: {
          Name: { title: [{ text: { content: p.name } }] },
          Status: { select: { name: mapStatus(p.status) } },
          Priority: { select: { name: mapPriority(p.priority) } },
          Location: { rich_text: [{ text: { content: p.location.baseDirectory } }] },
        } as any,
      });
    } catch (e: any) {
      // Swallow validation errors for non-existent properties; log once
      const msg = e?.body?.message || e?.message || String(e);
      if (msg?.includes('property') && msg?.includes('not a property')) {
        // OK — workspace still not exposing properties via API
      } else {
        console.warn('Notion DB insert warning:', msg);
      }
    }
  }

  async syncProjects(): Promise<void> {
    const actionId = await agentActionLogger.startWork('CodexCLI', 'Notion sync: projects', 'Sync projects into Notion', 'automation');
    try {
      const projectsSectionId = await this.ensureSection('📊 Projects');
      const projects = await projectRegistry.getAllProjects();
      for (const p of projects) {
        await this.upsertProjectPage(projectsSectionId, p);
        await this.tryUpsertProjectsDatabase(p);
      }
      await agentActionLogger.completeWork(actionId, `Synced ${projects.length} projects into Notion`);
    } catch (e: any) {
      await agentActionLogger.updateActionStatus(actionId, 'failed', { output: { summary: e?.message || String(e) } as any });
      throw e;
    }
  }

  // Placeholders for future steps
  async syncAgents(): Promise<void> {
    const sectionId = await this.ensureSection('🤖 Agents Activity');
    const recent = await agentActionLogger.getRecentActions(50);
    const blocks: any[] = [
      { object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Latest Agent Actions' } }] } },
      ...recent.slice(0, 10).map(a => ({
        object: 'block',
        paragraph: { rich_text: [{ type: 'text', text: { content: `${new Date(a.timestamp).toLocaleString()} - ${a.agent}: ${a.action} (${a.status})` } }] }
      }))
    ];
    // Append summary to section page itself
    await this.notion.blocks.children.append({ block_id: sectionId, children: blocks });
  }

  async syncFunding(): Promise<void> {
    const sectionId = await this.ensureSection('🇪🇺 EU Funding Opportunities');
    // Seed critical deadlines for immediate visibility
    await this.scanner.seedCriticalDeadlines();
    const opps = await this.scanner.getActiveOpportunities();
    const critical = opps
      .filter(o => ['2025-09-02', '2025-09-18', '2025-10-09'].includes(o.deadline))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    const blocks: any[] = [];
    blocks.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Critical Deadlines' } }] } });
    if (!critical.length) {
      blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'No critical deadlines found.' } }] } });
    } else {
      for (const c of critical) {
        const line = `${c.deadline} — ${c.program}: ${c.title}`;
        blocks.push({ object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line } }] } });
      }
    }
    await this.notion.blocks.children.append({ block_id: sectionId, children: blocks });
  }

  async syncCriticalDeadlines(): Promise<void> {
    await this.scanner.seedCriticalDeadlines();
    const opps = await this.scanner.getActiveOpportunities();
    const critical = opps
      .filter(o => ['2025-09-02', '2025-09-18', '2025-10-09'].includes(o.deadline))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));

    const pageId = await this.ensureSection('⚠️ Critical Deadlines');
    const now = new Date().toLocaleString();
    const blocks: any[] = [];
    blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: `Updated ${now}` } }] } });
    if (!critical.length) {
      blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'No critical deadlines found.' } }] } });
    } else {
      for (const c of critical) {
        const line = `${c.deadline} — ${c.program}: ${c.title}`;
        blocks.push({ object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line } }] } });
      }
    }
    await this.notion.blocks.children.append({ block_id: pageId, children: blocks });
  }

  async syncDailyBriefing(): Promise<void> {
    const sectionId = await this.ensureSection('🗓️ Daily Briefings');
    const today = new Date().toISOString().split('T')[0];
    // Create a new page for today
    const page = await this.notion.pages.create({
      parent: { page_id: sectionId },
      properties: { title: { title: [{ text: { content: `Daily Briefing — ${today}` } }] } },
    } as any);
    const pageId = (page as any).id;

    // Portfolio
    const portfolio = await projectRegistry.getPortfolioHealth();
    const line1 = `Portfolio Health: ${portfolio.overallHealth}% | Active: ${portfolio.activeProjects}/${portfolio.projectCount} | Critical Issues: ${portfolio.criticalIssues} | Budget Utilization: ${portfolio.budgetUtilization}%`;

    // Deadlines (top 3)
    await this.scanner.seedCriticalDeadlines();
    const opps = await this.scanner.getActiveOpportunities();
    const now = new Date();
    const future = opps.filter(o => o.deadline && o.deadline !== 'TBD' && o.deadline !== 'ongoing' && new Date(o.deadline) >= now)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 3);

    // Agent activity (last 24h summary)
    const recent = await agentActionLogger.getRecentActions(100);
    const cutoff = new Date(Date.now() - 24*60*60*1000);
    const lastDay = recent.filter(a => new Date(a.timestamp) >= cutoff);
    const completed = lastDay.filter(a => a.status === 'completed').length;
    const failed = lastDay.filter(a => a.status === 'failed').length;
    const inprog = lastDay.filter(a => a.status === 'in_progress' || a.status === 'started').length;

    const blocks: any[] = [];
    blocks.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Portfolio Summary' } }] } });
    blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: line1 } }] } });
    blocks.push({ object: 'block', divider: {} });

    blocks.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Critical Deadlines' } }] } });
    if (!future.length) {
      blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: 'No upcoming deadlines.' } }] } });
    } else {
      for (const d of future) {
        const line = `${d.deadline} — ${d.program}: ${d.title}`;
        blocks.push({ object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line } }] } });
      }
    }
    blocks.push({ object: 'block', divider: {} });

    blocks.push({ object: 'block', heading_2: { rich_text: [{ type: 'text', text: { content: 'Agent Activity (24h)' } }] } });
    blocks.push({ object: 'block', paragraph: { rich_text: [{ type: 'text', text: { content: `Completed: ${completed} • In Progress: ${inprog} • Failed: ${failed}` } }] } });
    for (const a of lastDay.slice(0, 5)) {
      const line = `${new Date(a.timestamp).toLocaleTimeString()} — ${a.agent}: ${a.action} (${a.status})`;
      blocks.push({ object: 'block', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line } }] } });
    }

    await this.notion.blocks.children.append({ block_id: pageId, children: blocks });
  }

  // Public helpers for dashboard links
  public async getSectionUrl(title: string, createIfMissing: boolean = false): Promise<string | null> {
    let id: string | null = null;
    // Try find existing
    const children = await this.listChildren(this.parentPageId);
    const existing = children.find((b: any) => b.type === 'child_page' && (b.child_page?.title || '') === title);
    if (existing) id = existing.id;
    // Optionally create if missing
    if (!id && createIfMissing) {
      const page = await this.notion.pages.create({
        parent: { page_id: this.parentPageId },
        properties: { title: { title: [{ text: { content: title } }] } },
      } as any);
      id = (page as any).id;
    }
    return id ? `https://www.notion.so/${id.replace(/-/g, '')}` : null;
  }
}

// Utility for local tests
export async function runProjectsSync() {
  const svc = new NotionSyncService();
  await svc.syncProjects();
}
