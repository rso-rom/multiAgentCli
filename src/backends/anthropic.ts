import axios from 'axios';
import { ModelBackend, StreamCallback } from './base';
import { OAuth2BrowserFlow } from '../auth/oauth2-browser-flow';
import { globalTokenStore } from '../auth/token-store';

/**
 * Anthropic Claude backend with OAuth2 + API Key support
 * Supports both authentication methods:
 * 1. OAuth2 browser flow (like Claude Code CLI)
 * 2. API Key (traditional method)
 */
export class AnthropicBackend extends ModelBackend {
  private apiKey?: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  private useOAuth: boolean;

  // Anthropic OAuth configuration (same as Claude Code CLI)
  private static readonly OAUTH_CONFIG = {
    provider: 'anthropic',
    clientId: '9d1c250a-e61b-44d9-88ed-5944d1962f5e',
    authUrl: 'https://console.anthropic.com/oauth/authorize',
    tokenUrl: 'https://console.anthropic.com/oauth/token',
    scopes: ['org:create_api_key', 'user:profile', 'user:inference'],
    usePKCE: true
  };

  constructor(apiKey?: string, model = 'claude-3-5-sonnet-20241022', useOAuth = false) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.useOAuth = useOAuth;
  }

  /**
   * Get access token (OAuth or API Key)
   */
  private async getAccessToken(): Promise<string> {
    if (this.useOAuth) {
      // OAuth flow
      await globalTokenStore.initialize();

      // Check for existing token
      const existingToken = await globalTokenStore.loadToken('anthropic');

      if (existingToken && existingToken.expires_at && existingToken.expires_at > Date.now()) {
        return existingToken.access_token;
      }

      // Token expired or doesn't exist - start OAuth flow
      const oauthFlow = new OAuth2BrowserFlow(AnthropicBackend.OAUTH_CONFIG);
      const token = await oauthFlow.authenticate();
      return token.access_token;
    } else {
      // API Key
      if (!this.apiKey) {
        throw new Error('Anthropic API key required. Set ANTHROPIC_API_KEY or use OAuth with: cacli login claude');
      }
      return this.apiKey;
    }
  }

  async chat(prompt: string, onStream?: StreamCallback): Promise<string | void> {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        stream: !!onStream
      };

      const response = await axios.post(
        this.baseUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': accessToken,
            'anthropic-version': '2023-06-01'
          },
          responseType: onStream ? 'stream' : 'json'
        }
      );

      if (!onStream) {
        // Non-streaming response
        return response.data.content[0].text;
      }

      // Streaming response
      for await (const chunk of response.data as any) {
        const text = chunk.toString();

        // Parse SSE format
        const lines = text.split('\n').filter((line: string) => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace(/^data: /, '').trim();

          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onStream(parsed.delta.text);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error: any) {
      const errorMsg = `Error connecting to Anthropic: ${error.response?.data?.error?.message || error.message}`;
      if (onStream) {
        onStream(errorMsg);
      }
      return errorMsg;
    }
  }

  /**
   * Static method to initiate OAuth login
   */
  static async login(): Promise<void> {
    console.log('🔐 Starting Anthropic Claude login...');
    const oauthFlow = new OAuth2BrowserFlow(AnthropicBackend.OAUTH_CONFIG);
    await oauthFlow.authenticate();
    console.log('✅ Successfully logged in to Claude!');
  }

  /**
   * Static method to logout (revoke token)
   */
  static async logout(): Promise<void> {
    await globalTokenStore.initialize();
    await globalTokenStore.revokeToken('anthropic');
    console.log('✅ Logged out from Claude');
  }
}
