import fs from 'fs';
import path from 'path';
import axios from 'axios';
import inquirer from 'inquirer';
import { MemoryManager } from '../memory/memory-manager';
import { ModelSpecSource, APISpec } from './ModelSpecSource';
import { globalTokenManager } from '../auth/token-manager';
import { OAuth2Config } from '../auth/oauth2-browser-flow';

// OpenAPI 3.0 type definitions
interface OpenAPISecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
}

interface OpenAPIPathMethods {
  get?: any;
  post?: any;
  put?: any;
  delete?: any;
  [key: string]: any;
}

interface OpenAPISpec {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: {
    [path: string]: OpenAPIPathMethods;
  };
  components?: {
    securitySchemes?: {
      [name: string]: OpenAPISecurityScheme;
    };
  };
}

/**
 * Dynamic adapter that can load model specs from OpenAPI or JSON
 * and automatically handle authentication and API calls
 */
export class DynamicAdapter {
  model: string;
  spec!: APISpec;
  token?: string;
  memory: MemoryManager;
  private authenticated = false;

  constructor(source: ModelSpecSource, memory: MemoryManager) {
    this.model = source.model;
    this.memory = memory;
  }

  /**
   * Load specification from OpenAPI URL or local JSON
   */
  async loadSpec(source: ModelSpecSource): Promise<void> {
    // 1. Check disk cache first (fastest)
    const cacheDir = path.join('.cache', 'api-specs');
    const cacheFile = path.join(cacheDir, `${source.model.replace(/[^a-zA-Z0-9]/g, '_')}.json`);

    try {
      const cached = fs.readFileSync(cacheFile, 'utf-8');
      this.spec = JSON.parse(cached);
      console.log(`✅ Loaded spec from disk cache for ${source.model}`);
      return;
    } catch {
      // Cache miss - continue to load from source
    }

    // 2. Check if spec is already cached in memory
    const stored = await this.memory.getMid(`adapterSpec:${source.model}`);
    if (stored) {
      this.spec = JSON.parse(stored as string);
      console.log(`✅ Loaded cached spec from memory for ${source.model}`);

      // Save to disk cache for next time
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cacheFile, stored);
      } catch {
        // Ignore cache write errors
      }
      return;
    }

    // 3. Load from source
    if (source.openApiUrl) {
      console.log(`📥 Loading OpenAPI spec from ${source.openApiUrl}`);
      const openApi = await axios.get(source.openApiUrl).then(r => r.data);
      this.spec = this.convertOpenAPIToSpec(openApi);
    } else if (source.localJsonPath) {
      console.log(`📥 Loading spec from ${source.localJsonPath}`);
      const raw = fs.readFileSync(path.resolve(source.localJsonPath), 'utf-8');
      this.spec = JSON.parse(raw);
    } else {
      throw new Error(`No specification source for model ${source.model}`);
    }

    const specJson = JSON.stringify(this.spec);

    // 4. Cache spec in mid-term memory
    await this.memory.setMid(`adapterSpec:${source.model}`, specJson);

    // 5. Save to disk cache
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, specJson);
      console.log(`✅ Spec loaded and cached for ${source.model}`);
    } catch (err) {
      console.warn('⚠️  Could not write to disk cache:', err);
      console.log(`✅ Spec loaded (memory cache only) for ${source.model}`);
    }
  }

  /**
   * Convert OpenAPI 3.0 spec to internal APISpec format
   */
  private convertOpenAPIToSpec(openApiSpec: OpenAPISpec): APISpec {
    // Find first POST endpoint for completion (typically /chat/completions or /completions)
    let completionPath: string | null = null;
    let completionMethod = 'POST';

    for (const [path, methods] of Object.entries(openApiSpec.paths || {})) {
      if (methods.post && (path.includes('completion') || path.includes('chat') || path.includes('generate'))) {
        completionPath = path;
        completionMethod = 'POST';
        break;
      }
    }

    if (!completionPath && openApiSpec.paths) {
      // Fallback: use first POST endpoint
      const firstPath = Object.keys(openApiSpec.paths)[0];
      completionPath = firstPath;
    }

    const baseUrl = openApiSpec.servers?.[0]?.url || '';

    // Detect auth type from security schemes
    let authType: 'apikey' | 'oauth' | 'bearer' | 'none' = 'none';
    let headerName = 'Authorization';

    if (openApiSpec.components?.securitySchemes) {
      const schemes = openApiSpec.components.securitySchemes;
      const firstScheme = Object.values(schemes)[0] as OpenAPISecurityScheme | undefined;

      if (firstScheme?.type === 'http' && firstScheme?.scheme === 'bearer') {
        authType = 'bearer';
      } else if (firstScheme?.type === 'apiKey') {
        authType = 'apikey';
        headerName = firstScheme.name || 'Authorization';
      } else if (firstScheme?.type === 'oauth2') {
        authType = 'oauth';
      }
    }

    return {
      model: openApiSpec.info?.title || this.model,
      auth: {
        type: authType,
        prompt: `Enter API key for ${this.model}:`,
        headerName
      },
      endpoints: {
        completion: {
          method: completionMethod,
          url: completionPath || '/v1/completions',
          baseUrl
        }
      },
      parameters: {
        prompt: 'string',
        max_tokens: 'number',
        temperature: 'number'
      },
      requestFormat: 'json',
      responseFormat: 'json'
    };
  }

  /**
   * Authenticate with the API (interactive prompt or cached token)
   */
  async authenticate(): Promise<void> {
    if (this.authenticated) return;

    if (this.spec.auth.type === 'none') {
      this.authenticated = true;
      return;
    }

    // Check if token is cached in memory
    const cached = await this.memory.getMid(`adapterToken:${this.model}`);
    if (cached) {
      this.token = cached as string;
      this.authenticated = true;
      console.log(`✅ Using cached auth token for ${this.model}`);
      return;
    }

    // Prompt user for token
    if (this.spec.auth.type === 'apikey' || this.spec.auth.type === 'bearer') {
      const { token } = await inquirer.prompt([{
        type: 'password',
        name: 'token',
        message: this.spec.auth.prompt || `Enter API key for ${this.model}:`,
        mask: '*'
      }]);

      this.token = token;

      // Cache token in mid-term memory
      await this.memory.setMid(`adapterToken:${this.model}`, token);
      this.authenticated = true;
      console.log(`✅ Authenticated with ${this.model}`);
    } else if (this.spec.auth.type === 'oauth') {
      // Use OAuth2 browser flow
      if (!this.spec.auth.oauthConfig) {
        throw new Error('OAuth2 configuration missing in spec');
      }

      const oauthConfig: OAuth2Config = {
        provider: this.model,
        authUrl: this.spec.auth.oauthConfig.authUrl,
        tokenUrl: this.spec.auth.oauthConfig.tokenUrl,
        clientId: this.spec.auth.oauthConfig.clientId,
        clientSecret: this.spec.auth.oauthConfig.clientSecret,
        scopes: this.spec.auth.oauthConfig.scopes,
        callbackPort: this.spec.auth.oauthConfig.callbackPort
      };

      // Get token via OAuth flow (will use saved token if available)
      this.token = await globalTokenManager.getValidToken(this.model, oauthConfig);
      this.authenticated = true;
    }
  }

  /**
   * Send prompt to the model API
   */
  async sendPrompt(prompt: string, params: Record<string, any> = {}): Promise<any> {
    await this.authenticate();

    const endpoint = this.spec.endpoints['completion'];
    const fullUrl = endpoint.baseUrl ? `${endpoint.baseUrl}${endpoint.url}` : endpoint.url;

    // Build request payload
    const payload: Record<string, any> = {
      prompt,
      model: this.model,
      ...params
    };

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      if (this.spec.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.spec.auth.type === 'apikey') {
        headers[this.spec.auth.headerName || 'Authorization'] = this.token;
      }
    }

    console.log(`🚀 Sending request to ${fullUrl}`);

    try {
      const response = await axios({
        method: endpoint.method.toLowerCase() as any,
        url: fullUrl,
        headers,
        data: payload
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`API Error ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Send streaming prompt (for models that support streaming)
   */
  async sendPromptStreaming(
    prompt: string,
    onChunk: (chunk: string) => void,
    params: Record<string, any> = {}
  ): Promise<void> {
    await this.authenticate();

    const endpoint = this.spec.endpoints['completion'];
    const fullUrl = endpoint.baseUrl ? `${endpoint.baseUrl}${endpoint.url}` : endpoint.url;

    const payload: Record<string, any> = {
      prompt,
      model: this.model,
      stream: true,
      ...params
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      if (this.spec.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${this.token}`;
      } else if (this.spec.auth.type === 'apikey') {
        headers[this.spec.auth.headerName || 'Authorization'] = this.token;
      }
    }

    const response = await axios({
      method: endpoint.method.toLowerCase() as any,
      url: fullUrl,
      headers,
      data: payload,
      responseType: 'stream'
    });

    let buffer = '';

    for await (const chunk of response.data as any) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;

        try {
          const data = line.replace(/^data: /, '');
          if (data === '[DONE]') continue;

          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.text || parsed.choices?.[0]?.delta?.content || '';

          if (text) {
            onChunk(text);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  /**
   * Clear cached authentication
   */
  async clearAuth(): Promise<void> {
    await this.memory.setMid(`adapterToken:${this.model}`, undefined as any);
    this.token = undefined;
    this.authenticated = false;
    console.log(`🗑️ Cleared auth token for ${this.model}`);
  }
}
