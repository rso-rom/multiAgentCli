import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * Streaming adapter that supports:
 * - Ollama (line-delimited JSON chunks)
 * - OpenWebUI (raw text stream)
 * - OpenAI SSE-like (data: {...}) or chunked JSONL
 *
 * Usage:
 *   const s = new ModelStream(modelRef, prompt);
 *   s.on('chunk', (text) => ...)
 *   s.on('end', () => ...)
 *   await s.start();
 */

export class ModelStream extends EventEmitter {
  modelRef: string;
  prompt: string;
  opts: any;

  constructor(modelRef: string, prompt: string, opts: any = {}) {
    super();
    this.modelRef = modelRef;
    this.prompt = prompt;
    this.opts = opts;
  }

  async start() {
    if (this.modelRef.startsWith('ollama:')) {
      return this.startOllama();
    }
    if (this.modelRef.startsWith('openwebui:')) {
      return this.startOpenWebUI();
    }
    if (this.modelRef.startsWith('openai:')) {
      return this.startOpenAI();
    }
    // fallback: non-streaming
    const res = await axios.post(this.opts.fallbackUrl || (process.env.LLM_API_URL || ''), { model: this.modelRef, prompt: this.prompt });
    this.emit('chunk', String(res.data).slice(0, 10000));
    this.emit('end');
  }

  private async startOllama() {
    const url = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '') + '/api/generate';
    const model = this.modelRef.split(':')[1];
    const inst = { model, prompt: this.prompt, stream: true };
    const resp = await axios.post(url, inst, { responseType: 'stream', timeout: 120_000 });
    const stream = resp.data;
    stream.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      // Ollama often sends JSON per-line
      const lines = s.split(/\r?\n/).filter(Boolean);
      for (const l of lines) {
        try {
          const j = JSON.parse(l);
          if (j?.response) this.emit('chunk', j.response);
          else this.emit('chunk', l);
        } catch {
          this.emit('chunk', l);
        }
      }
    });
    stream.on('end', () => this.emit('end'));
    stream.on('error', (e: any) => this.emit('error', e));
  }

  private async startOpenWebUI() {
    const url = (process.env.OPENWEBUI_URL || 'http://localhost:3000').replace(/\/$/, '') + '/api/generate';
    const model = this.modelRef.split(':')[1] || undefined;
    const payload: any = { prompt: this.prompt, stream: true };
    if (model) payload.model = model;
    const resp = await axios.post(url, payload, { responseType: 'stream', timeout: 120_000 });
    const stream = resp.data;
    stream.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      // OpenWebUI variants often stream raw text chunks
      this.emit('chunk', s);
    });
    stream.on('end', () => this.emit('end'));
    stream.on('error', (e: any) => this.emit('error', e));
  }

  private async startOpenAI() {
    // expects OpenAI-compatible SSE (data: {...}) or chunked JSON
    const url = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    const token = process.env.OPENAI_API_KEY;
    if (!token) throw new Error('OPENAI_API_KEY missing for streaming OpenAI');
    const payload = {
      model: this.modelRef.split(':')[1] || this.modelRef,
      messages: [{ role: 'user', content: this.prompt }],
      stream: true,
    };
    const resp = await axios.post(url, payload, {
      responseType: 'stream',
      timeout: 120_000,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const stream = resp.data;
    let buffer = '';
    stream.on('data', (chunk: Buffer) => {
      const s = chunk.toString();
      buffer += s;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const l of lines) {
        const line = l.trim();
        if (!line) continue;
        // SSE style: data: {...} or plain JSON
        const m = line.match(/^data:\s*(.*)$/);
        const jsonStr = m ? m[1] : line;
        if (jsonStr === '[DONE]') {
          this.emit('end');
          return;
        }
        try {
          const j = JSON.parse(jsonStr);
          const delta = j.choices?.[0]?.delta?.content || j.choices?.[0]?.text || '';
          if (delta) this.emit('chunk', delta);
        } catch {
          this.emit('chunk', jsonStr);
        }
      }
    });
    stream.on('end', () => this.emit('end'));
    stream.on('error', (e: any) => this.emit('error', e));
  }
}
