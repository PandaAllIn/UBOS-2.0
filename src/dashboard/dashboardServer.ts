import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { MissionControl } from './missionControl.js';
import { NotionSyncService } from '../integrations/notionSyncService.js';
import { geminiComplete } from '../adapters/google_gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Serve static files from web directory
    const webDir = path.join(__dirname, 'web');
    this.app.use(express.static(webDir));
    // Serve Tide Guide replica (desktop/tide-guide) at /tide for LAN/iPad access
    const tideDir = path.join(process.cwd(), 'desktop', 'tide-guide');
    this.app.use('/tide', express.static(tideDir));
    this.app.use(express.json());

    // API endpoints
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.json(status);
      } catch (error: any) {
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    this.app.post('/api/execute', async (req, res) => {
      try {
        const { task, dryRun = false } = req.body;
        const result = await this.missionControl.executeTask(task, { dryRun });
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Task execution failed' });
      }
    });

    this.app.post('/api/scan-funding', async (req, res) => {
      try {
        const opportunities = await this.missionControl.scanFundingOpportunities();
        res.json({ message: 'Funding scan complete', found: opportunities.length });
      } catch (error: any) {
        res.status(500).json({ error: 'Funding scan failed' });
      }
    });

    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Notion helper endpoints
    this.app.get('/api/notion/links', async (req, res) => {
      try {
        const parentId = String(process.env.NOTION_PARENT_PAGE_ID || '').replace(/-/g, '');
        const parentUrl = parentId ? `https://www.notion.so/${parentId}` : null;
        const svc = new NotionSyncService();
        const criticalDeadlinesUrl = await svc.getSectionUrl('⚠️ Critical Deadlines', false);
        res.json({ parentUrl, criticalDeadlinesUrl });
      } catch (e: any) {
        res.json({ parentUrl: null, criticalDeadlinesUrl: null });
      }
    });

    this.app.post('/api/notion/sync', async (req, res) => {
      const { scope = 'all' } = req.body || {};
      try {
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
      } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Notion sync failed' });
      }
    });

    // Assistant endpoint powered by Gemini; uses current status+opportunities as context
    this.app.post('/api/assistant', async (req, res) => {
      try {
        const { message } = req.body || {};
        if (!message || String(message).trim().length === 0) {
          return res.status(400).json({ error: 'Missing message' });
        }
        const status = await this.missionControl.getStatus();
        const opps = await this.missionControl.getOpportunities();
        const context = JSON.stringify({ status, opportunities: opps.slice(0, 10) }, null, 2);
        const prompt = `You are EUFM Dashboard Assistant (Gemini 2.5 Flash).
Context (JSON):\n${context}
Task: Answer the user's question and suggest 1-3 concrete next actions using the dashboard or Notion sync commands when helpful. Keep answers concise and actionable.`;
        const reply = await geminiComplete(`${prompt}\n\nUser: ${message}\nAssistant:`, process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp');
        res.json({ reply });
      } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Assistant failed' });
      }
    });

    // Enhanced endpoints
    this.app.get('/api/tools', async (req, res) => {
      try {
        const tools = await this.missionControl.getTools();
        res.json(tools);
      } catch (e) {
        res.status(500).json({ error: 'Failed to get tools' });
      }
    });

    this.app.get('/api/subscriptions', async (req, res) => {
      try {
        const subs = await this.missionControl.getSubscriptions();
        res.json(subs);
      } catch (e) {
        res.status(500).json({ error: 'Failed to get subscriptions' });
      }
    });

    this.app.get('/api/opportunities', async (req, res) => {
      try {
        const opps = await this.missionControl.getOpportunities();
        res.json(opps);
      } catch (e) {
        res.status(500).json({ error: 'Failed to get opportunities' });
      }
    });

    this.app.get('/api/alerts', async (req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.json(status.alerts);
      } catch (e) {
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    this.app.get('/api/search', async (req, res) => {
      try {
        const q = String(req.query.q || '').trim();
        const results = await this.missionControl.searchAll(q);
        res.json(results);
      } catch (e) {
        res.status(500).json({ error: 'Search failed' });
      }
    });

    this.app.get('/api/export/status.json', async (req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="status.json"');
        res.send(JSON.stringify(status, null, 2));
      } catch (e) {
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

    this.app.get('/api/export/opportunities.csv', async (req, res) => {
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
      } catch (e) {
        res.status(500).json({ error: 'Export failed' });
      }
    });

    // Serve dashboard on root
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Dashboard client connected');
      
      // Send initial status
      this.sendStatusUpdate(ws);
      
      // Handle client messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleWebSocketMessage(ws, data);
        } catch (error: any) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
      });
    });

    // Relay mission control events to all clients
    this.missionControl.events.on('alert', (evt) => {
      const payload = JSON.stringify({ type: 'activity', message: `[${evt.level.toUpperCase()}] ${evt.message}` });
      this.wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); });
    });
    this.missionControl.events.on('progress', (evt) => {
      const payload = JSON.stringify({ type: 'progress', ...evt });
      this.wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); });
    });
    this.missionControl.events.on('notify', (evt) => {
      const payload = JSON.stringify({ type: 'notify', level: evt.level, message: evt.message });
      this.wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); });
    });

    // Broadcast status updates every 30 seconds
    setInterval(() => {
      this.broadcastStatusUpdate();
    }, 30000);
  }

  private async handleWebSocketMessage(ws: any, data: any) {
    switch (data.type) {
      case 'execute_task':
        try {
          const result = await this.missionControl.executeTask(data.task, data.options);
          ws.send(JSON.stringify({ type: 'task_result', data: result }));
        } catch (error: any) {
          ws.send(JSON.stringify({ type: 'error', message: 'Task execution failed' }));
        }
        break;

      case 'scan_funding':
        try {
          const opportunities = await this.missionControl.scanFundingOpportunities();
          ws.send(JSON.stringify({ type: 'funding_opportunities', data: opportunities }));
        } catch (error: any) {
          ws.send(JSON.stringify({ type: 'error', message: 'Funding scan failed' }));
        }
        break;

      case 'get_status':
        await this.sendStatusUpdate(ws);
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async sendStatusUpdate(ws: any) {
    try {
      const status = await this.missionControl.getStatus();
      ws.send(JSON.stringify({ type: 'status_update', data: status }));
    } catch (error: any) {
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to get status' }));
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
    } catch (error: any) {
      console.error('Failed to broadcast status update:', error);
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🚀 EUFM Mission Control Dashboard running at:`);
        console.log(`   Local:   http://localhost:${this.port}`);
        console.log(`   Network: http://0.0.0.0:${this.port}`);
        console.log('');
        console.log('Dashboard Features:');
        console.log('  • Real-time system monitoring');
        console.log('  • Agent status and execution logs');
        console.log('  • EU funding opportunity scanner');
        console.log('  • Interactive task execution');
        console.log('  • Cost and usage analytics');
        console.log('  • Project timeline tracking');
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Dashboard server stopped');
        resolve();
      });
    });
  }
}

// Start the dashboard server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new DashboardServer();
  
  dashboard.start().catch((error) => {
    console.error('Failed to start dashboard server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down dashboard server...');
    await dashboard.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down dashboard server...');
    await dashboard.stop();
    process.exit(0);
  });
}
