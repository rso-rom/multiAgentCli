import { LMDBMemory } from './lmdb-memory';
import { QdrantMemory } from './qdrant-memory';
import path from 'path';

/**
 * Memory Manager coordinates all 4 memory levels:
 * 1. Short-term (LMDB, ephemeral) - current session
 * 2. Mid-term (LMDB, persistent) - recent sessions
 * 3. Long-term (Qdrant) - semantic, searchable knowledge
 * 4. Global (Qdrant) - cross-project knowledge base
 */
export class MemoryManager {
  private shortTerm: LMDBMemory;
  private midTerm: LMDBMemory;
  private longTerm: QdrantMemory | null = null;
  private global: QdrantMemory | null = null;

  private projectName: string;
  private config: MemoryConfig;

  constructor(projectName: string, config: MemoryConfig = {}) {
    this.projectName = projectName;
    this.config = {
      basePath: config.basePath || './memory',
      useQdrant: config.useQdrant !== false, // default true
      qdrantUrl: config.qdrantUrl || 'http://localhost:6333',
      ...config
    };

    const projectPath = path.join(this.config.basePath!, projectName);

    // Initialize short-term (ephemeral)
    this.shortTerm = new LMDBMemory(
      path.join(projectPath, 'short.lmdb'),
      false // not persistent
    );

    // Initialize mid-term (persistent)
    this.midTerm = new LMDBMemory(
      path.join(projectPath, 'mid.lmdb'),
      true // persistent
    );

    // Initialize long-term (Qdrant, project-specific)
    if (this.config.useQdrant) {
      this.longTerm = new QdrantMemory(
        this.config.qdrantUrl,
        `${projectName}_long`
      );

      // Initialize global (Qdrant, shared across projects)
      this.global = new QdrantMemory(
        this.config.qdrantUrl,
        'global_memory'
      );
    }
  }

  // ========== Short-term Memory ==========

  async setShort(key: string, value: any): Promise<void> {
    await this.shortTerm.set(key, value);
  }

  async getShort(key: string): Promise<any> {
    return await this.shortTerm.get(key);
  }

  async getAllShort(): Promise<Record<string, any>> {
    return await this.shortTerm.all();
  }

  // ========== Mid-term Memory ==========

  async setMid(key: string, value: any): Promise<void> {
    await this.midTerm.set(key, value);
  }

  async getMid(key: string): Promise<any> {
    return await this.midTerm.get(key);
  }

  async getAllMid(): Promise<Record<string, any>> {
    return await this.midTerm.all();
  }

  // ========== Long-term Memory ==========

  async storeLong(id: string, text: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.longTerm) {
      throw new Error('Qdrant not enabled. Set useQdrant: true in config.');
    }
    await this.longTerm.store(id, text, { ...metadata, project: this.projectName });
  }

  async searchLong(query: string, limit = 5): Promise<any[]> {
    if (!this.longTerm) return [];
    return await this.longTerm.search(query, limit);
  }

  async deleteLong(id: string): Promise<void> {
    if (!this.longTerm) {
      throw new Error('Qdrant not enabled. Set useQdrant: true in config.');
    }
    await this.longTerm.delete(id);
  }

  // ========== Global Memory ==========

  async storeGlobal(id: string, text: string, metadata: Record<string, any> = {}): Promise<void> {
    if (!this.global) {
      throw new Error('Qdrant not enabled. Set useQdrant: true in config.');
    }
    await this.global.store(id, text, metadata);
  }

  async searchGlobal(query: string, limit = 5): Promise<any[]> {
    if (!this.global) return [];
    return await this.global.search(query, limit);
  }

  async deleteGlobal(id: string): Promise<void> {
    if (!this.global) {
      throw new Error('Qdrant not enabled. Set useQdrant: true in config.');
    }
    await this.global.delete(id);
  }

  // ========== Utility Methods ==========

  /**
   * Get memory status across all levels
   */
  async getStatus(): Promise<MemoryStatus> {
    const shortSize = await this.shortTerm.getSize();
    const midSize = await this.midTerm.getSize();

    let longInfo = null;
    let globalInfo = null;

    if (this.longTerm) {
      longInfo = await this.longTerm.getInfo();
    }

    if (this.global) {
      globalInfo = await this.global.getInfo();
    }

    return {
      project: this.projectName,
      shortTerm: {
        size: shortSize,
        type: 'LMDB (ephemeral)'
      },
      midTerm: {
        size: midSize,
        type: 'LMDB (persistent)'
      },
      longTerm: longInfo ? {
        enabled: true,
        collection: longInfo
      } : {
        enabled: false
      },
      global: globalInfo ? {
        enabled: true,
        collection: globalInfo
      } : {
        enabled: false
      }
    };
  }

  /**
   * Clear all memory (use with caution)
   */
  async clearAll(): Promise<void> {
    await this.shortTerm.clear();
    await this.midTerm.clear();

    if (this.longTerm) {
      await this.longTerm.clear();
    }

    // Note: We don't clear global memory by default
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.shortTerm.close();
    await this.midTerm.close();
  }
}

export interface MemoryConfig {
  basePath?: string;
  useQdrant?: boolean;
  qdrantUrl?: string;
}

export interface MemoryStatus {
  project: string;
  shortTerm: {
    size: number;
    type: string;
  };
  midTerm: {
    size: number;
    type: string;
  };
  longTerm: {
    enabled: boolean;
    collection?: any;
  };
  global: {
    enabled: boolean;
    collection?: any;
  };
}
