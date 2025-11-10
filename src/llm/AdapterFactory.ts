import { MemoryManager } from '../memory/memory-manager';
import { DynamicAdapter } from './DynamicAdapter';
import { ModelSpecSource } from './ModelSpecSource';

/**
 * Factory for creating dynamic adapters
 */
export class AdapterFactory {
  private static adapters = new Map<string, DynamicAdapter>();

  /**
   * Get or create an adapter for a model
   */
  static async getAdapter(
    source: ModelSpecSource,
    memory: MemoryManager
  ): Promise<DynamicAdapter> {
    // Check if adapter already exists
    if (this.adapters.has(source.model)) {
      return this.adapters.get(source.model)!;
    }

    // Create new adapter
    const adapter = new DynamicAdapter(source, memory);
    await adapter.loadSpec(source);

    // Cache adapter
    this.adapters.set(source.model, adapter);

    return adapter;
  }

  /**
   * Create a new adapter (bypasses cache)
   */
  static async createAdapter(
    source: ModelSpecSource,
    memory: MemoryManager
  ): Promise<DynamicAdapter> {
    const adapter = new DynamicAdapter(source, memory);
    await adapter.loadSpec(source);
    return adapter;
  }

  /**
   * Clear cached adapter
   */
  static clearAdapter(model: string): void {
    this.adapters.delete(model);
  }

  /**
   * Clear all cached adapters
   */
  static clearAll(): void {
    this.adapters.clear();
  }

  /**
   * Get all cached adapter models
   */
  static getCachedModels(): string[] {
    return Array.from(this.adapters.keys());
  }
}
