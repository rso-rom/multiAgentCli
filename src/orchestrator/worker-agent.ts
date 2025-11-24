import { MessageBus, MessageType, AgentMessage, globalMessageBus } from './message-bus';
import { AgentLearning } from './agent-learning';
import { LearningCoordinator, globalLearningCoordinator } from './learning-coordinator';
import crypto from 'crypto';

/**
 * Agent capabilities/specializations
 */
export enum AgentCapability {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DEVOPS = 'devops',
  DESIGN = 'design',
  DATABASE = 'database',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  GENERAL = 'general'
}

/**
 * Agent status
 */
export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  STOPPED = 'stopped'
}

/**
 * Task result
 */
export interface TaskResult {
  success: boolean;
  output?: any;
  error?: string;
  duration?: number;
}

/**
 * Base class for worker agents
 */
export abstract class WorkerAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly capabilities: AgentCapability[];
  protected messageBus: MessageBus;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected currentTask: string | null = null;
  protected learning: AgentLearning;
  protected learningCoordinator: LearningCoordinator;
  protected learningEnabled: boolean = true;
  protected backend: any; // LLM Backend for agent reasoning

  constructor(
    name: string,
    capabilities: AgentCapability[],
    backend?: any,
    messageBus: MessageBus = globalMessageBus,
    learningCoordinator: LearningCoordinator = globalLearningCoordinator
  ) {
    this.id = `agent-${crypto.randomUUID().substring(0, 8)}`;
    this.name = name;
    this.capabilities = capabilities;
    this.backend = backend;
    this.messageBus = messageBus;
    this.learningCoordinator = learningCoordinator;

    // Initialize learning component
    this.learning = this.learningCoordinator.registerAgent(this.id, this.name, this.capabilities);

    this.setupMessageHandlers();
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers(): void {
    // Subscribe to messages for this agent
    this.messageBus.subscribe(this.id, this.handleMessage.bind(this));

    // Subscribe to broadcasts
    this.messageBus.subscribeBroadcast(this.handleBroadcast.bind(this));
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(message: AgentMessage): Promise<void> {
    try {
      switch (message.type) {
        case MessageType.TASK_REQUEST:
          await this.handleTaskRequest(message);
          break;

        case MessageType.AGENT_QUERY:
          await this.handleQuery(message);
          break;

        default:
          await this.handleCustomMessage(message);
      }
    } catch (error: any) {
      this.sendError(message.from, error.message, message.correlationId);
    }
  }

  /**
   * Handle broadcast messages
   */
  private async handleBroadcast(message: AgentMessage): Promise<void> {
    // Agents can override this to react to broadcasts
    await this.onBroadcast(message);
  }

  /**
   * Handle task requests
   */
  private async handleTaskRequest(message: AgentMessage): Promise<void> {
    if (this.status === AgentStatus.BUSY) {
      this.messageBus.respond(message, this.id, {
        success: false,
        error: `Agent ${this.name} is busy`
      });
      return;
    }

    this.status = AgentStatus.BUSY;
    this.currentTask = message.payload.task;

    try {
      // Before executing: Check if we have similar past experiences
      if (this.learningEnabled) {
        const similarExperiences = await this.learning.searchSimilarExperiences(message.payload.task, 3);
        if (similarExperiences.length > 0) {
          // Agent has learned from similar tasks!
          await this.onSimilarExperienceFound(similarExperiences);
        }
      }

      // Execute the task
      const startTime = Date.now();
      const result = await this.executeTask(message.payload.task, message.payload.context);
      const duration = Date.now() - startTime;

      // Record successful experience
      if (this.learningEnabled) {
        await this.learning.recordExperience(
          message.payload.task,
          true, // success
          result,
          undefined, // no error
          duration,
          message.payload.context
        );
      }

      // Send response
      this.messageBus.respond(message, this.id, {
        success: true,
        output: result,
        duration
      });

      this.status = AgentStatus.IDLE;
      this.currentTask = null;
    } catch (error: any) {
      // Record failed experience
      if (this.learningEnabled) {
        await this.learning.recordExperience(
          message.payload.task,
          false, // failed
          undefined,
          error.message,
          undefined,
          message.payload.context
        );
      }

      this.status = AgentStatus.ERROR;
      this.messageBus.respond(message, this.id, {
        success: false,
        error: error.message
      });

      setTimeout(() => {
        this.status = AgentStatus.IDLE;
        this.currentTask = null;
      }, 1000);
    }
  }

  /**
   * Handle queries about agent
   */
  private async handleQuery(message: AgentMessage): Promise<void> {
    this.messageBus.respond(message, this.id, {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      status: this.status,
      currentTask: this.currentTask
    });
  }

  /**
   * Execute a task (must be implemented by subclasses)
   */
  protected abstract executeTask(task: string, context?: any): Promise<any>;

  /**
   * Handle custom message types (can be overridden)
   */
  protected async handleCustomMessage(message: AgentMessage): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Handle broadcast messages (can be overridden)
   */
  protected async onBroadcast(message: AgentMessage): Promise<void> {
    // React to knowledge sharing events
    if (message.payload.event === 'knowledge_shared') {
      await this.onKnowledgeShared(message.payload.patterns, message.payload.insights);
    }
  }

  /**
   * Called when similar experiences are found (can be overridden)
   */
  protected async onSimilarExperienceFound(
    experiences: Array<{ experience: string; similarity: number; metadata: any }>
  ): Promise<void> {
    // Agents can use this to learn from past experiences
    // Override in subclass to implement custom learning behavior
  }

  /**
   * Called when knowledge is shared (can be overridden)
   */
  protected async onKnowledgeShared(patterns: any[], insights: any[]): Promise<void> {
    // Agents can use this to learn from collective insights
    // Override in subclass to implement custom learning behavior
  }

  /**
   * Query knowledge from this agent's learning
   */
  protected async queryKnowledge(query: string, limit = 5): Promise<any[]> {
    return await this.learning.searchSimilarExperiences(query, limit);
  }

  /**
   * Query collective knowledge from all agents
   */
  protected async queryCollectiveKnowledge(query: string, limit = 5): Promise<any[]> {
    return await this.learningCoordinator.queryCollectiveKnowledge(query, limit);
  }

  /**
   * Send a message to another agent
   */
  protected sendMessage(to: string, type: MessageType, payload: any): void {
    this.messageBus.publish({
      type,
      from: this.id,
      to,
      payload
    });
  }

  /**
   * Send a broadcast message
   */
  protected broadcast(type: MessageType, payload: any): void {
    this.messageBus.publish({
      type,
      from: this.id,
      to: 'all',
      payload
    });
  }

  /**
   * Send an error message
   */
  protected sendError(to: string, error: string, correlationId?: string): void {
    this.messageBus.publish({
      type: MessageType.ERROR,
      from: this.id,
      to,
      payload: { error },
      correlationId
    });
  }

  /**
   * Send progress update
   */
  protected sendProgress(to: string, progress: number, message?: string): void {
    this.messageBus.publish({
      type: MessageType.TASK_PROGRESS,
      from: this.id,
      to,
      payload: { progress, message }
    });
  }

  /**
   * Request help from another agent
   */
  protected async requestHelp(agentId: string, task: string): Promise<any> {
    const response = await this.messageBus.request(
      this.id,
      agentId,
      MessageType.TASK_REQUEST,
      { task }
    );
    return response.payload;
  }

  /**
   * Get agent info
   */
  public getInfo(): {
    id: string;
    name: string;
    capabilities: AgentCapability[];
    status: AgentStatus;
    currentTask: string | null;
  } {
    return {
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      status: this.status,
      currentTask: this.currentTask
    };
  }

  /**
   * Stop the agent
   */
  public stop(): void {
    this.status = AgentStatus.STOPPED;
    // Could unsubscribe from message bus here
  }
}
