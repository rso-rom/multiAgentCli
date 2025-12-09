import { AgentRegistry, globalAgentRegistry } from './agent-registry';
import { TaskDelegator, globalTaskDelegator, DelegationResult } from './task-delegator';
import { MessageBus, MessageType, globalMessageBus, AgentMessage } from './message-bus';
import { WorkerAgent, AgentCapability, AgentStatus } from './worker-agent';

/**
 * Master Agent - Single Point of Contact for user
 * Orchestrates all worker agents and provides unified interface
 */
export class MasterAgent {
  private registry: AgentRegistry;
  private delegator: TaskDelegator;
  private messageBus: MessageBus;
  private taskHistory: Array<{
    task: string;
    timestamp: Date;
    result: DelegationResult;
  }> = [];

  constructor(
    registry: AgentRegistry = globalAgentRegistry,
    delegator: TaskDelegator = globalTaskDelegator,
    messageBus: MessageBus = globalMessageBus
  ) {
    this.registry = registry;
    this.delegator = delegator;
    this.messageBus = messageBus;

    this.setupMessageHandlers();
  }

  /**
   * Setup message handlers for monitoring
   */
  private setupMessageHandlers(): void {
    // Monitor agent status changes
    this.messageBus.subscribeByType(MessageType.AGENT_STATUS, this.onAgentStatus.bind(this));

    // Monitor task progress
    this.messageBus.subscribeByType(MessageType.TASK_PROGRESS, this.onTaskProgress.bind(this));

    // Monitor errors
    this.messageBus.subscribeByType(MessageType.ERROR, this.onError.bind(this));
  }

  /**
   * Handle agent status changes
   */
  private onAgentStatus(message: AgentMessage): void {
    // Master agent monitors all status changes
    // Can implement logging, alerts, etc.
  }

  /**
   * Handle task progress updates
   */
  private onTaskProgress(message: AgentMessage): void {
    // Master agent can show progress to user
    const { progress, message: progressMsg } = message.payload;
    console.log(`📊 Progress from ${message.from}: ${progress}% ${progressMsg || ''}`);
  }

  /**
   * Handle errors from agents
   */
  private onError(message: AgentMessage): void {
    console.error(`❌ Error from ${message.from}: ${message.payload.error}`);
  }

  /**
   * Execute a task (main user interface)
   */
  async executeTask(task: string, context?: any): Promise<DelegationResult> {
    console.log(`\n🎯 Master Agent: Analyzing task...`);
    console.log(`   Task: "${task}"\n`);

    // Classify the task
    const classifications = this.delegator.classifyTask(task);
    const primaryClass = classifications[0];

    console.log(`📋 Task Classification:`);
    console.log(`   Primary: ${primaryClass.capability} (${(primaryClass.confidence * 100).toFixed(1)}% confidence)`);
    if (primaryClass.keywords.length > 0) {
      console.log(`   Keywords: ${primaryClass.keywords.join(', ')}`);
    }
    console.log('');

    // Find best agent
    const agent = this.delegator.findBestAgent(task);

    if (!agent) {
      console.log(`❌ No available agents for this task\n`);
      return {
        success: false,
        error: 'No available agents'
      };
    }

    console.log(`🤖 Delegating to: ${agent.name} (${agent.id})`);
    console.log(`   Capabilities: ${agent.capabilities.join(', ')}\n`);

    // Delegate the task
    const result = await this.delegator.delegate(task, context);

    // Store in history
    this.taskHistory.push({
      task,
      timestamp: new Date(),
      result
    });

    // Show result
    if (result.success) {
      console.log(`✅ Task completed successfully!`);
      if (result.duration) {
        console.log(`   Duration: ${result.duration}ms`);
      }
      console.log('');
    } else {
      console.log(`❌ Task failed: ${result.error}\n`);
    }

    return result;
  }

  /**
   * Execute complex task with multiple subtasks
   */
  async executeComplexTask(
    mainTask: string,
    subtasks: string[],
    context?: any
  ): Promise<{
    success: boolean;
    mainTask: string;
    results: DelegationResult[];
    error?: string;
  }> {
    console.log(`\n🎯 Master Agent: Executing complex task...`);
    console.log(`   Main Task: "${mainTask}"`);
    console.log(`   Subtasks: ${subtasks.length}\n`);

    // Show subtask breakdown
    subtasks.forEach((task, i) => {
      const classification = this.delegator.classifyTask(task);
      console.log(`   ${i + 1}. ${task}`);
      console.log(`      → ${classification[0].capability}`);
    });
    console.log('');

    // Execute in parallel
    console.log(`🚀 Spawning ${subtasks.length} worker agent(s)...\n`);

    const result = await this.delegator.delegateComplex(mainTask, subtasks, context);

    // Show results
    console.log(`📊 Results:`);
    result.results.forEach((r, i) => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} Subtask ${i + 1}: ${r.agentName || 'unknown'}`);
      if (r.error) {
        console.log(`      Error: ${r.error}`);
      }
    });
    console.log('');

    if (result.success) {
      console.log(`🎉 Complex task completed successfully!\n`);
    } else {
      console.log(`⚠️ Complex task completed with errors\n`);
    }

    return result;
  }

  /**
   * Spawn a new worker agent
   */
  spawnAgent(agent: WorkerAgent): void {
    console.log(`\n🤖 Spawning agent: ${agent.name}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   Capabilities: ${agent.capabilities.join(', ')}\n`);

    this.registry.register(agent);
  }

  /**
   * Kill an agent
   */
  killAgent(agentId: string): void {
    const agent = this.registry.getAgent(agentId);
    if (!agent) {
      console.log(`❌ Agent ${agentId} not found\n`);
      return;
    }

    console.log(`\n🔴 Stopping agent: ${agent.name} (${agentId})\n`);
    this.registry.unregister(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): Array<{
    id: string;
    name: string;
    capabilities: AgentCapability[];
    status: AgentStatus;
    currentTask: string | null;
  }> {
    return this.registry.getAllAgents().map(agent => agent.getInfo());
  }

  /**
   * Broadcast message to all agents
   */
  broadcast(message: string): void {
    console.log(`\n📢 Broadcasting to all agents: "${message}"\n`);

    this.messageBus.publish({
      type: MessageType.BROADCAST,
      from: 'master',
      to: 'all',
      payload: { message }
    });
  }

  /**
   * Get system status
   */
  getStatus(): {
    totalAgents: number;
    idleAgents: number;
    busyAgents: number;
    capabilities: AgentCapability[];
    taskHistory: number;
    messageStats: any;
  } {
    const stats = this.registry.getStats();
    const delegatorStats = this.delegator.getStats();
    const messageStats = this.messageBus.getStats();

    return {
      totalAgents: stats.total,
      idleAgents: stats.byStatus.idle,
      busyAgents: stats.byStatus.busy,
      capabilities: delegatorStats.capabilityCoverage,
      taskHistory: this.taskHistory.length,
      messageStats
    };
  }

  /**
   * Get task history
   */
  getTaskHistory(limit = 10): Array<{
    task: string;
    timestamp: Date;
    result: DelegationResult;
  }> {
    return this.taskHistory.slice(-limit);
  }

  /**
   * Clear task history
   */
  clearHistory(): void {
    this.taskHistory = [];
  }

  /**
   * Shutdown all agents
   */
  shutdown(): void {
    console.log(`\n🔴 Shutting down all agents...\n`);
    this.registry.stopAll();
    this.clearHistory();
    this.messageBus.clearHistory();
  }
}

/**
 * Global master agent instance
 */
export const globalMasterAgent = new MasterAgent();
