import { globalTokenStore, OAuthToken } from './token-store';
import { OAuth2BrowserFlow, OAuth2Config } from './oauth2-browser-flow';

/**
 * High-level token management with auto-refresh
 */
export class TokenManager {
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialize token store on creation
    this.initialize();
  }

  async initialize(): Promise<void> {
    await globalTokenStore.initialize();
  }

  /**
   * Get a valid access token for a provider
   * Automatically refreshes if expired
   */
  async getValidToken(provider: string, oauthConfig?: OAuth2Config): Promise<string> {
    const token = await globalTokenStore.loadToken(provider);

    // No token - need to authenticate
    if (!token) {
      if (!oauthConfig) {
        throw new Error(`No token found for ${provider} and no OAuth config provided`);
      }
      const newToken = await this.authenticate(oauthConfig);
      return newToken.access_token;
    }

    // Check if token needs refresh
    if (token.expires_at) {
      const timeUntilExpiry = token.expires_at - Date.now();
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      // Token expired or about to expire
      if (timeUntilExpiry < REFRESH_THRESHOLD) {
        if (token.refresh_token && oauthConfig) {
          console.log('🔄 Token expiring soon, refreshing...');
          const flow = new OAuth2BrowserFlow(oauthConfig);
          const refreshedToken = await flow.refreshToken(token.refresh_token);
          return refreshedToken.access_token;
        } else if (!oauthConfig) {
          console.log('⚠️  Token expired but no OAuth config to refresh');
        } else {
          // No refresh token - need to re-authenticate
          console.log('🔐 Token expired and no refresh token available, re-authenticating...');
          const newToken = await this.authenticate(oauthConfig);
          return newToken.access_token;
        }
      }
    }

    return token.access_token;
  }

  /**
   * Authenticate user via OAuth2 browser flow
   */
  async authenticate(config: OAuth2Config): Promise<OAuthToken> {
    const flow = new OAuth2BrowserFlow(config);
    const token = await flow.authenticate();

    // Setup auto-refresh if token has expiration
    if (token.expires_at && token.refresh_token) {
      this.setupAutoRefresh(config, token);
    }

    return token;
  }

  /**
   * Setup automatic token refresh before expiration
   */
  private setupAutoRefresh(config: OAuth2Config, token: OAuthToken, retryCount: number = 0): void {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(config.provider);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (!token.expires_at || !token.refresh_token) {
      return;
    }

    // Refresh 5 minutes before expiration
    const refreshIn = Math.max(0, token.expires_at - Date.now() - (5 * 60 * 1000));

    const timer = setTimeout(async () => {
      try {
        console.log(`🔄 Auto-refreshing token for ${config.provider}...`);
        const flow = new OAuth2BrowserFlow(config);
        const refreshedToken = await flow.refreshToken(token.refresh_token!);

        // Setup next refresh (reset retry count on success)
        this.setupAutoRefresh(config, refreshedToken, 0);
      } catch (err) {
        console.error(`❌ Auto-refresh failed for ${config.provider}:`, err);

        // Retry with exponential backoff (max 3 retries)
        if (retryCount < 3) {
          const backoffMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20 minutes
          console.log(`⏰ Retrying in ${backoffMinutes} minutes (attempt ${retryCount + 1}/3)...`);

          const retryTimer = setTimeout(() => {
            this.setupAutoRefresh(config, token, retryCount + 1);
          }, backoffMinutes * 60 * 1000);

          this.refreshTimers.set(config.provider, retryTimer);
        } else {
          console.error('❌ Auto-refresh failed after 3 retries. Manual re-authentication required.');
          this.refreshTimers.delete(config.provider);
        }
      }
    }, refreshIn);

    this.refreshTimers.set(config.provider, timer);

    console.log(`⏰ Auto-refresh scheduled for ${config.provider} in ${Math.floor(refreshIn / 60000)} minutes`);
  }

  /**
   * Revoke a token and stop auto-refresh
   */
  async revokeToken(provider: string): Promise<void> {
    // Clear auto-refresh timer
    const timer = this.refreshTimers.get(provider);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(provider);
    }

    // Delete token from store
    await globalTokenStore.revokeToken(provider);
  }

  /**
   * List all saved tokens
   */
  listTokens(): { provider: string; expires_in?: string; has_refresh: boolean }[] {
    return globalTokenStore.listTokens();
  }

  /**
   * Manually refresh a token
   */
  async refreshToken(provider: string, oauthConfig: OAuth2Config): Promise<void> {
    const token = await globalTokenStore.loadToken(provider);

    if (!token) {
      throw new Error(`No token found for ${provider}`);
    }

    if (!token.refresh_token) {
      throw new Error(`Token for ${provider} has no refresh token`);
    }

    const flow = new OAuth2BrowserFlow(oauthConfig);
    await flow.refreshToken(token.refresh_token);
  }

  /**
   * Clear all tokens
   */
  async clearAll(): Promise<void> {
    // Clear all timers
    for (const timer of this.refreshTimers.values()) {
      clearTimeout(timer);
    }
    this.refreshTimers.clear();

    // Clear token store
    await globalTokenStore.clearAll();
  }
}

// Global token manager instance
export const globalTokenManager = new TokenManager();
