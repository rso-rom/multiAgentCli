import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';

export class OpenWebUIBackend extends ModelBackend {
  url: string;
  apiKey?: string;
  model: string;

  constructor(url = 'http://localhost:3000/api/v1/chat/completions', apiKey?: string, model = 'llama3') {
    super();
    this.url = url.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    // OpenWebUI verwendet das OpenAI-kompatible Chat-Format
    const payload = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // API-Key im Authorization-Header, falls vorhanden
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const resp = await axios.post(this.url, payload, {
        responseType: 'stream',
        headers
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
        onStream(s);
      }
    } catch (error: any) {
      const errorMsg = `Error connecting to OpenWebUI: ${error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }
}
