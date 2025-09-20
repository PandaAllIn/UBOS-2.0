import 'dotenv/config';
import { Client } from '@notionhq/client';
import type {
  BlockObjectRequest,
  BlockObjectResponse,
  CreatePageParameters,
  ListBlockChildrenResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
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

  private async listChildren(blockId: string): Promise<BlockObjectResponse[]> {
    const results: BlockObjectResponse[] = [];
    let cursor: string | undefined;
    do {
      const response: ListBlockChildrenResponse = await this.notion.blocks.children.list({ block_id: blockId, start_cursor: cursor });
      results.push(...(response.results as BlockObjectResponse[]));
      cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);
    return results;
  }

  private isChildPage(block: BlockObjectResponse): block is Extract<BlockObjectResponse, { type: 'child_page' }> {
    return block.type === 'child_page';
  }

  private static text(content: string): PlainTextRichText {
    return {
      type: 'text',
      text: { content },
    };
  }

  private static heading(content: string): BlockObjectRequest {
    return {
      type: 'heading_2',
      heading_2: { rich_text: [NotionSyncService.text(content)] },
    };
  }

  private static bullet(content: string): BlockObjectRequest {
    return {
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: [NotionSyncService.text(content)] },
    };
  }

  private static paragraph(content: string): BlockObjectRequest {
    return {
      type: 'paragraph',
      paragraph: { rich_text: [NotionSyncService.text(content)] },
    };
  }

  private static divider(): BlockObjectRequest {
    return { type: 'divider', divider: {} };
  }

  private async ensureSection(title: string): Promise<string> {
    const children = await this.listChildren(this.parentPageId);
    const existing = children.find((block) => this.isChildPage(block) && block.child_page?.title === title);
    if (existing) return existing.id;

    const pagePayload: CreatePageParameters = {
      parent: { page_id: this.parentPageId },
      properties: {
        title: {
          title: [NotionSyncService.text(title)],
        },
      },
    };

    const page = await this.notion.pages.create(pagePayload);
    return (page as PageObjectResponse).id;
  }

  private async upsertProjectPage(projectsSectionId: string, p: ProjectMetadata): Promise<void> {
    // Try to find an existing page by title
    const children = await this.listChildren(projectsSectionId);
    const existing = children.find((block) => this.isChildPage(block) && block.child_page?.title === p.name);
    let pageId: string;
    if (existing) {
      pageId = existing.id;
      // Update content by appending a fresh summary block set (non-destructive)
    } else {
      const pagePayload: CreatePageParameters = {
        parent: { page_id: projectsSectionId },
        properties: {
          title: {
            title: [
              {
                type: 'text',
                text: { content: p.name },
              },
            ],
          },
        },
      };
      const page = await this.notion.pages.create(pagePayload);
      pageId = (page as PageObjectResponse).id;
    }

    const health = `${p.metrics.healthScore}%`;
    const progress = `${p.metrics.progressPercentage}%`;
    const status = mapStatus(p.status);
    const priority = mapPriority(p.priority);
    const budget = `${p.budget.allocated.toLocaleString()} ${p.budget.currency}` + (p.budget.target ? ` / target ${p.budget.target.toLocaleString()} ${p.budget.currency}` : '');
    const nextMilestone = p.timeline.milestones
      .filter(m => m.status === 'pending' || m.status === 'in_progress')
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    const summaryBlocks: BlockObjectRequest[] = [
      NotionSyncService.heading('Current Summary'),
      NotionSyncService.bullet(`Status: ${status}`),
      NotionSyncService.bullet(`Priority: ${priority}`),
      NotionSyncService.bullet(`Health: ${health} | Progress: ${progress}`),
      NotionSyncService.bullet(`Budget: ${budget}`),
      NotionSyncService.bullet(`Location: ${p.location.baseDirectory}`),
      NotionSyncService.paragraph(`Last Updated: ${new Date(p.metrics.lastUpdated).toLocaleString()}`),
    ];
    if (nextMilestone) {
      summaryBlocks.push(NotionSyncService.bullet(`Next Milestone: ${nextMilestone.name} on ${nextMilestone.date}`));
    }

    await this.notion.blocks.children.append({ block_id: pageId, children: summaryBlocks });
  }

  private async tryUpsertProjectsDatabase(p: ProjectMetadata): Promise<void> {
    if (!this.projectsDbId) return;
    try {
      // Best-effort create a page in DB with Name and optionally other properties
      const properties: CreatePageParameters['properties'] = {
        Name: { title: [NotionSyncService.text(p.name)] },
        Status: { select: { name: mapStatus(p.status) } },
        Priority: { select: { name: mapPriority(p.priority) } },
        Location: { rich_text: [NotionSyncService.text(p.location.baseDirectory)] },
      };

      const payload: CreatePageParameters = {
        parent: { database_id: this.projectsDbId },
        properties,
      };

      await this.notion.pages.create(payload);
    } catch (e: unknown) {
      // Swallow validation errors for non-existent properties; log once
      const msg = (e as { body?: { message: string } })?.body?.message || (e as Error)?.message || String(e);
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
    } catch (e: unknown) {
      await agentActionLogger.updateActionStatus(actionId, 'failed', { output: { summary: (e as Error)?.message || String(e) } });
      throw e;
    }
  }

  // Placeholders for future steps
  async syncAgents(): Promise<void> {
    const sectionId = await this.ensureSection('🤖 Agents Activity');
    const recent = await agentActionLogger.getRecentActions(50);
    const blocks: BlockObjectRequest[] = [NotionSyncService.heading('Latest Agent Actions')];
    blocks.push(
      ...recent.slice(0, 10).map((a) =>
        NotionSyncService.paragraph(`${new Date(a.timestamp).toLocaleString()} - ${a.agent}: ${a.action} (${a.status})`)
      ),
    );
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

    const blocks: BlockObjectRequest[] = [NotionSyncService.heading('Critical Deadlines')];
    if (!critical.length) {
      blocks.push(NotionSyncService.paragraph('No critical deadlines found.'));
    } else {
      for (const c of critical) {
        const line = `${c.deadline} — ${c.program}: ${c.title}`;
        blocks.push(NotionSyncService.bullet(line));
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
    const blocks: BlockObjectRequest[] = [NotionSyncService.paragraph(`Updated ${now}`)];
    if (!critical.length) {
      blocks.push(NotionSyncService.paragraph('No critical deadlines found.'));
    } else {
      for (const c of critical) {
        const line = `${c.deadline} — ${c.program}: ${c.title}`;
        blocks.push(NotionSyncService.bullet(line));
      }
    }
    await this.notion.blocks.children.append({ block_id: pageId, children: blocks });
  }

  async syncDailyBriefing(): Promise<void> {
    const sectionId = await this.ensureSection('🗓️ Daily Briefings');
    const today = new Date().toISOString().split('T')[0];
    // Create a new page for today
    const briefingPayload: CreatePageParameters = {
      parent: { page_id: sectionId },
      properties: { title: { title: [NotionSyncService.text(`Daily Briefing — ${today}`)] } },
    };
    const page = await this.notion.pages.create(briefingPayload);
    const pageId = (page as PageObjectResponse).id;

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

    const blocks: BlockObjectRequest[] = [
      NotionSyncService.heading('Portfolio Summary'),
      NotionSyncService.paragraph(line1),
      NotionSyncService.divider(),
      NotionSyncService.heading('Critical Deadlines'),
    ];

    if (!future.length) {
      blocks.push(NotionSyncService.paragraph('No upcoming deadlines.'));
    } else {
      for (const d of future) {
        const line = `${d.deadline} — ${d.program}: ${d.title}`;
        blocks.push(NotionSyncService.bullet(line));
      }
    }

    blocks.push(NotionSyncService.divider());
    blocks.push(NotionSyncService.heading('Agent Activity (24h)'));
    blocks.push(NotionSyncService.paragraph(`Completed: ${completed} • In Progress: ${inprog} • Failed: ${failed}`));
    for (const a of lastDay.slice(0, 5)) {
      const line = `${new Date(a.timestamp).toLocaleTimeString()} — ${a.agent}: ${a.action} (${a.status})`;
      blocks.push(NotionSyncService.bullet(line));
    }

    await this.notion.blocks.children.append({ block_id: pageId, children: blocks });
  }

  // Public helpers for dashboard links
  public async getSectionUrl(title: string, createIfMissing: boolean = false): Promise<string | null> {
    let id: string | null = null;
    // Try find existing
    const children = await this.listChildren(this.parentPageId);
    const existing = children.find((block) => this.isChildPage(block) && (block.child_page?.title || '') === title);
    if (existing) id = existing.id;
    // Optionally create if missing
    if (!id && createIfMissing) {
      const payload: CreatePageParameters = {
        parent: { page_id: this.parentPageId },
        properties: { title: { title: [NotionSyncService.text(title)] } },
      };
      const page = await this.notion.pages.create(payload);
      id = (page as PageObjectResponse).id;
    }
    return id ? `https://www.notion.so/${id.replace(/-/g, '')}` : null;
  }
}

// Utility for local tests
export async function runProjectsSync() {
  const svc = new NotionSyncService();
  await svc.syncProjects();
}
type PlainTextRichText = { type: 'text'; text: { content: string } };
