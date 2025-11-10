import { QdrantClient } from '@qdrant/js-client-rest';
import { EmbeddingService } from './embedding-service';
import { EmbeddingFactory } from './embedding-factory';

/**
 * Qdrant-based vector memory for long-term semantic storage
 * Requires Qdrant server running (docker run -p 6333:6333 qdrant/qdrant)
 */
export class QdrantMemory {
  private client: QdrantClient;
  private collectionName: string;
  private embeddingService: EmbeddingService;

  constructor(
    url = 'http://localhost:6333',
    collectionName = 'codechat_memory',
    embeddingService?: EmbeddingService
  ) {
    this.client = new QdrantClient({ url });
    this.collectionName = collectionName;

    // Use provided embedding service or create from environment
    this.embeddingService = embeddingService || EmbeddingFactory.createFromEnv();
  }

  /**
   * Ensure collection exists with correct dimension
   */
  async ensureCollection(): Promise<void> {
    try {
      await this.client.getCollection(this.collectionName);
    } catch {
      // Collection doesn't exist, create it with embedding service dimension
      const dimension = this.embeddingService.getDimension();
      console.log(`Creating Qdrant collection ${this.collectionName} with ${dimension}D vectors`);

      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: dimension,
          distance: 'Cosine'
        }
      });
    }
  }

  /**
   * Generate embedding for text using configured embedding service
   */
  private async getEmbedding(text: string): Promise<number[]> {
    return await this.embeddingService.embed(text);
  }

  /**
   * Store text with embedding
   */
  async store(id: string, text: string, metadata: Record<string, any> = {}): Promise<void> {
    await this.ensureCollection();

    const vector = await this.getEmbedding(text);

    await this.client.upsert(this.collectionName, {
      points: [
        {
          id: id,
          vector,
          payload: {
            text,
            ...metadata,
            timestamp: new Date().toISOString()
          }
        }
      ]
    });
  }

  /**
   * Search for similar content
   */
  async search(query: string, limit = 5): Promise<Array<{ id: string; score: number; text: string; metadata: any }>> {
    await this.ensureCollection();

    const vector = await this.getEmbedding(query);

    const results = await this.client.search(this.collectionName, {
      vector,
      limit,
      with_payload: true
    });

    return results.map(r => ({
      id: String(r.id),
      score: r.score,
      text: (r.payload as any)?.text || '',
      metadata: r.payload || {}
    }));
  }

  /**
   * Get by ID
   */
  async get(id: string): Promise<{ text: string; metadata: any } | null> {
    try {
      const result = await this.client.retrieve(this.collectionName, {
        ids: [id],
        with_payload: true
      });

      if (result.length > 0) {
        const payload = result[0].payload as any;
        return {
          text: payload?.text || '',
          metadata: payload || {}
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Delete by ID
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(this.collectionName, {
      points: [id]
    });
  }

  /**
   * Clear entire collection
   */
  async clear(): Promise<void> {
    try {
      await this.client.deleteCollection(this.collectionName);
      await this.ensureCollection();
    } catch {
      // Collection might not exist
    }
  }

  /**
   * Get collection info
   */
  async getInfo(): Promise<any> {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch {
      return null;
    }
  }

  /**
   * Get embedding service info
   */
  getEmbeddingServiceInfo(): { name: string; dimension: number } {
    return {
      name: this.embeddingService.getName(),
      dimension: this.embeddingService.getDimension()
    };
  }
}
