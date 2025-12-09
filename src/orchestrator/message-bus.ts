import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Message types for inter-agent communication
 */
export enum MessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  TASK_PROGRESS = 'task_progress',
  AGENT_STATUS = 'agent_status',
  AGENT_QUERY = 'agent_query',
  AGENT_REPLY = 'agent_reply',
  BROADCAST = 'broadcast',
  ERROR = 'error'
}

/**
 * Message structure for agent communication
 */
export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string;
  to: string | 'all'; // 'all' for broadcast
  timestamp: Date;
  payload: any;
  correlationId?: string; // For request-response tracking
}

/**
 * Message Bus for real-time inter-agent communication
 * Uses EventEmitter for in-memory pub/sub (can be extended to Redis)
 */
export class MessageBus {
  private emitter: EventEmitter;
  private messageHistory: AgentMessage[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Support many agents
  }

  /**
   * Publish a message to the bus
   */
  publish(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Store in history
    this.messageHistory.push(fullMessage);
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift(); // Remove oldest
    }

    // Emit to subscribers
    if (fullMessage.to === 'all') {
      this.emitter.emit('broadcast', fullMessage);
    } else {
      this.emitter.emit(`message:${fullMessage.to}`, fullMessage);
    }

    // Also emit by message type for filtering
    this.emitter.emit(`type:${fullMessage.type}`, fullMessage);

    return fullMessage;
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribe(agentId: string, handler: (message: AgentMessage) => void): void {
    this.emitter.on(`message:${agentId}`, handler);
  }

  /**
   * Subscribe to broadcast messages
   */
  subscribeBroadcast(handler: (message: AgentMessage) => void): void {
    this.emitter.on('broadcast', handler);
  }

  /**
   * Subscribe to messages by type
   */
  subscribeByType(type: MessageType, handler: (message: AgentMessage) => void): void {
    this.emitter.on(`type:${type}`, handler);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string, handler: (message: AgentMessage) => void): void {
    this.emitter.off(`message:${agentId}`, handler);
  }

  /**
   * Unsubscribe from broadcasts
   */
  unsubscribeBroadcast(handler: (message: AgentMessage) => void): void {
    this.emitter.off('broadcast', handler);
  }

  /**
   * Request-response pattern (async)
   */
  async request(
    from: string,
    to: string,
    type: MessageType,
    payload: any,
    timeout = 30000
  ): Promise<AgentMessage> {
    const correlationId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.emitter.off(`response:${correlationId}`, responseHandler);
        reject(new Error(`Request timeout: no response from ${to}`));
      }, timeout);

      const responseHandler = (response: AgentMessage) => {
        clearTimeout(timeoutId);
        this.emitter.off(`response:${correlationId}`, responseHandler);
        resolve(response);
      };

      this.emitter.once(`response:${correlationId}`, responseHandler);

      this.publish({
        type,
        from,
        to,
        payload,
        correlationId
      });
    });
  }

  /**
   * Send response to a request
   */
  respond(originalMessage: AgentMessage, from: string, payload: any): void {
    if (!originalMessage.correlationId) {
      throw new Error('Cannot respond to message without correlationId');
    }

    const response = this.publish({
      type: MessageType.TASK_RESPONSE,
      from,
      to: originalMessage.from,
      payload,
      correlationId: originalMessage.correlationId
    });

    this.emitter.emit(`response:${originalMessage.correlationId}`, response);
  }

  /**
   * Get message history
   */
  getHistory(filter?: {
    from?: string;
    to?: string;
    type?: MessageType;
    since?: Date;
  }): AgentMessage[] {
    let history = [...this.messageHistory];

    if (filter) {
      if (filter.from) {
        history = history.filter(m => m.from === filter.from);
      }
      if (filter.to) {
        history = history.filter(m => m.to === filter.to);
      }
      if (filter.type) {
        history = history.filter(m => m.type === filter.type);
      }
      if (filter.since) {
        history = history.filter(m => m.timestamp >= filter.since!);
      }
    }

    return history;
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<string, number>;
    messagesByAgent: Record<string, number>;
  } {
    const messagesByType: Record<string, number> = {};
    const messagesByAgent: Record<string, number> = {};

    this.messageHistory.forEach(msg => {
      messagesByType[msg.type] = (messagesByType[msg.type] || 0) + 1;
      messagesByAgent[msg.from] = (messagesByAgent[msg.from] || 0) + 1;
    });

    return {
      totalMessages: this.messageHistory.length,
      messagesByType,
      messagesByAgent
    };
  }
}

/**
 * Global message bus instance
 */
export const globalMessageBus = new MessageBus();
