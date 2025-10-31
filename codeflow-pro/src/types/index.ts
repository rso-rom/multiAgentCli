export type ExecutionMode = 'safe' | 'direct' | 'docker';

export type AgentPolicy = 'auto' | 'ask' | 'never';

export interface ToolDescriptor {
  name: string;
  type: string;
  usage: string;
  cli?: string;
  version?: string;
  available?: boolean;
}

export interface AgentConfig {
  name: string;
  model: string;
  prompt?: string;
  authType?: 'apiKey' | 'login';
  apiKey?: string;
  username?: string;
  password?: string;
  contextKeys?: string[];
  memoryLayers?: ('short' | 'mid' | 'long')[];
  policy?: AgentPolicy;
  capabilities?: string[];
  tools?: ToolDescriptor[];
}

export interface WorkflowStep {
  agent: string;
  input?: string;
  input_from?: string;
  save_as?: string;
  stream?: boolean;
}

export interface WorkflowExecution {
  mode?: 'sequential' | 'parallel';
}

export interface WorkflowDef {
  name?: string;
  description?: string;
  agents: Record<string, AgentConfig>;
  steps: WorkflowStep[];
  context?: Record<string, any>;
  execution?: WorkflowExecution;
}
