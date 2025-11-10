import { TokenStore, OAuthToken } from '../token-store';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('TokenStore', () => {
  let store: TokenStore;
  let testDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = path.join(os.tmpdir(), `cacli-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const tokensPath = path.join(testDir, 'tokens.json');
    store = new TokenStore(tokensPath);
    await store.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('saveToken and loadToken', () => {
    it('should save and load a token', async () => {
      const token: OAuthToken = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        provider: 'google',
      };

      await store.saveToken('google', token);
      const loaded = await store.loadToken('google');

      expect(loaded).toBeTruthy();
      expect(loaded?.access_token).toBe('test-access-token');
      expect(loaded?.refresh_token).toBe('test-refresh-token');
      expect(loaded?.token_type).toBe('Bearer');
      expect(loaded?.provider).toBe('google');
    });

    it('should return null for non-existent provider', async () => {
      const loaded = await store.loadToken('github');
      expect(loaded).toBeNull();
    });

    it('should handle multiple providers', async () => {
      const googleToken: OAuthToken = {
        access_token: 'google-token',
        token_type: 'Bearer',
        provider: 'google',
      };

      const githubToken: OAuthToken = {
        access_token: 'github-token',
        token_type: 'Bearer',
        provider: 'github',
      };

      await store.saveToken('google', googleToken);
      await store.saveToken('github', githubToken);

      const loadedGoogle = await store.loadToken('google');
      const loadedGithub = await store.loadToken('github');

      expect(loadedGoogle?.access_token).toBe('google-token');
      expect(loadedGithub?.access_token).toBe('github-token');
    });

    it('should calculate expires_at from expires_in', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        provider: 'test',
      };

      const before = Date.now();
      await store.saveToken('test', token);
      const after = Date.now();

      const loaded = await store.loadToken('test');

      expect(loaded?.expires_at).toBeDefined();
      expect(loaded!.expires_at!).toBeGreaterThan(before + 3599000); // 3599s
      expect(loaded!.expires_at!).toBeLessThan(after + 3601000); // 3601s
    });
  });

  describe('hasValidToken', () => {
    it('should return false for non-existent token', async () => {
      const hasValid = await store.hasValidToken('github');
      expect(hasValid).toBe(false);
    });

    it('should return true for valid token without expiration', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        provider: 'test',
      };

      await store.saveToken('test', token);
      const hasValid = await store.hasValidToken('test');
      expect(hasValid).toBe(true);
    });

    it('should return true for non-expired token', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600, // 1 hour
        provider: 'test',
      };

      await store.saveToken('test', token);
      const hasValid = await store.hasValidToken('test');
      expect(hasValid).toBe(true);
    });

    it('should return true for expired token with refresh_token', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_at: Date.now() - 1000, // Expired 1 second ago
        refresh_token: 'refresh-token',
        provider: 'test',
      };

      await store.saveToken('test', token);
      const hasValid = await store.hasValidToken('test');
      expect(hasValid).toBe(true); // Valid because has refresh token
    });

    it('should return false for expired token without refresh_token', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_at: Date.now() - 1000, // Expired 1 second ago
        provider: 'test',
      };

      await store.saveToken('test', token);
      const hasValid = await store.hasValidToken('test');
      expect(hasValid).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should delete a token', async () => {
      const token: OAuthToken = {
        access_token: 'test-token',
        token_type: 'Bearer',
        provider: 'test',
      };

      await store.saveToken('test', token);
      expect(await store.loadToken('test')).toBeTruthy();

      await store.revokeToken('test');
      expect(await store.loadToken('test')).toBeNull();
    });
  });

  describe('listTokens', () => {
    it('should list all tokens with expiration info', async () => {
      const token1: OAuthToken = {
        access_token: 'token1',
        token_type: 'Bearer',
        expires_in: 3600,
        provider: 'google',
      };

      const token2: OAuthToken = {
        access_token: 'token2',
        token_type: 'Bearer',
        refresh_token: 'refresh',
        provider: 'github',
      };

      await store.saveToken('google', token1);
      await store.saveToken('github', token2);

      const list = store.listTokens();

      expect(list).toHaveLength(2);
      expect(list.find((t) => t.provider === 'google')).toBeTruthy();
      expect(list.find((t) => t.provider === 'github')).toBeTruthy();
      expect(list.find((t) => t.provider === 'github')?.has_refresh).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all tokens', async () => {
      await store.saveToken('google', {
        access_token: 'token1',
        token_type: 'Bearer',
        provider: 'google',
      });

      await store.saveToken('github', {
        access_token: 'token2',
        token_type: 'Bearer',
        provider: 'github',
      });

      expect(store.listTokens()).toHaveLength(2);

      await store.clearAll();

      expect(store.listTokens()).toHaveLength(0);
      expect(await store.loadToken('google')).toBeNull();
      expect(await store.loadToken('github')).toBeNull();
    });
  });

  describe('encryption', () => {
    it('should persist tokens across instances', async () => {
      const tokensPath = path.join(testDir, 'tokens.json');

      // First instance
      const store1 = new TokenStore(tokensPath);
      await store1.initialize();

      await store1.saveToken('test', {
        access_token: 'test-token',
        token_type: 'Bearer',
        provider: 'test',
      });

      // Second instance (simulates restart)
      const store2 = new TokenStore(tokensPath);
      await store2.initialize();

      const loaded = await store2.loadToken('test');
      expect(loaded?.access_token).toBe('test-token');
    });

    it('should encrypt tokens on disk', async () => {
      const tokensPath = path.join(testDir, 'tokens.json');

      await store.saveToken('test', {
        access_token: 'secret-token-12345',
        token_type: 'Bearer',
        provider: 'test',
      });

      // Read raw file content
      const rawContent = await fs.readFile(tokensPath, 'utf-8');

      // Token should not be in plaintext
      expect(rawContent).not.toContain('secret-token-12345');

      // Should be encrypted format (iv:authTag:encrypted)
      expect(rawContent.split(':').length).toBeGreaterThan(2);
    });
  });
});
