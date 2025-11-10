import { Agent } from './agent';
import { globalToolRegistry } from './tool-registry';
import { eventBus, AgentStartPayload, AgentCompletePayload } from './event-system';
import { WorkflowGraph } from './workflow-graph';
import * as yaml from 'js-yaml';
import fs from 'fs';

export interface WorkflowStep {
  agent: string;
  input: string;
  context_keys?: string[];
}

export interface WorkflowDefinition {
  name: string;
  description?: string;
  execution_mode?: 'sequential' | 'parallel';
  max_concurrent?: number;
  agents: Record<string, {
    role: string;
    backend: string;
    model?: string;
    tools?: string[];
    openApiUrl?: string;
    localJsonPath?: string;
  }>;
  steps: WorkflowStep[];
}

/**
 * Workflow orchestrates multiple agents to complete a task
 */
export class Workflow {
  definition: WorkflowDefinition;
  agents: Record<string, Agent> = {};
  results: Record<string, string> = {};
  private graph?: WorkflowGraph;

  constructor(definition: WorkflowDefinition) {
    this.definition = definition;

    // Initialize all agents
    for (const [name, conf] of Object.entries(definition.agents)) {
      this.agents[name] = new Agent(
        name,
        conf.role,
        conf.backend,
        conf.model,
        conf.tools,
        conf.openApiUrl,
        conf.localJsonPath
      );
    }
  }

  /**
   * Load workflow from YAML file
   */
  static fromFile(filePath: string): Workflow {
    const content = fs.readFileSync(filePath, 'utf-8');
    const definition = yaml.load(content) as WorkflowDefinition;
    return new Workflow(definition);
  }

  /**
   * Execute the workflow
   */
  async execute(): Promise<Record<string, string>> {
    // Initialize tool registry
    await globalToolRegistry.initialize();

    // Initialize memory manager for dynamic adapters
    const { createMemoryManager } = await import('../memory/memory-factory');
    const memory = await createMemoryManager();

    console.log(`\n🚀 Starting workflow: ${this.definition.name}`);
    if (this.definition.description) {
      console.log(`📝 ${this.definition.description}\n`);
    }

    // Initialize workflow graph visualization
    this.graph = new WorkflowGraph();
    for (const step of this.definition.steps) {
      this.graph.addNode(step.agent);
    }

    // Initialize dynamic adapters for agents that need them
    for (const agent of Object.values(this.agents)) {
      if (agent.openApiUrl || agent.localJsonPath) {
        await agent.initializeDynamicAdapter(memory);
      }
    }

    // Show tool status if any agent uses tools
    const hasTools = Object.values(this.definition.agents).some(a => a.tools && a.tools.length > 0);
    if (hasTools) {
      const status = globalToolRegistry.getStatus();
      console.log(`🔧 Tools: ${status.available}/${status.total} available\n`);
    }

    // Check execution mode
    const mode = this.definition.execution_mode || 'sequential';
    if (mode === 'parallel') {
      console.log(`⚡ Execution mode: parallel (max ${this.definition.max_concurrent || 3} concurrent)\n`);
      return await this.executeParallel();
    }

    console.log(`📝 Execution mode: sequential\n`);

    // Execute steps sequentially
    for (const step of this.definition.steps) {
      const agent = this.agents[step.agent];
      if (!agent) {
        throw new Error(`Unknown agent: ${step.agent}`);
      }

      // Build context from previous results
      const context: Record<string, any> = {};
      if (step.context_keys) {
        for (const key of step.context_keys) {
          if (this.results[key]) {
            context[key] = this.results[key];
          }
        }
      }

      console.log(`\n🤖 [${agent.name}] (${agent.role})`);
      console.log(`   Backend: ${agent.backendName}`);
      if (agent.dynamicAdapter) {
        console.log(`   Using: Dynamic Adapter (${agent.model})`);
      }
      console.log(`   Task: ${step.input}\n`);

      // Update graph and emit agent start event
      const startTime = Date.now();
      if (this.graph) {
        this.graph.updateNode(agent.name, 'running');
      }
      eventBus.emitAgentStart({
        agent: agent.name,
        input: step.input,
        timestamp: new Date()
      });

      const output = await agent.act(step.input, context);
      this.results[agent.name] = output;

      // Update graph and emit agent complete event
      const duration = Date.now() - startTime;
      if (this.graph) {
        this.graph.updateNode(agent.name, 'done', duration);
      }
      eventBus.emitAgentComplete({
        agent: agent.name,
        output,
        duration,
        timestamp: new Date()
      });
    }

    console.log(`\n✅ Workflow completed: ${this.definition.name}`);

    // Display final workflow graph
    if (this.graph) {
      console.log('\n📊 Workflow Execution Graph:');
      console.log(this.graph.generateASCII());
    }

    return this.results;
  }

