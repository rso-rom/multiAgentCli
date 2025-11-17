import axios from 'axios';
import { BaseEmbeddingService } from './embedding-service';

/**
 * Ollama embedding service using local Ollama API
 * Supports models like: nomic-embed-text, all-minilm, mxbai-embed-large
 */
export class OllamaEmbeddingService extends BaseEmbeddingService {
  private url: string;
  private model: string;

  constructor(
    url = 'http://localhost:11434',
    model = 'nomic-embed-text',
    dimension = 768
  ) {
    super('ollama', dimension);
    this.url = url;
    this.model = model;
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.url}/api/embeddings`, {
        model: this.model,
        prompt: text
      }, {
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.embedding) {
        const embedding = response.data.embedding;

        // Verify dimension matches
        if (embedding.length !== this.dimension) {
          console.warn(
            `Warning: Ollama returned ${embedding.length}D embedding, expected ${this.dimension}D`
          );
          // Update dimension to match actual
          this.dimension = embedding.length;
        }

        return embedding;
      }

      throw new Error('Invalid response from Ollama: missing embedding field');
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to Ollama at ${this.url}. ` +
          'Please ensure Ollama is running (ollama serve)'
        );
      }

      if (error.response?.status === 404) {
        throw new Error(
          `Model ${this.model} not found. ` +
          `Please pull it first: ollama pull ${this.model}`
        );
      }

      throw new Error(`Ollama embedding error: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try to connect to Ollama API
      const response = await axios.get(`${this.url}/api/tags`, {
        timeout: 5000
      });

      // Check if embedding model is available
      const models = response.data?.models || [];
      const modelAvailable = models.some((m: any) =>
        m.name === this.model || m.name.startsWith(`${this.model}:`)
      );

      if (!modelAvailable) {
        console.log(
          `Ollama is running but model ${this.model} not found. ` +
          `Run: ollama pull ${this.model}`
        );
      }

      return modelAvailable;
    } catch {
      return false;
    }
  }

  /**
   * Get model info from Ollama
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await axios.post(`${this.url}/api/show`, {
        name: this.model
      });
      return response.data;
    } catch {
      return null;
    }
  }
}
