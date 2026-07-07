/**
 * Regression tests for v4.5.1 fix: systemPrompt must reach the LLM payload.
 * Previously all backends silently dropped the 3rd chat() argument, so the
 * worker agents' specialization prompts never reached the model.
 */
import axios from 'axios';
import { OllamaBackend } from '../ollama';
import { OpenWebUIBackend } from '../openwebui';
import { OpenAIBackend } from '../vision-openai';
import { AnthropicBackend } from '../anthropic';
import { MockBackend } from '../mock';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/** Async-iterable fake stream as returned by axios with responseType: 'stream' */
function streamOf(...chunks: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) {
        yield Buffer.from(c);
      }
    }
  };
}

beforeEach(() => {
  mockedAxios.post.mockReset();
});

/** Typed access to the first axios.post call */
function firstPostCall(): { url: string; payload: any } {
  const [url, payload] = mockedAxios.post.mock.calls[0];
  return { url: url as string, payload: payload as any };
}

describe('systemPrompt forwarding', () => {
  it('Ollama sends systemPrompt as the "system" field', async () => {
    mockedAxios.post.mockResolvedValue({ data: streamOf('{"response":"ok"}') });

    const backend = new OllamaBackend('http://localhost:11434', 'llama3');
    await backend.chat('user prompt', undefined, 'You are a Frontend Agent');

    const { url, payload } = firstPostCall();
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(payload).toMatchObject({
      model: 'llama3',
      prompt: 'user prompt',
      system: 'You are a Frontend Agent'
    });
  });

  it('Ollama omits the "system" field when no systemPrompt is given', async () => {
    mockedAxios.post.mockResolvedValue({ data: streamOf('{"response":"ok"}') });

    const backend = new OllamaBackend('http://localhost:11434', 'llama3');
    await backend.chat('user prompt');

    const { payload } = firstPostCall();
    expect(payload).not.toHaveProperty('system');
  });

  it('OpenWebUI prepends a system message', async () => {
    mockedAxios.post.mockResolvedValue({ data: streamOf('chunk') });

    const backend = new OpenWebUIBackend('http://localhost:3000/api', undefined, 'llama3');
    await backend.chat('user prompt', undefined, 'You are a Backend Agent');

    const { payload } = firstPostCall();
    expect(payload.messages).toEqual([
      { role: 'system', content: 'You are a Backend Agent' },
      { role: 'user', content: 'user prompt' }
    ]);
  });

  it('OpenAI prepends a system message', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { choices: [{ message: { content: 'hi' } }] }
    });

    const backend = new OpenAIBackend('sk-test', 'gpt-4o');
    await backend.chat('user prompt', undefined, 'You are a DevOps Agent');

    const { payload } = firstPostCall();
    expect(payload.messages[0]).toEqual({ role: 'system', content: 'You are a DevOps Agent' });
    expect(payload.messages[1]).toEqual({ role: 'user', content: 'user prompt' });
  });

  it('OpenAI sends only the user message without systemPrompt', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { choices: [{ message: { content: 'hi' } }] }
    });

    const backend = new OpenAIBackend('sk-test', 'gpt-4o');
    await backend.chat('user prompt');

    const { payload } = firstPostCall();
    expect(payload.messages).toHaveLength(1);
    expect(payload.messages[0].role).toBe('user');
  });

  it('Anthropic sends systemPrompt as the top-level "system" param', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { content: [{ text: 'hi' }] }
    });

    const backend = new AnthropicBackend('sk-ant-test', 'claude-3-5-sonnet-20241022', false);
    await backend.chat('user prompt', undefined, 'You are a Design Agent');

    const { payload } = firstPostCall();
    expect(payload.system).toBe('You are a Design Agent');
    expect(payload.messages).toEqual([{ role: 'user', content: 'user prompt' }]);
  });

  it('MockBackend accepts the 3-argument signature', async () => {
    const backend = new MockBackend();
    const result = await backend.chat('prompt', undefined, 'system');
    expect(typeof result).toBe('string');
  });
});
