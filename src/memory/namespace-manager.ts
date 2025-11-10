import { MemoryManager } from './memory-manager';
import { createMemoryManager } from './memory-factory';

/**
 * Manages isolated memory namespaces for agents
 */
export class MemoryNamespaceManager {
  private namespaces: Map<string, MemoryManager> = new Map();
  private sharedNamespaces: Map<string, Set<string>> = new Map();

  /**
   * Create or get namespace for agent
   */
  async getNamespace(agentName: string): Promise<MemoryManager> {
    if (this.namespaces.has(agentName)) {
      return this.namespaces.get(agentName)!;
    }

    const memory = await createMemoryManager(`agent_${agentName}`);
    this.namespaces.set(agentName, memory);
    return memory;
  }

  /**
   * Share namespace between agents
   */
  shareNamespace(namespace: string, agents: string[]): void {
    if (!this.sharedNamespaces.has(namespace)) {
      this.sharedNamespaces.set(namespace, new Set());
    }
    agents.forEach(a => this.sharedNamespaces.get(namespace)!.add(a));
  }

  /**
   * Check if agents share namespace
   */
  sharesNamespace(agent1: string, agent2: string): boolean {
    for (const [_, agents] of this.sharedNamespaces) {
      if (agents.has(agent1) && agents.has(agent2)) return true;
    }
    return false;
  }

  /**
   * Clear namespace
   */
  async clearNamespace(agentName: string): Promise<void> {
    const ns = this.namespaces.get(agentName);
    if (ns) {
      await ns.clearAll();
    }
  }
}

export const globalNamespaceManager = new MemoryNamespaceManager();
