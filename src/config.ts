import { OllamaBackend } from './backends/ollama';
import { OpenWebUIBackend } from './backends/openwebui';
import { OpenAIBackend } from './backends/vision-openai';
import { AnthropicBackend } from './backends/anthropic';
import { MockBackend } from './backends/mock';
import dotenv from 'dotenv';

dotenv.config();

export type BackendName = 'ollama' | 'openwebui' | 'openai' | 'anthropic' | 'claude' | 'mock';

export function getBackend(name?: string) {
  const backend = (name || process.env.MODEL_BACKEND || 'ollama').toLowerCase();

  if (backend === 'ollama') {
    return new OllamaBackend(
      process.env.OLLAMA_URL || 'http://localhost:11434',
      process.env.OLLAMA_MODEL || 'llama3'
    );
  }

  if (backend === 'openwebui') {
    return new OpenWebUIBackend(
      process.env.OPENWEBUI_URL || 'http://localhost:3000/api/v1/chat/completions',
      process.env.OPENWEBUI_API_KEY,
      process.env.OPENWEBUI_MODEL || 'llama3'
    );
  }

  if (backend === 'openai') {
    return new OpenAIBackend(
      process.env.OPENAI_API_KEY,
      process.env.OPENAI_MODEL || 'gpt-4o'
    );
  }

  if (backend === 'anthropic' || backend === 'claude') {
    // Check if we should use OAuth or API key
    const useOAuth = process.env.ANTHROPIC_USE_OAUTH === 'true';
    return new AnthropicBackend(
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      useOAuth
    );
  }

  return new MockBackend();
}

export function getBackendName(name?: string): string {
  return (name || process.env.MODEL_BACKEND || 'ollama').toLowerCase();
}
