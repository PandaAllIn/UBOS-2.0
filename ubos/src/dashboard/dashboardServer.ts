import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { z } from 'zod';
import { MissionControl } from './missionControl.js';
import { NotionSyncService } from '../integrations/notionSyncService.js';
import { geminiComplete } from '../adapters/google_gemini.js';
import { apiBillingMiddleware } from '../middleware/api-billing.js';
import { agentMarketplaceRouter } from '../api/agent-marketplace.js';
import { codeRabbitWebhook } from '../integrations/coderabbit/index.js';
import { eufmRouter } from '../api/eufm/eufmRoutes.js';
import { stripeService } from '../monetization/stripe-enhanced.js';
import logger from '../utils/logger.js';

const __dirname = path.dirname(__filename);

const executeTaskSchema = z.object({
  task: z.string().min(1, { message: "Task cannot be empty" }),
});

const notionSyncSchema = z.object({
  scope: z.string().optional().default('all'),
});

const assistantSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty" }),
});

const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  customerId: z.string().optional(),
});

export class DashboardServer {
  private app = express();
  private server = createServer(this.app);
  private wss = new WebSocketServer({ server: this.server });
  private missionControl = new MissionControl();
  private port = process.env.DASHBOARD_PORT || 3000;

  constructor() {
    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress() {
    // Security middleware
    this.app.use(helmet());
    // TODO: Restrict CORS to the actual frontend origin in production
    this.app.use(cors());

    // Serve static files from web directory
    const webDir = path.join(__dirname, 'web');
    this.app.use(express.static(webDir));
    // Serve consultant portal
    const consultantPortalDir = path.join(process.cwd(), 'consultant-portal', 'web');
    this.app.use('/portal', express.static(consultantPortalDir));
    // Serve Tide Guide replica (desktop/tide-guide) at /tide for LAN/iPad access
    const tideDir = path.join(process.cwd(), 'desktop', 'tide-guide');
    this.app.use('/tide', express.static(tideDir));
    this.app.use(express.json());

    // API endpoints
    this.app.get('/api/status', async (_req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.json(status);
      } catch {
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    this.app.post('/api/execute', apiBillingMiddleware, async (req, res) => {
      try {
        const validationResult = executeTaskSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid task', details: validationResult.error.flatten() });
        }

        const { task } = validationResult.data;
        const result = await this.missionControl.analyzeTask(task);
        res.json(result);
      } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Analyze failed' });
      }
    });

    this.app.post('/api/scan-funding', apiBillingMiddleware, async (_req, res) => {
      try {
        const opportunities = await this.missionControl.scanFundingOpportunities();
        res.json({ message: 'Funding scan complete', found: opportunities.length });
      } catch {
        res.status(500).json({ error: 'Funding scan failed' });
      }
    });

    this.app.get('/api/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    this.app.get('/api/trends', async (_req, res) => {
      try {
        const data = await this.missionControl.getTrends();
        res.json(data);
      } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Failed to get trends' });
      }
    });

    // Notion helper endpoints
    this.app.get('/api/notion/links', async (_req, res) => {
      try {
        const parentId = String(process.env.NOTION_PARENT_PAGE_ID || '').replace(/-/g, '');
        const parentUrl = parentId ? `https://www.notion.so/${parentId}` : null;
        const svc = new NotionSyncService();
        const criticalDeadlinesUrl = await svc.getSectionUrl('⚠️ Critical Deadlines', false);
        res.json({ parentUrl, criticalDeadlinesUrl });
      } catch {
        res.json({ parentUrl: null, criticalDeadlinesUrl: null });
      }
    });

