import axios from 'axios';

export class LLMAdapter {
  static async call(modelRef: string, prompt: string, opts: Record<string, unknown> = {}): Promise<string> {
    if (modelRef.startsWith('ollama:')) {
      const model = modelRef.split(':')[1];
      const url = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '') + '/api/generate';
      const res = await axios.post(url, { model, prompt, stream: false, options: opts }, { timeout: 120_000 });
      if (typeof res.data === 'string') return res.data;
      return res.data?.response ?? JSON.stringify(res.data);
    }

    if (modelRef.startsWith('openwebui:')) {
      const model = modelRef.split(':')[1];
      const url = (process.env.OPENWEBUI_URL || 'http://localhost:3000').replace(/\/$/, '') + '/api/generate';
      const payload: any = { prompt, stream: false };
      if (model) payload.model = model;
      const res = await axios.post(url, payload, { timeout: 120_000 });
      return typeof res.data === 'string' ? res.data : res.data?.response ?? JSON.stringify(res.data);
    }

    if (modelRef.startsWith('openai:')) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OPENAI_API_KEY is required for openai:* models');
      const model = modelRef.split(':')[1] || 'gpt-4o-mini';
      const url = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
      const res = await axios.post(
        url,
        { model, messages: [{ role: 'user', content: prompt }], stream: false, ...opts },
        {
          timeout: 120_000,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        },
      );
      return res.data?.choices?.[0]?.message?.content ?? JSON.stringify(res.data);
    }

    // fallback: generic HTTP endpoint defined by env
    const url = process.env.LLM_API_URL;
    if (!url) {
      return `LLMAdapter fallback: ${prompt.slice(0, 400)}`;
    }
    const res = await axios.post(url, { model: modelRef, prompt, ...opts }, { timeout: 120_000 });
    return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  }
}
