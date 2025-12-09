import { AgentRegistry, globalAgentRegistry } from './agent-registry';
import { MemoryManager } from '../memory/memory-manager';
import { AgentLearning, LearningExperience } from './agent-learning';
import { KnowledgeReflector, LearningPattern, ReflectionInsight } from './knowledge-reflector';
import { MessageBus, MessageType, globalMessageBus } from './message-bus';

/**
 * Learning session result
 */
export interface LearningSession {
  id: string;
  timestamp: Date;
  participatingAgents: string[];
  experiencesAnalyzed: number;
  patternsIdentified: number;
  insightsGenerated: number;
  knowledgeShared: boolean;
  summary: string;
}

/**
 * LearningCoordinator - Coordinates learning across multiple agents
 */
export class LearningCoordinator {
  private registry: AgentRegistry;
  private messageBus: MessageBus;
  private reflector: KnowledgeReflector;
  private memory?: MemoryManager;
  private agentLearning: Map<string, AgentLearning> = new Map();
  private sessions: LearningSession[] = [];
  private autoReflectionInterval?: NodeJS.Timeout;
  private autoReflectionEnabled = false;

  constructor(
    registry: AgentRegistry = globalAgentRegistry,
    messageBus: MessageBus = globalMessageBus,
    memory?: MemoryManager
  ) {
    this.registry = registry;
    this.messageBus = messageBus;
    this.reflector = new KnowledgeReflector(memory);
    this.memory = memory;
  }

  /**
   * Register an agent for learning
   */
  registerAgent(agentId: string, agentName: string, capabilities: any[]): AgentLearning {
    if (!this.agentLearning.has(agentId)) {
      const learning = new AgentLearning(agentId, agentName, capabilities, this.memory);
      this.agentLearning.set(agentId, learning);
      return learning;
    }
    return this.agentLearning.get(agentId)!;
  }

  /**
   * Get learning component for an agent
   */
  getAgentLearning(agentId: string): AgentLearning | undefined {
    return this.agentLearning.get(agentId);
  }

  /**
   * Conduct a reflection session across all agents
   */
  async conductReflectionSession(): Promise<{
    patterns: LearningPattern[];
    insights: ReflectionInsight[];
    recommendations: string[];
    summary: string;
    session: LearningSession;
  }> {
    console.log('\n🧠 Starting collaborative reflection session...\n');

    // Gather experiences from all agents
    const allExperiences: LearningExperience[] = [];
    const participatingAgents: string[] = [];

    for (const [agentId, learning] of this.agentLearning.entries()) {
      const experiences = learning.getRecentExperiences(50);
      allExperiences.push(...experiences);
      if (experiences.length > 0) {
        participatingAgents.push(agentId);
      }
    }

    if (allExperiences.length === 0) {
      console.log('⚠️  No experiences to reflect on\n');
      const emptySession: LearningSession = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        participatingAgents: [],
        experiencesAnalyzed: 0,
        patternsIdentified: 0,
        insightsGenerated: 0,
        knowledgeShared: false,
        summary: 'No experiences available for reflection'
      };
      return {
        patterns: [],
        insights: [],
        recommendations: [],
        summary: 'No experiences to reflect on',
        session: emptySession
      };
    }

    console.log(`   📚 Collected ${allExperiences.length} experiences from ${participatingAgents.length} agent(s)`);

    // Conduct reflection
    const reflection = await this.reflector.reflect(allExperiences);

    // Broadcast insights to all agents
    this.broadcastLearnings(reflection.patterns, reflection.insights);

