import { EmbeddingService } from './embedding-service';
import { MockEmbeddingService } from './mock-embeddings';
import { OllamaEmbeddingService } from './ollama-embeddings';
import { OpenAIEmbeddingService } from './openai-embeddings';

/**
 * Embedding service type
 */
export type EmbeddingServiceType = 'ollama' | 'openai' | 'mock';

/**
 * Embedding service configuration
 */
export interface EmbeddingConfig {
  service: EmbeddingServiceType;
  model?: string;
  dimension?: number;
  apiKey?: string;
  url?: string;
}

/**
 * Factory for creating embedding services
 */
export class EmbeddingFactory {
  /**
   * Create embedding service from configuration
   */
  static createService(config: EmbeddingConfig): EmbeddingService {
    switch (config.service) {
      case 'ollama':
        return new OllamaEmbeddingService(
          config.url || process.env.OLLAMA_URL || 'http://localhost:11434',
          config.model || process.env.EMBEDDING_MODEL || 'nomic-embed-text',
          config.dimension || parseInt(process.env.EMBEDDING_DIMENSION || '768')
        );

      case 'openai':
        return new OpenAIEmbeddingService(
          config.apiKey || process.env.OPENAI_API_KEY || '',
          config.model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
          config.dimension || parseInt(process.env.EMBEDDING_DIMENSION || '1536')
        );

      case 'mock':
      default:
        return new MockEmbeddingService(
          config.dimension || parseInt(process.env.EMBEDDING_DIMENSION || '384')
        );
    }
  }

  /**
   * Create embedding service from environment variables
   */
  static createFromEnv(): EmbeddingService {
    const service = (process.env.EMBEDDING_SERVICE || 'mock') as EmbeddingServiceType;

    const config: EmbeddingConfig = {
      service,
      model: process.env.EMBEDDING_MODEL,
      dimension: process.env.EMBEDDING_DIMENSION
        ? parseInt(process.env.EMBEDDING_DIMENSION)
        : undefined,
      apiKey: process.env.OPENAI_API_KEY,
      url: process.env.OLLAMA_URL
    };

    return this.createService(config);
  }

  /**
   * Auto-detect and create best available embedding service
   */
  static async createAuto(): Promise<EmbeddingService> {
    // Try OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      const openaiService = this.createService({
        service: 'openai',
        apiKey: process.env.OPENAI_API_KEY
      });

      if (await openaiService.isAvailable()) {
        console.log('✅ Using OpenAI embeddings');
        return openaiService;
      }
    }

    // Try Ollama
    const ollamaService = this.createService({ service: 'ollama' });
    if (await ollamaService.isAvailable()) {
      console.log('✅ Using Ollama embeddings');
      return ollamaService;
    }

    // Fallback to mock
    console.log('⚠️ Using mock embeddings (not suitable for production)');
    console.log('   For real embeddings, set up:');
    console.log('   - Ollama: ollama pull nomic-embed-text');
    console.log('   - OpenAI: Set OPENAI_API_KEY in .env');

    return this.createService({ service: 'mock' });
  }

  /**
   * Get recommended dimension for a service
   */
  static getRecommendedDimension(service: EmbeddingServiceType): number {
    switch (service) {
      case 'ollama':
        return 768; // nomic-embed-text default
      case 'openai':
        return 1536; // text-embedding-3-small default
      case 'mock':
      default:
        return 384; // all-MiniLM-L6-v2 standard
    }
  }
}
