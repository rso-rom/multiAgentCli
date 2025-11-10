import { LMDBMemory } from './lmdb-memory';
import { QdrantMemory } from './qdrant-memory';
import { MemoryManager, MemoryConfig } from './memory-manager';

/**
 * Factory functions for creating memory instances
 */

/**
 * Create a short-term LMDB memory (ephemeral)
 */
export function createShortTermMemory(dbPath: string): LMDBMemory {
  return new LMDBMemory(dbPath, false);
}

/**
 * Create a mid-term LMDB memory (persistent)
 */
export function createMidTermMemory(dbPath: string): LMDBMemory {
  return new LMDBMemory(dbPath, true);
}

/**
 * Create a long-term Qdrant memory
 */
export function createLongTermMemory(
  url: string,
  collectionName: string
): QdrantMemory {
  return new QdrantMemory(url, collectionName);
}

/**
 * Create a complete memory manager for a project
 */
export function createMemoryManager(
  projectName: string = 'default',
  config?: MemoryConfig
): MemoryManager {
  return new MemoryManager(projectName, config);
}

/**
 * Create memory manager with environment-based configuration
 */
export function createMemoryManagerFromEnv(projectName: string): MemoryManager {
  const config: MemoryConfig = {
    basePath: process.env.MEMORY_PATH || './memory',
    useQdrant: process.env.USE_QDRANT !== 'false',
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333'
  };

  return new MemoryManager(projectName, config);
}
