import { EventEmitter } from 'events';

/**
 * Event types for the orchestration system
 */
export enum OrchestratorEvent {
  AGENT_START = 'agent:start',
  AGENT_COMPLETE = 'agent:complete',
  AGENT_ERROR = 'agent:error',
  AGENT_INCOMPLETE = 'agent:incomplete',
  ASK_STORE = 'ask:store',
  MEMORY_STORE = 'memory:store',
  TOOL_USE = 'tool:use',
  WORKFLOW_START = 'workflow:start',
  WORKFLOW_COMPLETE = 'workflow:complete'
}

/**
 * Event payloads
 */
export interface AgentStartPayload {
  agent: string;
  input: string;
  timestamp: Date;
}

export interface AgentCompletePayload {
  agent: string;
  output: string;
  duration: number;
  timestamp: Date;
}

export interface AgentIncompletePayload {
  agent: string;
  partialOutput: string;
  remainingPrompt: string;
  reason: 'token_limit' | 'timeout' | 'error';
  timestamp: Date;
}

export interface AskStorePayload {
  agent: string;
  text: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * Global event bus for orchestration
 */
export class OrchestratorEventBus extends EventEmitter {
  private static instance: OrchestratorEventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Support many agents
  }

  static getInstance(): OrchestratorEventBus {
    if (!OrchestratorEventBus.instance) {
      OrchestratorEventBus.instance = new OrchestratorEventBus();
    }
    return OrchestratorEventBus.instance;
  }

  // Typed event emitters
  emitAgentStart(payload: AgentStartPayload): void {
    this.emit(OrchestratorEvent.AGENT_START, payload);
  }

  emitAgentComplete(payload: AgentCompletePayload): void {
    this.emit(OrchestratorEvent.AGENT_COMPLETE, payload);
  }

  emitAgentIncomplete(payload: AgentIncompletePayload): void {
    this.emit(OrchestratorEvent.AGENT_INCOMPLETE, payload);
  }

  emitAskStore(payload: AskStorePayload): void {
    this.emit(OrchestratorEvent.ASK_STORE, payload);
  }

  // Typed event listeners
  onAgentStart(handler: (payload: AgentStartPayload) => void): void {
    this.on(OrchestratorEvent.AGENT_START, handler);
  }

  onAgentComplete(handler: (payload: AgentCompletePayload) => void): void {
    this.on(OrchestratorEvent.AGENT_COMPLETE, handler);
  }

  onAgentIncomplete(handler: (payload: AgentIncompletePayload) => void): void {
    this.on(OrchestratorEvent.AGENT_INCOMPLETE, handler);
  }

  onAskStore(handler: (payload: AskStorePayload) => void): void {
    this.on(OrchestratorEvent.ASK_STORE, handler);
  }
}

// Export singleton instance
export const eventBus = OrchestratorEventBus.getInstance();
