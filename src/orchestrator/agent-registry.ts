import { WorkerAgent, AgentCapability, AgentStatus } from './worker-agent';
import { MessageBus, MessageType, globalMessageBus } from './message-bus';

/**
 * Agent Registry for managing worker agents
 */
export class AgentRegistry {
  private agents: Map<string, WorkerAgent> = new Map();
  private messageBus: MessageBus;

  constructor(messageBus: MessageBus = globalMessageBus) {
    this.messageBus = messageBus;
  }

  /**
   * Register a new agent
   */
  register(agent: WorkerAgent): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent ${agent.id} already registered`);
    }

    this.agents.set(agent.id, agent);

    // Broadcast agent joined
    this.messageBus.publish({
      type: MessageType.AGENT_STATUS,
      from: 'registry',
      to: 'all',
      payload: {
        event: 'agent_joined',
        agent: agent.getInfo()
      }
    });
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.stop();
    this.agents.delete(agentId);

    // Broadcast agent left
    this.messageBus.publish({
      type: MessageType.AGENT_STATUS,
      from: 'registry',
      to: 'all',
      payload: {
        event: 'agent_left',
        agentId
      }
    });
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): WorkerAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): WorkerAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: AgentCapability): WorkerAgent[] {
    return this.getAllAgents().filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Find idle agents
   */
  findIdle(): WorkerAgent[] {
    return this.getAllAgents().filter(agent =>
      agent.getInfo().status === AgentStatus.IDLE
    );
  }

  /**
   * Find idle agents with specific capability
   */
  findIdleWithCapability(capability: AgentCapability): WorkerAgent[] {
    return this.getAllAgents().filter(agent =>
      agent.capabilities.includes(capability) &&
      agent.getInfo().status === AgentStatus.IDLE
    );
  }

  /**
   * Get agent count
   */
  getCount(): number {
    return this.agents.size;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<AgentStatus, number>;
    byCapability: Record<AgentCapability, number>;
  } {
    const byStatus: Record<AgentStatus, number> = {
      [AgentStatus.IDLE]: 0,
      [AgentStatus.BUSY]: 0,
      [AgentStatus.ERROR]: 0,
      [AgentStatus.STOPPED]: 0
    };

    const byCapability: Record<AgentCapability, number> = {} as Record<AgentCapability, number>;

    this.getAllAgents().forEach(agent => {
      const info = agent.getInfo();
      byStatus[info.status]++;

      info.capabilities.forEach(cap => {
        byCapability[cap] = (byCapability[cap] || 0) + 1;
      });
    });

    return {
      total: this.agents.size,
      byStatus,
      byCapability
    };
  }

  /**
   * Stop all agents
   */
  stopAll(): void {
    this.getAllAgents().forEach(agent => agent.stop());
    this.agents.clear();
  }
}

/**
 * Global agent registry
 */
export const globalAgentRegistry = new AgentRegistry();
