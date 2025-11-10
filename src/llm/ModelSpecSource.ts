/**
 * Source for model specification
 * Can load from OpenAPI URL (preferred) or local JSON file (fallback)
 */
export interface ModelSpecSource {
  model: string;
  openApiUrl?: string;       // optional, preferred
  localJsonPath?: string;    // fallback
}

/**
 * API specification format
 */
export interface APISpec {
  model: string;
  auth: {
    type: 'apikey' | 'oauth' | 'bearer' | 'none';
    prompt?: string;
    headerName?: string;
    envVar?: string; // Environment variable name for API key
    oauthConfig?: {
      authUrl: string;
      tokenUrl: string;
      clientId: string;
      clientSecret?: string;
      scopes?: string[];
      callbackPort?: number;
    };
  };
  endpoints: Record<string, {
    method: string;
    url: string;
    baseUrl?: string;
  }>;
  parameters: Record<string, string>;
  requestFormat?: 'json' | 'form';
  responseFormat?: 'json' | 'text' | 'stream';
}
