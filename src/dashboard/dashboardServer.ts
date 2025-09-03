import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { MissionControl } from './missionControl.js';

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
    this.app.use(express.json());

    // API endpoints
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.missionControl.getStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    this.app.post('/api/execute', async (req, res) => {
      try {
        const { task, dryRun = false } = req.body;
        const result = await this.missionControl.executeTask(task, { dryRun });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Task execution failed' });
      }
    });

    this.app.post('/api/scan-funding', async (req, res) => {
      try {
        const opportunities = await this.missionControl.scanFundingOpportunities();
        res.json(opportunities);
      } catch (error) {
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
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
      });
    });

    // Broadcast status updates every 30 seconds
    setInterval(() => {
      this.broadcastStatusUpdate();
    }, 30000);
  }

  private async handleWebSocketMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'execute_task':
        try {
          const result = await this.missionControl.executeTask(data.task, data.options);
          ws.send(JSON.stringify({ type: 'task_result', data: result }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Task execution failed' }));
        }
        break;

      case 'scan_funding':
        try {
          const opportunities = await this.missionControl.scanFundingOpportunities();
          ws.send(JSON.stringify({ type: 'funding_opportunities', data: opportunities }));
        } catch (error) {
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

  private async sendStatusUpdate(ws: WebSocket) {
    try {
      const status = await this.missionControl.getStatus();
      ws.send(JSON.stringify({ type: 'status_update', data: status }));
    } catch (error) {
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
    } catch (error) {
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
