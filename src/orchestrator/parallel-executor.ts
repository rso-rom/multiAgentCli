import { Agent } from './agent';
import { globalTaskQueue, Task } from './task-queue';
import { eventBus } from './event-system';

/**
 * Result of parallel execution
 */
export interface ParallelExecutionResult {
  agentName: string;
  output: string;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Parallel executor for running multiple agents concurrently
 */
export class ParallelExecutor {
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute multiple agents in parallel
   */
  async executeParallel(
    agents: Map<string, Agent>,
    inputs: Map<string, string>,
    context: Record<string, any> = {}
  ): Promise<Map<string, ParallelExecutionResult>> {
    const results = new Map<string, ParallelExecutionResult>();
    const tasks: Array<Promise<void>> = [];

    // Create promises for each agent
    for (const [name, agent] of agents.entries()) {
      const input = inputs.get(name);
      if (!input) continue;

      const task = this.executeAgent(agent, input, context).then(result => {
        results.set(name, result);
      });

      tasks.push(task);
    }

    // Wait for all to complete
    await Promise.all(tasks);

    return results;
  }

  /**
   * Execute tasks with concurrency limit
   */
  async executeWithConcurrency(
    agents: Map<string, Agent>,
    tasks: Task[]
  ): Promise<Map<string, ParallelExecutionResult>> {
    const results = new Map<string, ParallelExecutionResult>();
    const executing = new Set<Promise<void>>();

    for (const task of tasks) {
      const agent = agents.get(task.agentName);
      if (!agent) {
        console.error(`Agent ${task.agentName} not found`);
        continue;
      }

      // Execute task
      const promise = this.executeAgent(agent, task.input, task.context || {})
        .then(result => {
          results.set(task.agentName, result);
          executing.delete(promise);
        });

      executing.add(promise);

      // Wait if we've hit the concurrency limit
      if (executing.size >= this.maxConcurrent) {
        await Promise.race(executing);
      }
    }

    // Wait for remaining tasks
    await Promise.all(executing);

    return results;
  }

  /**
   * Execute single agent with error handling
   */
  private async executeAgent(
    agent: Agent,
    input: string,
    context: Record<string, any>
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();

    try {
      // Emit start event
      eventBus.emitAgentStart({
        agent: agent.name,
        input,
        timestamp: new Date()
      });

      // Execute agent
      const output = await agent.act(input, context);
      const duration = Date.now() - startTime;

      // Emit complete event
      eventBus.emitAgentComplete({
        agent: agent.name,
        output,
        duration,
        timestamp: new Date()
      });

      return {
        agentName: agent.name,
        output,
        duration,
        success: true
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.error(`❌ Agent ${agent.name} failed: ${error.message}`);

      return {
        agentName: agent.name,
        output: '',
        duration,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set maximum concurrent executions
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
  }
}
