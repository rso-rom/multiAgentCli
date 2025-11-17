import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';
import { ImageInput } from '../utils/image-handler';

export class OllamaBackend extends ModelBackend {
  url: string;
  model: string;
  // Vision models: llava, llava:13b, llava:34b, bakllava, etc.
  private visionModels = ['llava', 'bakllava', 'llava-phi3', 'llava:13b', 'llava:34b'];

  constructor(url = 'http://localhost:11434', model = 'llama3') {
    super();
    this.url = url.replace(/\/$/, '');
    this.model = model;
  }

  /**
   * Check if current model supports vision
   */
  supportsVision(): boolean {
    return this.visionModels.some(vm => this.model.toLowerCase().includes(vm));
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const inst = { model: this.model, prompt };

    try {
      const resp = await axios.post(`${this.url}/api/generate`, inst, {
        responseType: 'stream',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!onStream) {
        let buf = '';
        for await (const chunk of resp.data as any) {
          buf += chunk.toString();
        }
        return buf;
      }

      for await (const chunk of resp.data as any) {
        const s = chunk.toString();
        try {
          const lines = s.split(/\r?\n/).filter(Boolean);
          for (const l of lines) {
            let j = null;
            try {
              j = JSON.parse(l);
            } catch {
              /* not json */
            }
            if (j && j.response) {
              onStream(j.response);
            } else {
              onStream(l);
            }
          }
        } catch {
          onStream(s);
        }
      }
    } catch (error: any) {
      const errorMsg = `Error connecting to Ollama: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }

  /**
   * Analyze images with Ollama vision models (llava, bakllava, etc.)
   */
  async analyzeImage(prompt: string, images: ImageInput[], onStream?: StreamCallback): Promise<string | void> {
    if (!this.supportsVision()) {
      throw new Error(`Model ${this.model} does not support vision. Use a vision model like 'llava' or 'bakllava'.`);
    }

    // Ollama expects base64 images in the 'images' array
    const imageBase64Array = images.map(img => img.base64).filter(Boolean) as string[];

    const payload = {
      model: this.model,
      prompt,
      images: imageBase64Array,
      stream: !!onStream,
    };

    try {
      const resp = await axios.post(`${this.url}/api/generate`, payload, {
        responseType: onStream ? 'stream' : 'json',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!onStream) {
        // Non-streaming response
        const data = resp.data;
        return data.response || data;
      }

      // Streaming response
      for await (const chunk of resp.data as any) {
        const s = chunk.toString();
        try {
          const lines = s.split(/\r?\n/).filter(Boolean);
          for (const l of lines) {
            let j = null;
            try {
              j = JSON.parse(l);
            } catch {
              /* not json */
            }
            if (j && j.response) {
              onStream(j.response);
            } else {
              onStream(l);
            }
          }
        } catch {
          onStream(s);
        }
      }
    } catch (error: any) {
      const errorMsg = `Error in vision analysis: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }
}
