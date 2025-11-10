import { ModelBackend } from '../backends/base';
import { getBackend } from '../config';
import { ToolDescriptor } from './tool-descriptor';
import { globalToolRegistry } from './tool-registry';
import { DynamicAdapter } from '../llm/DynamicAdapter';
import { ModelSpecSource } from '../llm/ModelSpecSource';

/**
 * Agent represents a single AI agent with its own backend and role
 */
export class Agent {
  name: string;
  role: string;
  backend: ModelBackend;
  backendName: string;
  model?: string;
  tools?: string[]; // Tool names this agent can use
  dynamicAdapter?: DynamicAdapter; // Optional dynamic adapter for custom APIs
  openApiUrl?: string;
  localJsonPath?: string;

  constructor(
    name: string,
    role: string,
    backendName: string,
    model?: string,
    tools?: string[],
    openApiUrl?: string,
    localJsonPath?: string
  ) {
    this.name = name;
    this.role = role;
    this.backendName = backendName;
    this.model = model;
    this.tools = tools;
    this.openApiUrl = openApiUrl;
    this.localJsonPath = localJsonPath;

    // Get backend instance (could be ollama, openai, etc.)
    this.backend = getBackend(backendName);
  }

  /**
   * Initialize dynamic adapter if configured
   */
  async initializeDynamicAdapter(memory: any): Promise<void> {
    if (!this.openApiUrl && !this.localJsonPath) {
      return; // No dynamic adapter configuration
    }

    const { AdapterFactory } = await import('../llm/AdapterFactory');

    const source: ModelSpecSource = {
      model: this.model || this.name,
      openApiUrl: this.openApiUrl,
      localJsonPath: this.localJsonPath
    };

    this.dynamicAdapter = await AdapterFactory.getAdapter(source, memory);
    console.log(`✅ Dynamic adapter initialized for ${this.name}`);
  }

  /**
   * Execute agent action
   */
  async act(input: string, context: Record<string, any> = {}): Promise<string> {
    const contextStr = Object.entries(context)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    // Build tool context if tools are specified
    let toolContext = '';
    if (this.tools && this.tools.length > 0) {
      toolContext = globalToolRegistry.buildToolContext(this.tools);
    }

    const prompt = `Role: ${this.role}

${toolContext}${contextStr ? 'Context:\n' + contextStr + '\n\n' : ''}Task: ${input}

Provide your response:`;

    // Use dynamic adapter if configured
    if (this.dynamicAdapter) {
      try {
        const response = await this.dynamicAdapter.sendPrompt(prompt);

        // Extract text from response (handle different response formats)
        let result = '';
        if (typeof response === 'string') {
          result = response;
        } else if (response.choices && response.choices.length > 0) {
          result = response.choices[0].text || response.choices[0].message?.content || '';
        } else if (response.response) {
          result = response.response;
        } else {
          result = JSON.stringify(response);
        }

        console.log(result);
        return result;
      } catch (error: any) {
        console.error(`❌ Dynamic adapter error: ${error.message}`);
        throw error;
      }
    }

    // Fall back to standard backend
    let result = '';
    const onStream = (chunk: string) => {
      result += chunk;
      process.stdout.write(chunk);
    };

    const maybe = await this.backend.chat(prompt, onStream);
    if (maybe && typeof maybe === 'string') {
      result = maybe;
    }

    console.log(''); // newline
    return result;
  }
}
