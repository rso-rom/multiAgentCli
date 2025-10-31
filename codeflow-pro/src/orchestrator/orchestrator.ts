import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { EventEmitter } from 'events';
import { ProjectMemory } from './projectMemory';
import { MemoryManager } from '../memory/MemoryManager';
import { AgentConfig, WorkflowDef, WorkflowStep } from '../types';
import { StreamingRunner, AskStorePayload } from '../llm/adapterStreaming';
import { checkAndInstallTool, buildToolContextPrompt, logToolUsage } from './ToolContext';
import { AgentAuthManager } from '../auth/agentAuthManager';
import { ExecutionController } from '../execution/executionController';
import { LLMAdapter } from '../llm/adapter';

export interface OrchestratorOptions {
  projectDir: string;
  useQdrant?: boolean;
  qdrantUrl?: string;
}

export class Orchestrator extends EventEmitter {
  readonly projectDir: string;
  readonly projectMem: ProjectMemory;
  readonly memory: MemoryManager;
  readonly auth: AgentAuthManager;
  readonly executor: ExecutionController;
  private agentCatalog: Record<string, AgentConfig> = {};

  constructor(projectDir: string, useQdrant = false, qdrantUrl?: string) {
    super();
    this.projectDir = path.resolve(projectDir);
    this.projectMem = new ProjectMemory(this.projectDir, useQdrant);
    this.memory = new MemoryManager(this.projectDir, { useQdrant, qdrantUrl });
    this.auth = new AgentAuthManager(this.projectMem);
    this.executor = new ExecutionController();
  }

  async runWorkflowFile(workflowPath: string) {
    const absolutePath = path.resolve(workflowPath);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const def = yaml.load(fileContent) as WorkflowDef;
    if (!def?.steps || !def?.agents) throw new Error('Workflow definition requires agents and steps.');

    this.agentCatalog = def.agents;
    await this.projectMem.set('context', def.context ?? {});
    if (def.context) {
      for (const [key, value] of Object.entries(def.context)) {
        await this.memory.short.set(`context:${key}`, value as any);
      }
    }

    this.emit('workflow-start', { name: def.name, description: def.description, path: absolutePath });

    const mode = def.execution?.mode ?? 'sequential';
    if (mode === 'parallel') {
      await Promise.all(def.steps.map((step, idx) => this.executeStep(def, step, idx)));
    } else {
      for (let i = 0; i < def.steps.length; i++) {
        await this.executeStep(def, def.steps[i], i);
      }
    }

    this.emit('workflow-finished', { name: def.name });
  }

  async invokeAgentOneshot(agentName: string, message: string, overrides: Partial<AgentConfig> = {}) {
    const base = this.agentCatalog[agentName] ?? { name: agentName, model: process.env.CODEFLOW_DEFAULT_MODEL ?? 'ollama:llama3' };
    const agent = { ...base, ...overrides, name: agentName } as AgentConfig;
    if (!agent.model) throw new Error(`Unknown agent ${agentName} and no model provided.`);

    if (agent.tools) {
      for (const tool of agent.tools) {
        await checkAndInstallTool(tool);
      }
    }

    const promptTemplate = agent.prompt ?? '{{input}}';
    const prompt = buildToolContextPrompt(agent.tools) + promptTemplate.replace('{{input}}', message);
    const output = await LLMAdapter.call(agent.model, prompt);

    const ts = Date.now();
    await this.projectMem.set(`${agent.name}.last`, output);
    await this.memory.short.set(`${agent.name}.last`, { agent: agent.name, text: output, ts });
    await this.memory.store(agent.name, output);
    return output;
  }

  private async executeStep(def: WorkflowDef, step: WorkflowStep, index: number) {
    const agentCfg = def.agents[step.agent];
    if (!agentCfg) throw new Error(`Unknown agent ${step.agent}`);

    const message = await this.buildInput(step, agentCfg);
    this.emit('step-start', { step: index, agent: agentCfg.name, input: message });

    const output = await this.runAgent(agentCfg, message, step, { workflow: def.name, step: index });

    const saveKey = step.save_as || `${agentCfg.name}.output`;
    await this.projectMem.set(saveKey, output);
    await this.memory.short.set(saveKey, { agent: agentCfg.name, text: output, ts: Date.now() });

    this.emit('step-complete', { step: index, agent: agentCfg.name, output });
  }

  private async runAgent(agent: AgentConfig, input: string, step: WorkflowStep, metadata: Record<string, unknown>) {
    if (agent.authType && agent.authType !== 'apiKey') {
      await this.auth.ensureAuth(agent);
    }

    if (agent.tools && agent.tools.length) {
      for (const tool of agent.tools) {
        const ok = await checkAndInstallTool(tool);
        if (!ok) tool.available = false;
      }
    }

    const contextSnippet = agent.contextKeys?.length
      ? await this.memory.assembleContext(agent.contextKeys, true, input)
      : '';

    const promptTemplate = agent.prompt ?? '{{input}}';
    const contextSection = contextSnippet ? `\n\n[Context]\n${contextSnippet}` : '';
    const finalPrompt = buildToolContextPrompt(agent.tools) + promptTemplate.replace('{{input}}', input) + contextSection;

    const runner = new StreamingRunner({
      agentName: agent.name,
      model: agent.model,
      prompt: finalPrompt,
      memory: this.memory,
      policy: agent.policy,
      metadata,
    });

    runner.on('chunk', (payload) => this.emit('chunk', payload));
    runner.on('ask-store', (payload: AskStorePayload) => this.emit('ask-store', payload));
    runner.on('stored', (payload) => this.emit('memory-stored', payload));
    runner.on('skip-store', (payload) => this.emit('memory-skipped', payload));
    runner.on('error', (payload) => this.emit('error', payload));

    const output = await runner.run();

    if (agent.tools) {
      for (const tool of agent.tools) {
        if (tool.available) {
          await logToolUsage(agent.name, tool, this.memory);
        }
      }
    }

    return output;
  }

  private async buildInput(step: WorkflowStep, agent: AgentConfig) {
    let message = step.input ?? '';
    if (step.input_from) {
      const fromProject = this.projectMem.get(step.input_from);
      const fromShort = this.memory.short.get(step.input_from);
      const fromMid = this.memory.mid.get(step.input_from);
      const val = fromProject ?? fromShort ?? fromMid;
      if (typeof val === 'string') message = val;
      else if (val) message = JSON.stringify(val);
    }
    if (!message) message = `No direct input provided for agent ${agent.name}.`;
    return message;
  }
}
