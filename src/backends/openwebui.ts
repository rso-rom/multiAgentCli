import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';

export class OpenWebUIBackend extends ModelBackend {
  url: string;

  constructor(url = 'http://localhost:3000/api/v1/generate') {
    super();
    this.url = url.replace(/\/$/, '');
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    const payload = { prompt, stream: true };

    try {
      const resp = await axios.post(this.url, payload, {
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
