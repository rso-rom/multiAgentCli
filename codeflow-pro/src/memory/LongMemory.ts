// src/memory/LongMemory.ts
import { QdrantHelper } from '../orchestrator/qdrant-embed';

/**
 * Long-term memory wrapper around QdrantHelper.
 * Contains small convenience methods that the MemoryManager uses.
 */
export class LongMemory {
  private helper: QdrantHelper;
  private collection: string;

  constructor(qdrantUrl: string, collection: string) {
    this.collection = collection;
    this.helper = new QdrantHelper(qdrantUrl, collection);
  }

  async ensure(dim = 384) {
    await this.helper.ensureCollection(dim);
  }

  async upsert(id: string, text: string) {
    return this.helper.upsert(id, text);
  }

  async upsertLarge(idPrefix: string, text: string, chunkSize = 2000) {
    return this.helper.upsert(idPrefix, text); // delegate; QdrantHelper also has upsert logic
    // If you prefer chunking, you can call helper.upsert multiple times (see earlier memory-tiers).
  }

  async search(query: string, limit = 5) {
    return this.helper.search(query, limit);
  }
}
