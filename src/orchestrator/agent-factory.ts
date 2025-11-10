import { Agent } from './agent';

/**
 * Agent configuration for dynamic creation
 */
export interface AgentConfig {
  name: string;
  role: string;
  backend: string;
  model?: string;
  tools?: string[];
  memoryLayers?: ('short' | 'mid' | 'long')[];
  policy?: 'auto' | 'ask' | 'never';
  openApiUrl?: string;
  localJsonPath?: string;
}

/**
 * Factory for creating agents dynamically at runtime
 */
export class AgentFactory {
  private static agentCounter = 0;

  /**
   * Create a new agent from configuration
   */
  static createAgent(config: AgentConfig): Agent {
    return new Agent(
      config.name,
      config.role,
      config.backend,
      config.model,
      config.tools,
      config.openApiUrl,
      config.localJsonPath
    );
  }

  /**
   * Create an agent with auto-generated name
   */
  static createAutoAgent(
    role: string,
    backend: string,
    model?: string,
    tools?: string[]
  ): Agent {
    const name = `agent_${++this.agentCounter}`;
    return new Agent(name, role, backend, model, tools);
  }

  /**
   * Create multiple agents from configurations
   */
  static createAgents(configs: AgentConfig[]): Map<string, Agent> {
    const agents = new Map<string, Agent>();

    for (const config of configs) {
      const agent = this.createAgent(config);
      agents.set(config.name, agent);
    }

    return agents;
  }

  /**
   * Clone an existing agent with modified config
   */
  static cloneAgent(
    source: Agent,
    modifications: Partial<AgentConfig>
  ): Agent {
    const name = modifications.name || `${source.name}_clone`;
    const role = modifications.role || source.role;
    const backend = modifications.backend || source.backendName;
    const model = modifications.model || source.model;
    const tools = modifications.tools || source.tools;

    return new Agent(name, role, backend, model, tools);
  }
}
