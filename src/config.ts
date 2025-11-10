import { OllamaBackend } from './backends/ollama';
import { OpenWebUIBackend } from './backends/openwebui';
import { MockBackend } from './backends/mock';
import dotenv from 'dotenv';

dotenv.config();

export type BackendName = 'ollama' | 'openwebui' | 'openai' | 'mock';

export function getBackend(name?: string) {
  const backend = (name || process.env.MODEL_BACKEND || 'mock').toLowerCase();

  if (backend === 'ollama') {
    return new OllamaBackend(
      process.env.OLLAMA_URL || 'http://localhost:11434',
      process.env.OLLAMA_MODEL || 'llama3'
    );
  }

  if (backend === 'openwebui') {
    return new OpenWebUIBackend(
      process.env.OPENWEBUI_URL || 'http://localhost:3000/api/v1/generate'
    );
  }

  // openai omitted for brevity — add similar adapter if needed
  return new MockBackend();
}

export function getBackendName(name?: string): string {
  return (name || process.env.MODEL_BACKEND || 'mock').toLowerCase();
}
