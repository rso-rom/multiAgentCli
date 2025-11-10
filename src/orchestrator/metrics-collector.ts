import { eventBus, AgentCompletePayload } from './event-system';

export interface ExecutionMetrics {
  agent: string;
  duration: number;
  tokensUsed?: number;
  cost?: number;
  success: boolean;
  timestamp: Date;
}

export interface MetricsReport {
  totalExecutions: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  byAgent: Record<string, { executions: number; tokens: number; cost: number; avgDuration: number }>;
  byModel: Record<string, { tokens: number; cost: number }>;
}

/**
 * Collects and aggregates performance metrics
 */
export class MetricsCollector {
  private metrics: ExecutionMetrics[] = [];
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled;
    if (enabled) this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    eventBus.onAgentComplete((payload: AgentCompletePayload) => {
      this.recordAgentExecution({
        agent: payload.agent,
        duration: payload.duration,
        success: true,
        timestamp: payload.timestamp
      });
    });
  }

  recordAgentExecution(metrics: ExecutionMetrics): void {
    if (!this.enabled) return;
    this.metrics.push(metrics);
  }

  getMetrics(): MetricsReport {
    const byAgent: Record<string, any> = {};
    const byModel: Record<string, any> = {};
    let totalTokens = 0;
    let totalCost = 0;
    let totalDuration = 0;

    this.metrics.forEach(m => {
      if (!byAgent[m.agent]) {
        byAgent[m.agent] = { executions: 0, tokens: 0, cost: 0, totalDuration: 0 };
      }
      byAgent[m.agent].executions++;
      byAgent[m.agent].tokens += m.tokensUsed || 0;
      byAgent[m.agent].cost += m.cost || 0;
      byAgent[m.agent].totalDuration += m.duration;

      totalTokens += m.tokensUsed || 0;
      totalCost += m.cost || 0;
      totalDuration += m.duration;
    });

    // Calculate averages
    for (const agent in byAgent) {
      byAgent[agent].avgDuration = byAgent[agent].totalDuration / byAgent[agent].executions;
    }

    return {
      totalExecutions: this.metrics.length,
      totalTokens,
      totalCost,
      avgLatency: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      byAgent,
      byModel
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

export const globalMetricsCollector = new MetricsCollector();