    this.app.post('/api/notion/sync', async (req, res) => {
      try {
        const validationResult = notionSyncSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid scope', details: validationResult.error.flatten() });
        }
        const { scope } = validationResult.data;
        const svc = new NotionSyncService();
        if (scope === 'projects' || scope === 'all') await svc.syncProjects();
        if (scope === 'agents' || scope === 'all') await svc.syncAgents();
        if (scope === 'funding' || scope === 'all') {
          await svc.syncFunding();
          await svc.syncCriticalDeadlines();
        }
        if (scope === 'daily') await svc.syncDailyBriefing();
        if (scope === 'all') await svc.syncDailyBriefing();
        res.json({ ok: true });
      } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Notion sync failed' });
      }
    });

    // Assistant endpoint powered by Gemini; uses current status+opportunities as context
    this.app.post('/api/assistant', apiBillingMiddleware, async (req, res) => {
      try {
        const validationResult = assistantSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid message', details: validationResult.error.flatten() });
        }

        const { message } = validationResult.data;
        const status = await this.missionControl.getStatus();
        const opps = await this.missionControl.getOpportunities();
        const context = JSON.stringify({ status, opportunities: opps.slice(0, 10) }, null, 2);
        const prompt = `You are EUFM Dashboard Assistant (Gemini 2.5 Flash).
Context (JSON):
${context}
Task: Answer the user's question and suggest 1-3 concrete next actions using the dashboard or Notion sync commands when helpful. Keep answers concise and actionable.`;
        const reply = await geminiComplete(`${prompt}\n\nUser: ${message}\nAssistant:`, process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp');
        res.json({ reply });
      } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Assistant failed' });
      }
    });

    // Enhanced endpoints
    this.app.get('/api/tools', async (_req, res) => {
      try {
        const tools = await this.missionControl.getTools();
        res.json(tools);
      } catch {
        res.status(500).json({ error: 'Failed to get tools' });
      }
    });

    this.app.get('/api/subscriptions', async (_req, res) => {
      try {
        const subs = await this.missionControl.getSubscriptions();
        res.json(subs);
      } catch {
        res.status(500).json({ error: 'Failed to get subscriptions' });
      }
    });

    this.app.get('/api/opportunities', async (_req, res) => {
      try {
        const opps = await this.missionControl.getOpportunities();
        res.json(opps);
      } catch {
        res.status(500).json({ error: 'Failed to get opportunities' });
      }
    });

    this.app.get('/api/alerts', async (_req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.json(status.alerts);
      } catch {
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    this.app.get('/api/search', async (req, res) => {
      try {
        const q = String(req.query.q || '').trim();
        const results = await this.missionControl.searchAll(q);
        res.json(results);
      } catch {
        res.status(500).json({ error: 'Search failed' });
      }
    });

    this.app.get('/api/export/status.json', async (_req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="status.json"');
        res.send(JSON.stringify(status, null, 2));
      } catch {
        res.status(500).json({ error: 'Export failed' });
      }
    });

    // Recent research and Codex logs (simple filesystem-based)
    this.app.get('/api/recent/research', async (_req, res) => {
      try {
        const dir = path.join(process.cwd(), 'logs', 'research_data', 'perplexity');
        const files = await (await import('fs/promises')).readdir(dir).catch(() => []);
        const recent = files
          .filter(f => f.endsWith('.md') || f.endsWith('.json'))
          .sort()
          .slice(-10);
        res.json(recent);
      } catch {
        res.status(200).json([]);
      }
    });

    this.app.get('/api/recent/codex', async (_req, res) => {
      try {
        const dir = path.join(process.cwd(), 'logs');
        const files = await (await import('fs/promises')).readdir(dir).catch(() => []);
        const codex = files.filter(f => f.startsWith('codex_') && f.endsWith('.log')).sort().slice(-10);
        res.json(codex);
      } catch {
        res.status(200).json([]);
      }
    });

    this.app.get('/api/export/opportunities.csv', async (_req, res) => {
      try {
        const opps = await this.missionControl.getOpportunities();
        const headers = ['id','title','program','deadline','budget','relevance','status','url'];
        const rows = [headers.join(',')].concat(
          opps.map(o => headers.map(h => {
            const v =
              h === 'relevance' ? o.relevanceScore :
              h === 'title' ? o.title :
              h === 'program' ? o.program :
              h === 'deadline' ? o.deadline :
              h === 'budget' ? o.budget :
              h === 'status' ? o.status :
              h === 'url' ? o.url : o.id;
            const s = String(v ?? '').replace(/"/g, '""');
            return `"${s}"`;
          }).join(','))
        ).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="opportunities.csv"');
        res.send(rows);
      } catch {
        res.status(500).json({ error: 'Export failed' });
      }
    });

    this.app.post('/api/billing/create-checkout-session', apiBillingMiddleware, async (req, res) => {
      try {
        const validationResult = createCheckoutSessionSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.flatten() });
        }

        const { priceId, customerId } = validationResult.data;
        const session = await stripeService.createCheckoutSession(priceId, customerId);
        res.json({ url: session.url });
      } catch (e: unknown) {
        res.status(500).json({ error: (e as Error)?.message || 'Failed to create checkout session' });
      }
    });

    // Agent Marketplace Integration
    this.app.use('/api/marketplace', agentMarketplaceRouter);

    // EUFM API Integration
    this.app.use('/api/eufm', eufmRouter);

    // CodeRabbit Integration
    this.app.use('/api/coderabbit', codeRabbitWebhook);

    // Serve React dashboard build, if present, at /app
    const reactDir = path.join(process.cwd(), 'dashboard-react', 'dist');
    this.app.use('/app', express.static(reactDir));
    // React SPA routing - serve index.html for all app routes
    this.app.get(/.\/app\/?.*/, (req, res) => {
      res.sendFile(path.join(reactDir, 'index.html'));
    });

    // Serve dashboard on root (legacy web)
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      logger.info('Dashboard client connected');

      // Send initial status
      this.sendStatusUpdate(ws);

      // Handle client messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleWebSocketMessage(ws, data);
        } catch {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        logger.info('Dashboard client disconnected');
      });
    });
  }

  private async sendStatusUpdate(ws: any) {
    try {
      const status = await this.missionControl.getStatus();
      ws.send(JSON.stringify({ type: 'status_update', data: status }));
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to send status update');
    }
  }

  private async handleWebSocketMessage(ws: any, data: any) {
    try {
      if (data.type === 'request_status') {
        await this.sendStatusUpdate(ws);
      }
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to handle WebSocket message');
      ws.send(JSON.stringify({ error: 'Failed to process message' }));
    }
  }

  private async broadcastStatusUpdate() {
    try {
      const status = await this.missionControl.getStatus();
      const message = JSON.stringify({ type: 'status_update', data: status });

      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      });
    } catch (error: unknown) {
      logger.error({ err: error }, 'Failed to broadcast status update');
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info(`🚀 EUFM Mission Control Dashboard running at: http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('Dashboard server stopped');
        resolve();
      });
    });
  }
}

// Start the dashboard server if this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
  const dashboard = new DashboardServer();

  dashboard.start().catch((error) => {
    logger.error({ err: error }, 'Failed to start dashboard server');
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\nShutting down dashboard server...');
    await dashboard.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\nShutting down dashboard server...');
    await dashboard.stop();
    process.exit(0);
  });
}
