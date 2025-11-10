import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  expires_at?: number; // Unix timestamp
  scope?: string;
  provider: string;
}

/**
 * Secure token storage with encryption
 * Tokens persist across CLI restarts in ~/.codechat/tokens.json
 */
export class TokenStore {
  private tokensPath: string;
  private saltPath: string;
  private tokens: Map<string, OAuthToken> = new Map();
  private encryptionKey!: Buffer;

  constructor(customPath?: string) {
    const configDir = path.join(os.homedir(), '.codechat');
    this.tokensPath = customPath || path.join(configDir, 'tokens.json');

    // If custom path is provided, use same directory for salt
    if (customPath) {
      this.saltPath = path.join(path.dirname(customPath), '.salt');
    } else {
      this.saltPath = path.join(configDir, '.salt');
    }
  }

  /**
   * Initialize token store and load saved tokens
   */
  async initialize(): Promise<void> {
    // Ensure config directory exists
    const dir = path.dirname(this.tokensPath);
    await fs.mkdir(dir, { recursive: true });

    // Initialize encryption key with secure salt (must succeed)
    await this.initializeEncryptionKey();

    // Try to load existing tokens
    try {
      await this.load();
    } catch (err) {
      // File doesn't exist yet - that's OK, we'll create it on first save
      console.log('📁 Creating new token store...');
    }
  }

  /**
   * Initialize encryption key with secure random salt
   * Salt is persisted to disk for consistent encryption/decryption
   */
  private async initializeEncryptionKey(): Promise<void> {
    let salt: Buffer;

    try {
      // Try to load existing salt
      const saltData = await fs.readFile(this.saltPath);
      salt = saltData;
    } catch {
      // Generate new random salt
      salt = crypto.randomBytes(32);

      // Save salt with restricted permissions (0o600 = owner read/write only)
      await fs.writeFile(this.saltPath, salt, { mode: 0o600 });
      console.log('🔐 Generated new encryption salt');
    }

    // Derive encryption key from machine-specific data + random salt
    // This provides both uniqueness and randomness
    const keySource = os.hostname() + os.userInfo().username;
    this.encryptionKey = crypto.scryptSync(keySource, salt, 32);
  }

  /**
   * Save a token for a provider (persists to disk)
   */
  async saveToken(provider: string, token: OAuthToken): Promise<void> {
    // Calculate expiration timestamp if expires_in is provided
    if (token.expires_in && !token.expires_at) {
      token.expires_at = Date.now() + (token.expires_in * 1000);
    }

    token.provider = provider;
    this.tokens.set(provider, token);
    await this.save();

    console.log(`✅ Token saved for ${provider} (persists across restarts)`);
  }

  /**
   * Load a token for a provider
   */
  async loadToken(provider: string): Promise<OAuthToken | null> {
    const token = this.tokens.get(provider);
    if (!token) {
      return null;
    }

    // Check if token is expired
    if (token.expires_at && token.expires_at < Date.now()) {
      console.log(`⚠️  Token for ${provider} has expired`);
      return token; // Return it anyway - caller can decide to refresh
    }

    return token;
  }

  /**
   * Check if a valid token exists for a provider
   */
  async hasValidToken(provider: string): Promise<boolean> {
    const token = await this.loadToken(provider);
    if (!token) return false;

    // Valid if not expired or has refresh token
    if (!token.expires_at) return true;
    return token.expires_at > Date.now() || !!token.refresh_token;
  }

  /**
   * Revoke a token (delete from store)
   */
  async revokeToken(provider: string): Promise<void> {
    this.tokens.delete(provider);
    await this.save();
    console.log(`🗑️  Token for ${provider} revoked and deleted`);
  }

  /**
   * List all saved tokens with expiration info
   */
  listTokens(): { provider: string; expires_in?: string; has_refresh: boolean }[] {
    const result = [];

    for (const [provider, token] of this.tokens.entries()) {
      let expires_in: string | undefined;

      if (token.expires_at) {
        const remaining = token.expires_at - Date.now();
        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

          if (hours >= 24) {
            const days = Math.floor(hours / 24);
            expires_in = `${days}d ${hours % 24}h`;
          } else if (hours > 0) {
            expires_in = `${hours}h ${minutes}m`;
          } else {
            expires_in = `${minutes}m`;
          }
        } else {
          expires_in = 'expired';
        }
      }

      result.push({
        provider,
        expires_in,
        has_refresh: !!token.refresh_token
      });
    }

    return result;
  }

  /**
   * Clear all tokens
   */
  async clearAll(): Promise<void> {
    this.tokens.clear();
    await this.save();
    console.log('🗑️  All tokens cleared');
  }

  /**
   * Save tokens to disk (encrypted)
   */
  private async save(): Promise<void> {
    try {
      const data = JSON.stringify(Array.from(this.tokens.entries()), null, 2);
      const encrypted = this.encrypt(data);
      await fs.writeFile(this.tokensPath, encrypted, 'utf-8');
    } catch (err) {
      console.error('❌ Failed to save tokens:', err);
    }
  }

  /**
   * Load tokens from disk (decrypt)
   */
  private async load(): Promise<void> {
    try {
      const encrypted = await fs.readFile(this.tokensPath, 'utf-8');
      const decrypted = this.decrypt(encrypted);
      const entries = JSON.parse(decrypted);
      this.tokens = new Map(entries);

      console.log(`📁 Loaded ${this.tokens.size} saved token(s)`);
    } catch (err) {
      // File doesn't exist or is corrupted - start fresh
      this.tokens = new Map();
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Global token store instance
export const globalTokenStore = new TokenStore();
