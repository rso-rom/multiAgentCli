import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { eventBus } from '../orchestrator/event-system';
import { globalMetricsCollector } from '../orchestrator/metrics-collector';

export interface DashboardConfig {
  port: number;
  host: string;
}

/**
 * Web dashboard server for monitoring agent execution
 */
export class DashboardServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private config: DashboardConfig;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || 'localhost'
    };

    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server);

    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventHandlers();
  }

  private setupRoutes(): void {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // Get current metrics
    this.app.get('/api/metrics', (req, res) => {
      const metrics = globalMetricsCollector.getMetrics();
      res.json(metrics);
    });

    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log('📡 Dashboard client connected');

      // Send initial metrics
      socket.emit('metrics', globalMetricsCollector.getMetrics());

      socket.on('disconnect', () => {
        console.log('📡 Dashboard client disconnected');
      });
    });
  }

  private setupEventHandlers(): void {
    // Forward orchestrator events to connected dashboards
    eventBus.onAgentStart((payload) => {
      this.io.emit('agent:start', payload);
    });

    eventBus.onAgentComplete((payload) => {
      this.io.emit('agent:complete', payload);
      // Send updated metrics
      this.io.emit('metrics', globalMetricsCollector.getMetrics());
    });

    eventBus.onAskStore((payload) => {
      this.io.emit('ask:store', payload);
    });

    eventBus.onAgentIncomplete((payload) => {
      this.io.emit('agent:incomplete', payload);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`\n🌐 Dashboard server running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        this.server.close(() => {
          console.log('\n🌐 Dashboard server stopped');
          resolve();
        });
      });
    });
  }
}

let dashboardInstance: DashboardServer | null = null;

export async function startDashboard(config?: Partial<DashboardConfig>): Promise<DashboardServer> {
  if (dashboardInstance) {
    console.log('⚠️  Dashboard already running');
    return dashboardInstance;
  }

  dashboardInstance = new DashboardServer(config);
  await dashboardInstance.start();
  return dashboardInstance;
}

export async function stopDashboard(): Promise<void> {
  if (!dashboardInstance) {
    console.log('⚠️  Dashboard not running');
    return;
  }

  await dashboardInstance.stop();
  dashboardInstance = null;
}
