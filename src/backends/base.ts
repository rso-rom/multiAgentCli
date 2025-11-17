import { ImageInput } from '../utils/image-handler';

export type StreamCallback = (chunk: string) => void;

/**
 * Base interface for all model backends
 */
export abstract class ModelBackend {
  abstract chat(prompt: string, onStream?: StreamCallback): Promise<string | void>;

  /**
   * Optional: Vision/Image analysis support
   * Returns true if this backend supports vision capabilities
   */
  supportsVision(): boolean {
    return false;
  }

  /**
   * Optional: Analyze images with vision models
   * Only implemented by backends that support vision
   */
  async analyzeImage(prompt: string, images: ImageInput[], onStream?: StreamCallback): Promise<string | void> {
    throw new Error(`Vision not supported by ${this.constructor.name}`);
  }
}
