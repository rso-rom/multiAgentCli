import express from 'express';
import type { Server } from 'http';

export interface CallbackResult {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * Temporary HTTP server for OAuth2 callback
 * Listens on localhost for the OAuth redirect
 */
export class CallbackServer {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;
  private callbackPath: string;
  private requestCount: number = 0;
  private readonly MAX_REQUESTS = 10;

  constructor(port: number = 8080, callbackPath: string = '/callback') {
    this.port = port;
    this.callbackPath = callbackPath;
    this.app = express();
  }

  /**
   * Start server and wait for OAuth callback
   * Returns a promise that resolves with the authorization code
   */
  async waitForCallback(timeoutMs: number = 120000): Promise<CallbackResult> {
    return new Promise((resolve, reject) => {
      let resolved = false;

      // Success/error page HTML
      const successHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #667eea; margin-bottom: 20px; }
            p { color: #666; margin-bottom: 20px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Authentication Successful!</h1>
            <p>You can close this window and return to the CLI.</p>
          </div>
        </body>
        </html>
      `;

      const errorHtml = (error: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Failed</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            h1 { color: #f5576c; margin-bottom: 20px; }
            p { color: #666; margin-bottom: 20px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            .error { background: #fee; padding: 10px; border-radius: 4px; color: #c00; font-family: monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Authentication Failed</h1>
            <p>An error occurred during authentication.</p>
            <div class="error">${error}</div>
            <p style="margin-top: 20px;">You can close this window and try again.</p>
          </div>
        </body>
        </html>
      `;

      // Handle OAuth callback
      this.app.get(this.callbackPath, (req, res) => {
        // Rate limiting: prevent callback spam/DoS
        if (this.requestCount++ > this.MAX_REQUESTS) {
          res.status(429).send('Too many requests');
          return;
        }

        if (resolved) {
          res.status(400).send('Already processed');
          return;
        }
        resolved = true;

        const { code, state, error, error_description } = req.query;

        if (error) {
          res.send(errorHtml(error_description as string || error as string));
          this.stop();
          reject(new Error(`OAuth error: ${error} - ${error_description}`));
          return;
        }

        if (!code) {
          res.send(errorHtml('No authorization code received'));
          this.stop();
          reject(new Error('No authorization code received'));
          return;
        }

        res.send(successHtml);

        // Give browser time to render page before closing server
        setTimeout(() => {
          this.stop();
          resolve({
            code: code as string,
            state: state as string
          });
        }, 500);
      });

      // Start server
      this.server = this.app.listen(this.port, () => {
        console.log(`🌐 OAuth callback server listening on http://localhost:${this.port}${this.callbackPath}`);
        console.log(`⏱️  Waiting for authentication (timeout: ${timeoutMs / 1000}s)...`);
      });

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.stop();
          reject(new Error('OAuth callback timeout - no response received'));
        }
      }, timeoutMs);

      // Handle server errors
      this.server.on('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          this.stop(); // Always stop server on error
          if (err.code === 'EADDRINUSE') {
            reject(new Error(`Port ${this.port} is already in use. Please close other applications or choose a different port.`));
          } else {
            reject(err);
          }
        }
      });
    });
  }

  /**
   * Stop the callback server
   */
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('🛑 Callback server stopped');
    }
  }

  /**
   * Get the redirect URI for OAuth configuration
   */
  getRedirectUri(): string {
    return `http://localhost:${this.port}${this.callbackPath}`;
  }
}
