import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';

export class OllamaBackend extends ModelBackend {
  url: string;
  model: string;

  constructor(url = 'http://localhost:11434', model = 'llama3') {
    super();
    this.url = url.replace(/\/$/, '');
    this.model = model;
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
}
