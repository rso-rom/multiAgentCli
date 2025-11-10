import { BaseEmbeddingService } from './embedding-service';

/**
 * Mock embedding service for testing
 * Generates random vectors (not suitable for production)
 */
export class MockEmbeddingService extends BaseEmbeddingService {
  constructor(dimension = 384) {
    super('mock', dimension);
  }

  async embed(text: string): Promise<number[]> {
    // Simple hash-based seeding for consistency within session
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Use hash as seed for pseudo-random generation
    const seed = Math.abs(hash);
    const random = this.seededRandom(seed);

    // Generate embedding vector
    const embedding: number[] = [];
    for (let i = 0; i < this.dimension; i++) {
      embedding.push(random());
    }

    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple seeded random number generator for consistency
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }
}
