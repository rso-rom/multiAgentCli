import crypto from 'crypto';
import { exec } from 'child_process';
import axios from 'axios';
import { CallbackServer } from './callback-server';
import { globalTokenStore, OAuthToken } from './token-store';

export interface OAuth2Config {
  provider: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  callbackPort?: number;
  usePKCE?: boolean; // Proof Key for Code Exchange (more secure)
}

/**
 * OAuth2 Authorization Code Flow with Browser
 * Handles the complete OAuth2 flow including token refresh
 */
export class OAuth2BrowserFlow {
  private config: OAuth2Config;
  private codeVerifier?: string;
  private state: string;

  constructor(config: OAuth2Config) {
    this.config = {
      callbackPort: 8080,
      scopes: [],
      usePKCE: true,
      ...config
    };

    if (!this.config.redirectUri) {
      this.config.redirectUri = `http://localhost:${this.config.callbackPort}/callback`;
    }

    this.state = crypto.randomBytes(16).toString('hex');
  }

  /**
   * Authenticate user and get access token
   * Will use saved token if available and valid
   */
  async authenticate(): Promise<OAuthToken> {
    // Initialize token store
    await globalTokenStore.initialize();

    // Check for existing valid token
    const existingToken = await globalTokenStore.loadToken(this.config.provider);

    if (existingToken) {
      // Token exists - check if valid
      if (existingToken.expires_at && existingToken.expires_at > Date.now()) {
        console.log(`✅ Using saved ${this.config.provider} token (expires in ${this.getTimeRemaining(existingToken.expires_at)})`);
        return existingToken;
      }

      // Token expired but has refresh token
      if (existingToken.refresh_token) {
        console.log('🔄 Token expired, refreshing...');
        try {
          const refreshedToken = await this.refreshToken(existingToken.refresh_token);
          return refreshedToken;
        } catch (_err) {
          console.log('⚠️  Token refresh failed, starting new authentication...');
        }
      }
    }

    // No valid token - start browser flow
    console.log(`🔐 Authentication required for ${this.config.provider}`);
    return await this.startBrowserFlow();
  }

  /**
   * Start the browser-based OAuth flow
   */
  private async startBrowserFlow(): Promise<OAuthToken> {
    // Generate PKCE challenge if enabled
    if (this.config.usePKCE) {
      this.codeVerifier = this.generateCodeVerifier();
    }

    // Build authorization URL
    const authUrl = this.buildAuthUrl();

    // Start callback server
    const callbackServer = new CallbackServer(this.config.callbackPort);

    try {
      // Open browser
      console.log(`🌐 Opening browser for ${this.config.provider} login...`);
      await this.openBrowser(authUrl);

      // Wait for callback
      const result = await callbackServer.waitForCallback();

      if (result.error) {
        throw new Error(`OAuth error: ${result.error}`);
      }

      if (!result.code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for token
      console.log('🔄 Exchanging authorization code for token...');
      const token = await this.exchangeCodeForToken(result.code);

      // Save token
      await globalTokenStore.saveToken(this.config.provider, token);

      console.log('✅ Successfully authenticated! Token saved for future use.');
      return token;

    } finally {
      // Always stop server, even on success (prevents hanging)
      callbackServer.stop();
    }
  }

  /**
   * Refresh an expired access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<OAuthToken> {
    try {
      const response = await axios.post(this.config.tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        ...(this.config.clientSecret && { client_secret: this.config.clientSecret })
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token: OAuthToken = {
        ...response.data,
        provider: this.config.provider,
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };

      // Save refreshed token
      await globalTokenStore.saveToken(this.config.provider, token);

      console.log(`✅ Token refreshed successfully (valid for ${response.data.expires_in / 60} minutes)`);
      return token;

    } catch (err: any) {
      console.error('❌ Failed to refresh token:', err.response?.data || err.message);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Build authorization URL with PKCE if enabled
   */
  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri!,
      state: this.state,
      ...(this.config.scopes && this.config.scopes.length > 0 && {
        scope: this.config.scopes.join(' ')
      })
    });

    // Add PKCE challenge
    if (this.config.usePKCE && this.codeVerifier) {
      const challenge = this.generateCodeChallenge(this.codeVerifier);
      params.append('code_challenge', challenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${this.config.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<OAuthToken> {
    const params: any = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId
    };

    // Add client secret if provided
    if (this.config.clientSecret) {
      params.client_secret = this.config.clientSecret;
    }

    // Add PKCE verifier
    if (this.config.usePKCE && this.codeVerifier) {
      params.code_verifier = this.codeVerifier;
    }

    try {
      const response = await axios.post(this.config.tokenUrl, new URLSearchParams(params), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const token: OAuthToken = {
        ...response.data,
        provider: this.config.provider,
        expires_at: response.data.expires_in
          ? Date.now() + (response.data.expires_in * 1000)
          : undefined
      };

      return token;

    } catch (err: any) {
      console.error('Token exchange failed:', err.response?.data || err.message);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  /**
   * Open URL in default browser (cross-platform)
   */
  private async openBrowser(url: string): Promise<void> {
    const command = process.platform === 'win32' ? 'start'
      : process.platform === 'darwin' ? 'open'
        : 'xdg-open';

    return new Promise((resolve) => {
      exec(`${command} "${url}"`, (err) => {
        if (err) {
          console.log(`\n⚠️  Could not open browser automatically. Please visit:\n${url}\n`);
        }
        resolve();
      });
    });
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Get human-readable time remaining
   */
  private getTimeRemaining(expiresAt: number): string {
    const remaining = expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