    // Create session record
    const session: LearningSession = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      participatingAgents,
      experiencesAnalyzed: allExperiences.length,
      patternsIdentified: reflection.patterns.length,
      insightsGenerated: reflection.insights.length,
      knowledgeShared: true,
      summary: reflection.summary
    };

    this.sessions.push(session);

    console.log('\n✅ Reflection session complete\n');

    return {
      ...reflection,
      session
    };
  }

  /**
   * Broadcast learnings to all agents via message bus
   */
  private broadcastLearnings(patterns: LearningPattern[], insights: ReflectionInsight[]): void {
    this.messageBus.publish({
      type: MessageType.BROADCAST,
      from: 'learning-coordinator',
      to: 'all',
      payload: {
        event: 'knowledge_shared',
        patterns,
        insights,
        message: 'New collective learnings available'
      }
    });
  }

  /**
   * Query collective knowledge
   */
  async queryCollectiveKnowledge(
    query: string,
    limit = 10
  ): Promise<Array<{ experience: string; similarity: number; source: string; metadata: any }>> {
    const results: Array<{ experience: string; similarity: number; source: string; metadata: any }> = [];

    // Query each agent's knowledge
    for (const [agentId, learning] of this.agentLearning.entries()) {
      const agentResults = await learning.searchSimilarExperiences(query, limit);
      for (const result of agentResults) {
        results.push({
          experience: result.experience,
          similarity: result.similarity,
          source: agentId,
          metadata: result.metadata
        });
      }
    }

    // Sort by similarity and return top results
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  }

  /**
   * Get learning statistics across all agents
   */
  getCollectiveStats(): {
    totalAgents: number;
    totalExperiences: number;
    overallSuccessRate: number;
    topTechnologies: Array<{ tech: string; count: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    agentStats: Array<{
      agentId: string;
      experiences: number;
      successRate: number;
    }>;
    reflectionSessions: number;
  } {
    let totalExperiences = 0;
    let totalSuccesses = 0;
    const techCounts: Record<string, number> = {};
    const keywordCounts: Record<string, number> = {};
    const agentStats: Array<{ agentId: string; experiences: number; successRate: number }> = [];

    for (const [agentId, learning] of this.agentLearning.entries()) {
      const stats = learning.getStats();
      totalExperiences += stats.totalExperiences;
      totalSuccesses += stats.totalExperiences * stats.successRate;

      agentStats.push({
        agentId,
        experiences: stats.totalExperiences,
        successRate: stats.successRate
      });

      // Aggregate technologies
      for (const { tech, count } of stats.topTechnologies) {
        techCounts[tech] = (techCounts[tech] || 0) + count;
      }

      // Aggregate keywords
      for (const { keyword, count } of stats.topKeywords) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + count;
      }
    }

    const topTechnologies = Object.entries(techCounts)
      .map(([tech, count]) => ({ tech, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAgents: this.agentLearning.size,
      totalExperiences,
      overallSuccessRate: totalExperiences > 0 ? totalSuccesses / totalExperiences : 0,
      topTechnologies,
      topKeywords,
      agentStats,
      reflectionSessions: this.sessions.length
    };
  }

  /**
   * Enable automatic reflection
   */
  enableAutoReflection(intervalMinutes = 30): void {
    if (this.autoReflectionEnabled) {
      console.log('⚠️  Auto-reflection already enabled');
      return;
    }

    this.autoReflectionEnabled = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    this.autoReflectionInterval = setInterval(async () => {
      console.log('\n⏰ Auto-reflection triggered\n');
      await this.conductReflectionSession();
    }, intervalMs);

    console.log(`✅ Auto-reflection enabled (every ${intervalMinutes} minutes)`);
  }

  /**
   * Disable automatic reflection
   */
  disableAutoReflection(): void {
    if (!this.autoReflectionEnabled) {
      console.log('⚠️  Auto-reflection not enabled');
      return;
    }

    if (this.autoReflectionInterval) {
      clearInterval(this.autoReflectionInterval);
      this.autoReflectionInterval = undefined;
    }

    this.autoReflectionEnabled = false;
    console.log('✅ Auto-reflection disabled');
  }

  /**
   * Get recent reflection sessions
   */
  getRecentSessions(limit = 5): LearningSession[] {
    return this.sessions.slice(-limit);
  }

  /**
   * Cross-agent knowledge transfer
   */
  async transferKnowledge(
    fromAgentId: string,
    toAgentId: string,
    topic: string
  ): Promise<{ transferred: number; examples: string[] }> {
    const fromLearning = this.agentLearning.get(fromAgentId);
    if (!fromLearning) {
      throw new Error(`Source agent ${fromAgentId} not found`);
    }

    // Search for relevant knowledge
    const knowledge = await fromLearning.searchSimilarExperiences(topic, 5);

    // Notify target agent
    this.messageBus.publish({
      type: MessageType.AGENT_REPLY,
      from: fromAgentId,
      to: toAgentId,
      payload: {
        event: 'knowledge_transfer',
        topic,
        knowledge: knowledge.map(k => k.experience)
      }
    });

    return {
      transferred: knowledge.length,
      examples: knowledge.slice(0, 3).map(k => k.experience.substring(0, 100) + '...')
    };
  }

  /**
   * Generate knowledge graph
   */
  generateKnowledgeGraph(): {
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  } {
    const nodes: Array<{ id: string; label: string; type: string }> = [];
    const edges: Array<{ from: string; to: string; label: string }> = [];

    // Add agent nodes
    for (const [agentId, learning] of this.agentLearning.entries()) {
      const stats = learning.getStats();
      nodes.push({
        id: agentId,
        label: `Agent (${stats.totalExperiences} exp)`,
        type: 'agent'
      });

      // Add technology nodes and edges
      for (const { tech } of stats.topTechnologies) {
        const techId = `tech-${tech}`;
        if (!nodes.find(n => n.id === techId)) {
          nodes.push({
            id: techId,
            label: tech,
            type: 'technology'
          });
        }
        edges.push({
          from: agentId,
          to: techId,
          label: 'uses'
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Shutdown learning coordinator
   */
  shutdown(): void {
    this.disableAutoReflection();
    this.agentLearning.clear();
    this.sessions = [];
  }
}

/**
 * Global learning coordinator instance
 */
export const globalLearningCoordinator = new LearningCoordinator();
