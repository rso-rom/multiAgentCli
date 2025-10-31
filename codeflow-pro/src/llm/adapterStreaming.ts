import { EventEmitter } from 'events';
import { ModelStream } from './streamAdapter';
import { MemoryManager } from '../memory/MemoryManager';
import { AgentPolicy } from '../types';

export interface StreamingRunnerOptions {
  agentName: string;
  model: string;
  prompt: string;
  memory: MemoryManager;
  policy?: AgentPolicy;
  metadata?: Record<string, unknown>;
  streamOptions?: Record<string, unknown>;
}

export interface AskStorePayload {
  agent: string;
  text: string;
  meta: any;
  confirm: (options?: { storeLong?: boolean }) => Promise<any>;
  skip: () => void;
}

export class StreamingRunner extends EventEmitter {
  private readonly opts: StreamingRunnerOptions;
  private buffer = '';

  constructor(opts: StreamingRunnerOptions) {
    super();
    this.opts = opts;
  }

  async run(): Promise<string> {
    const stream = new ModelStream(this.opts.model, this.opts.prompt, this.opts.streamOptions);
    stream.on('chunk', (chunk: string) => {
      this.buffer += chunk;
      this.emit('chunk', { agent: this.opts.agentName, chunk });
    });
    stream.on('error', (error: Error) => this.emit('error', { agent: this.opts.agentName, error }));

    await new Promise<void>((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.start().catch(reject);
    });

    const meta = await this.handleStorage();
    this.emit('end', { agent: this.opts.agentName, meta, text: this.buffer, metadata: this.opts.metadata });
    return this.buffer;
  }

  private async handleStorage() {
    const policy = this.opts.policy ?? 'auto';
    const memory = this.opts.memory;
    if (!memory) return { decision: 'skip' };

    let meta = await memory.store(this.opts.agentName, this.buffer);

    if (policy === 'never') {
      return { ...meta, decision: 'discard', storedMid: false, storedLong: false, askRequired: false };
    }

    if (policy === 'ask' && meta.decision === 'auto') {
      meta = { ...meta, decision: 'ask', askRequired: true };
    }

    if (meta.askRequired) {
      const payload: AskStorePayload = {
        agent: this.opts.agentName,
        text: this.buffer,
        meta,
        confirm: async (options) => {
          const forced = await memory.storeForced(this.opts.agentName, this.buffer, options ?? {});
          this.emit('stored', { agent: this.opts.agentName, forced });
          return forced;
        },
        skip: () => {
          this.emit('skip-store', { agent: this.opts.agentName });
        },
      };
      this.emit('ask-store', payload);
    } else if (meta.storedMid || meta.storedLong) {
      this.emit('stored', { agent: this.opts.agentName, meta });
    }

    return meta;
  }
}
