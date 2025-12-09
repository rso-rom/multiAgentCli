import { AgentRegistry, globalAgentRegistry } from './agent-registry';
import { AgentCapability, WorkerAgent, TaskResult } from './worker-agent';
import { MessageBus, MessageType, globalMessageBus } from './message-bus';

/**
 * Task classification result
 */
interface TaskClassification {
  capability: AgentCapability;
  confidence: number;
  keywords: string[];
}

/**
 * Delegation result
 */
export interface DelegationResult {
  success: boolean;
  agentId?: string;
  agentName?: string;
  output?: any;
  error?: string;
  duration?: number;
}

/**
 * Task Delegator for intelligent task routing
 */
export class TaskDelegator {
  private registry: AgentRegistry;
  private messageBus: MessageBus;

  // Keyword mappings for task classification
  private capabilityKeywords: Record<AgentCapability, string[]> = {
    [AgentCapability.FRONTEND]: [
      'react', 'vue', 'angular', 'frontend', 'ui', 'css', 'html',
      'component', 'page', 'website', 'webapp', 'responsive'
    ],
    [AgentCapability.BACKEND]: [
      'api', 'backend', 'server', 'fastapi', 'django', 'flask',
      'express', 'endpoint', 'rest', 'graphql', 'database query'
    ],
    [AgentCapability.DEVOPS]: [
      'docker', 'kubernetes', 'deploy', 'ci/cd', 'pipeline',
      'container', 'helm', 'terraform', 'infrastructure'
    ],
    [AgentCapability.DESIGN]: [
      'photoshop', 'gimp', 'figma', 'design', 'logo', 'graphic',
      'watermark', 'image', 'mockup', 'prototype'
    ],
    [AgentCapability.DATABASE]: [
      'database', 'sql', 'postgres', 'mysql', 'mongodb', 'redis',
      'schema', 'migration', 'query', 'index'
    ],
    [AgentCapability.TESTING]: [
      'test', 'pytest', 'jest', 'unittest', 'e2e', 'integration',
      'unit test', 'coverage', 'mock'
    ],
    [AgentCapability.DOCUMENTATION]: [
      'docs', 'documentation', 'readme', 'api docs', 'docstring',
      'comment', 'explain', 'guide'
    ],
    [AgentCapability.GENERAL]: [
      'file', 'folder', 'script', 'tool', 'utility'
    ]
  };

  constructor(
    registry: AgentRegistry = globalAgentRegistry,
    messageBus: MessageBus = globalMessageBus
  ) {
    this.registry = registry;
    this.messageBus = messageBus;
  }

  /**
   * Classify a task based on keywords
   */
  classifyTask(task: string): TaskClassification[] {
    const taskLower = task.toLowerCase();
    const classifications: TaskClassification[] = [];

    for (const [capability, keywords] of Object.entries(this.capabilityKeywords)) {
      const matchedKeywords = keywords.filter(kw =>
        taskLower.includes(kw.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        classifications.push({
          capability: capability as AgentCapability,
          confidence: matchedKeywords.length / keywords.length,
          keywords: matchedKeywords
        });
      }
    }

    // Sort by confidence
    classifications.sort((a, b) => b.confidence - a.confidence);

    // If no classification, default to GENERAL
    if (classifications.length === 0) {
      classifications.push({
        capability: AgentCapability.GENERAL,
        confidence: 0.5,
        keywords: []
      });
    }

    return classifications;
  }

  /**
   * Find best agent for a task
   */
  findBestAgent(task: string): WorkerAgent | null {
    const classifications = this.classifyTask(task);

    // Try to find idle agent with matching capability
    for (const classification of classifications) {
      const agents = this.registry.findIdleWithCapability(classification.capability);
      if (agents.length > 0) {
        return agents[0]; // Return first available
      }
    }

    // Fallback: any idle agent with GENERAL capability
    const generalAgents = this.registry.findIdleWithCapability(AgentCapability.GENERAL);
    if (generalAgents.length > 0) {
      return generalAgents[0];
    }

    // Last resort: any idle agent
    const idleAgents = this.registry.findIdle();
    if (idleAgents.length > 0) {
      return idleAgents[0];
    }

    return null;
  }

  /**
   * Delegate a task to the best available agent
   */
  async delegate(task: string, context?: any, timeout = 60000): Promise<DelegationResult> {
    const agent = this.findBestAgent(task);

    if (!agent) {
      return {
        success: false,
        error: 'No available agents to handle this task'
      };
    }

    try {
      const response = await this.messageBus.request(
        'delegator',
        agent.id,
        MessageType.TASK_REQUEST,
        { task, context },
        timeout
      );

      return {
        success: response.payload.success,
        agentId: agent.id,
        agentName: agent.name,
        output: response.payload.output,
        error: response.payload.error,
        duration: response.payload.duration
      };
    } catch (error: any) {
      return {
        success: false,
        agentId: agent.id,
        agentName: agent.name,
        error: error.message
      };
    }
  }

  /**
   * Delegate to multiple agents in parallel
   */
  async delegateParallel(
    tasks: Array<{ task: string; context?: any }>,
    timeout = 60000
  ): Promise<DelegationResult[]> {
    const promises = tasks.map(({ task, context }) =>
      this.delegate(task, context, timeout)
    );

    return Promise.all(promises);
  }

  /**
   * Delegate complex task by breaking it down
   */
  async delegateComplex(
    mainTask: string,
    subtasks: string[],
    context?: any,
    timeout = 120000
  ): Promise<{
    success: boolean;
    mainTask: string;
    results: DelegationResult[];
    error?: string;
  }> {
    try {
      const taskObjects = subtasks.map(task => ({ task, context }));
      const results = await this.delegateParallel(taskObjects, timeout);

      const allSuccessful = results.every(r => r.success);

      return {
        success: allSuccessful,
        mainTask,
        results,
        error: allSuccessful ? undefined : 'Some subtasks failed'
      };
    } catch (error: any) {
      return {
        success: false,
        mainTask,
        results: [],
        error: error.message
      };
    }
  }

  /**
   * Get delegation statistics
   */
  getStats(): {
    availableAgents: number;
    idleAgents: number;
    busyAgents: number;
    capabilityCoverage: AgentCapability[];
  } {
    const stats = this.registry.getStats();
    const capabilityCoverage = Object.keys(stats.byCapability) as AgentCapability[];

    return {
      availableAgents: stats.total,
      idleAgents: stats.byStatus.idle,
      busyAgents: stats.byStatus.busy,
      capabilityCoverage
    };
  }
}

/**
 * Global task delegator
 */
export const globalTaskDelegator = new TaskDelegator();