  /**
   * Execute workflow in parallel mode
   */
  async executeParallel(): Promise<Record<string, string>> {
    const { ParallelExecutor } = await import('./parallel-executor');
    const executor = new ParallelExecutor(this.definition.max_concurrent || 3);

    // Initialize workflow graph visualization
    this.graph = new WorkflowGraph();
    for (const step of this.definition.steps) {
      this.graph.addNode(step.agent);
    }

    // Group steps by dependency level (steps without context_keys can run in parallel)
    const agentsMap = new Map<string, Agent>();
    const inputsMap = new Map<string, string>();

    // For simplicity, run all steps that don't have context_keys in parallel
    const independentSteps = this.definition.steps.filter(s => !s.context_keys || s.context_keys.length === 0);
    const dependentSteps = this.definition.steps.filter(s => s.context_keys && s.context_keys.length > 0);

    // Execute independent steps in parallel
    if (independentSteps.length > 0) {
      console.log(`\n⚡ Executing ${independentSteps.length} independent agents in parallel...\n`);

      for (const step of independentSteps) {
        const agent = this.agents[step.agent];
        if (!agent) {
          throw new Error(`Unknown agent: ${step.agent}`);
        }

        agentsMap.set(agent.name, agent);
        inputsMap.set(agent.name, step.input);

        console.log(`🤖 [${agent.name}] Queued (${agent.role})`);
      }

      const parallelResults = await executor.executeParallel(agentsMap, inputsMap, {});

      // Store results
      for (const [name, result] of parallelResults.entries()) {
        if (result.success) {
          this.results[name] = result.output;
          console.log(`\n✅ [${name}] Completed (${(result.duration / 1000).toFixed(2)}s)`);
        } else {
          console.error(`\n❌ [${name}] Failed: ${result.error}`);
        }
      }
    }

    // Execute dependent steps sequentially (they need context from previous steps)
    if (dependentSteps.length > 0) {
      console.log(`\n📝 Executing ${dependentSteps.length} dependent agents sequentially...\n`);

      for (const step of dependentSteps) {
        const agent = this.agents[step.agent];
        if (!agent) {
          throw new Error(`Unknown agent: ${step.agent}`);
        }

        // Build context from previous results
        const context: Record<string, any> = {};
        if (step.context_keys) {
          for (const key of step.context_keys) {
            if (this.results[key]) {
              context[key] = this.results[key];
            }
          }
        }

        console.log(`\n🤖 [${agent.name}] (${agent.role})`);
        console.log(`   Context: ${step.context_keys?.join(', ')}`);

        const startTime = Date.now();
        eventBus.emitAgentStart({
          agent: agent.name,
          input: step.input,
          timestamp: new Date()
        });

        const output = await agent.act(step.input, context);
        this.results[agent.name] = output;

        eventBus.emitAgentComplete({
          agent: agent.name,
          output,
          duration: Date.now() - startTime,
          timestamp: new Date()
        });

        console.log(`✅ [${agent.name}] Completed (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
      }
    }

    console.log(`\n✅ Workflow completed: ${this.definition.name}`);

    // Display final workflow graph
    if (this.graph) {
      console.log('\n📊 Workflow Execution Graph:');
      console.log(this.graph.generateASCII());
    }

    return this.results;
  }

  /**
   * Get results of a specific agent
   */
  getResult(agentName: string): string | undefined {
    return this.results[agentName];
  }

  /**
   * Get all results
   */
  getAllResults(): Record<string, string> {
    return { ...this.results };
  }
}
