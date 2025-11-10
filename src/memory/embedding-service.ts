/**
 * Embedding service interface for vector generation
 */
export interface EmbeddingService {
  /**
   * Generate embedding vector for text
   */
  embed(text: string): Promise<number[]>;

  /**
   * Get embedding dimension
   */
  getDimension(): number;

  /**
   * Get service name
   */
  getName(): string;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Abstract base class for embedding services
 */
export abstract class BaseEmbeddingService implements EmbeddingService {
  protected dimension: number;
  protected name: string;

  constructor(name: string, dimension: number) {
    this.name = name;
    this.dimension = dimension;
  }

  abstract embed(text: string): Promise<number[]>;

  getDimension(): number {
    return this.dimension;
  }

  getName(): string {
    return this.name;
  }

  abstract isAvailable(): Promise<boolean>;
}
