import axios from 'axios';
import { BaseEmbeddingService } from './embedding-service';

/**
 * OpenAI embedding service using OpenAI Embeddings API
 * Supports models: text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002
 */
export class OpenAIEmbeddingService extends BaseEmbeddingService {
  private apiKey: string;
  private model: string;
  private apiUrl: string;

  constructor(
    apiKey: string,
    model = 'text-embedding-3-small',
    dimension = 1536
  ) {
    super('openai', dimension);
    this.apiKey = apiKey;
    this.model = model;
    this.apiUrl = 'https://api.openai.com/v1/embeddings';
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error(
        'OpenAI API key is required. Set OPENAI_API_KEY in .env file.'
      );
    }

    try {
      const payload: any = {
        model: this.model,
        input: text
      };

      // For text-embedding-3-* models, we can specify dimension
      if (this.model.startsWith('text-embedding-3-')) {
        payload.dimensions = this.dimension;
      }

      const response = await axios.post(
        this.apiUrl,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        const embedding = response.data.data[0].embedding;

        // Verify dimension
        if (embedding.length !== this.dimension) {
          console.warn(
            `Warning: OpenAI returned ${embedding.length}D embedding, expected ${this.dimension}D`
          );
          this.dimension = embedding.length;
        }

        return embedding;
      }

      throw new Error('Invalid response from OpenAI: missing embedding data');
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'OpenAI API authentication failed. Please check your API key.'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          `OpenAI model ${this.model} not found. ` +
          `Available models: text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002`
        );
      }

      if (error.response?.status === 429) {
        throw new Error(
          'OpenAI API rate limit exceeded. Please try again later.'
        );
      }

      throw new Error(`OpenAI embedding error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === '') {
      return false;
    }

    try {
      // Try a simple API call to verify credentials
      const response = await axios.get(
        'https://api.openai.com/v1/models',
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        }
      );

      // Check if embedding models are available
      const models = response.data?.data || [];
      const embeddingModels = models.filter((m: any) =>
        m.id.includes('embedding')
      );

      return embeddingModels.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get supported dimensions for text-embedding-3 models
   */
  static getSupportedDimensions(model: string): number[] {
    if (model === 'text-embedding-3-small') {
      return [512, 1536]; // Can be reduced to 512
    }
    if (model === 'text-embedding-3-large') {
      return [256, 1024, 3072]; // Can be reduced to 256 or 1024
    }
    if (model === 'text-embedding-ada-002') {
      return [1536]; // Fixed dimension
    }
    return [];
  }
}
