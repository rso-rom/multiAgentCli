import { eventBus, AskStorePayload } from './event-system';
import { MemoryManager } from '../memory/memory-manager';
import crypto from 'crypto';

/**
 * Handler for storing and retrieving user prompts
 * Stores prompts in Long-term memory for semantic search
 */
export class AskStoreHandler {
  private memory: MemoryManager;
  private sessionId: string;
  private enabled: boolean;

  constructor(memory: MemoryManager, enabled = true) {
    this.memory = memory;
    this.enabled = enabled;
    this.sessionId = this.generateSessionId();

    if (this.enabled) {
      this.setupEventHandlers();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    eventBus.onAskStore(async (payload: AskStorePayload) => {
      await this.storePrompt(payload);
    });
  }

  /**
   * Store prompt in long-term memory
   */
  async storePrompt(payload: AskStorePayload): Promise<void> {
    if (!this.enabled) return;

    try {
      const id = crypto.randomUUID();

      const metadata = {
        ...payload.metadata,
        agent: payload.agent,
        sessionId: this.sessionId,
        timestamp: payload.timestamp.toISOString(),
        stored_at: new Date().toISOString()
      };

      await this.memory.storeLong(id, payload.text, metadata);

      console.log(`✅ Prompt stored: ${id.substring(0, 8)}...`);
    } catch (error: any) {
      console.error(`❌ Failed to store prompt: ${error.message}`);
    }
  }

  /**
   * Search for similar prompts using semantic search
   */
  async searchPrompts(query: string, limit = 5): Promise<Array<{
    id: string;
    text: string;
    similarity: number;
    metadata: any;
  }>> {
    try {
      const results = await this.memory.searchLong(query, limit);

      return results.map(r => ({
        id: r.id,
        text: r.text,
        similarity: r.score,
        metadata: r.metadata
      }));
    } catch (error: any) {
      console.error(`❌ Failed to search prompts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent prompts (chronologically)
   */
  async getRecentPrompts(limit = 10): Promise<Array<{
    id: string;
    text: string;
    timestamp: string;
    metadata: any;
  }>> {
    try {
      // Search with empty query to get all, sorted by timestamp
      const results = await this.memory.searchLong('', limit);

      // Sort by timestamp descending
      results.sort((a, b) => {
        const timeA = new Date(a.metadata.timestamp || 0).getTime();
        const timeB = new Date(b.metadata.timestamp || 0).getTime();
        return timeB - timeA;
      });

      return results.map(r => ({
        id: r.id,
        text: r.text,
        timestamp: r.metadata.timestamp || '',
        metadata: r.metadata
      }));
    } catch (error: any) {
      console.error(`❌ Failed to get recent prompts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get prompts by session ID
   */
  async getPromptsBySession(sessionId: string, limit = 10): Promise<Array<{
    id: string;
    text: string;
    timestamp: string;
    metadata: any;
  }>> {
    try {
      // Search for sessionId in metadata
      // This is a workaround - ideally Qdrant should support metadata filtering
      const allResults = await this.memory.searchLong('', limit * 2);

      const filtered = allResults
        .filter(r => r.metadata.sessionId === sessionId)
        .slice(0, limit)
        .map(r => ({
          id: r.id,
          text: r.text,
          timestamp: r.metadata.timestamp || '',
          metadata: r.metadata
        }));

      return filtered;
    } catch (error: any) {
      console.error(`❌ Failed to get session prompts: ${error.message}`);
      return [];
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable/disable prompt storage
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Prompt storage ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if storage is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Create global ask-store handler
 */
export async function createAskStoreHandler(
  memory: MemoryManager
): Promise<AskStoreHandler> {
  const enabled = process.env.ASK_STORE_ENABLED !== 'false';
  return new AskStoreHandler(memory, enabled);
}
