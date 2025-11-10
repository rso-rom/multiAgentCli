/**
 * Custom error classes for better error handling and debugging
 */

/**
 * Base error class for all cacli errors
 */
export class CacliError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CacliError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Token-related errors (authentication, refresh, etc.)
 */
export class TokenError extends CacliError {
  constructor(message: string, public provider: string, code?: string) {
    super(message, code);
    this.name = 'TokenError';
  }
}

/**
 * OAuth2 flow errors
 */
export class OAuth2Error extends CacliError {
  constructor(
    message: string,
    public provider: string,
    public oauthError?: string,
    public errorDescription?: string
  ) {
    super(message, oauthError);
    this.name = 'OAuth2Error';
  }
}

/**
 * Network/API errors
 */
export class NetworkError extends CacliError {
  constructor(
    message: string,
    public url: string,
    public statusCode?: number,
    public responseBody?: any
  ) {
    super(message, statusCode?.toString());
    this.name = 'NetworkError';
  }
}

/**
 * Workflow execution errors
 */
export class WorkflowError extends CacliError {
  constructor(
    message: string,
    public workflowName: string,
    public agentName?: string,
    public step?: number
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * Agent execution errors
 */
export class AgentError extends CacliError {
  constructor(
    message: string,
    public agentName: string,
    public task?: string
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

/**
 * Memory system errors
 */
export class MemoryError extends CacliError {
  constructor(
    message: string,
    public memoryType: 'short' | 'mid' | 'long' | 'global',
    public operation?: string
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends CacliError {
  constructor(
    message: string,
    public configKey?: string
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Tool installation/execution errors
 */
export class ToolError extends CacliError {
  constructor(
    message: string,
    public toolName: string,
    public operation?: 'install' | 'execute' | 'check'
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends CacliError {
  constructor(
    message: string,
    public timeoutMs: number,
    public operation?: string
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends CacliError {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Helper function to check if error is a specific type
 */
export function isTokenError(error: unknown): error is TokenError {
  return error instanceof TokenError;
}

export function isOAuth2Error(error: unknown): error is OAuth2Error {
  return error instanceof OAuth2Error;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isWorkflowError(error: unknown): error is WorkflowError {
  return error instanceof WorkflowError;
}

export function isTimeoutError(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

/**
 * Format error for user-friendly display
 */
export function formatError(error: unknown): string {
  if (error instanceof CacliError) {
    let formatted = `❌ ${error.name}: ${error.message}`;

    // Add specific details based on error type
    if (error instanceof TokenError) {
      formatted += `\n   Provider: ${error.provider}`;
    } else if (error instanceof OAuth2Error) {
      formatted += `\n   Provider: ${error.provider}`;
      if (error.errorDescription) {
        formatted += `\n   Details: ${error.errorDescription}`;
      }
    } else if (error instanceof NetworkError) {
      formatted += `\n   URL: ${error.url}`;
      if (error.statusCode) {
        formatted += `\n   Status: ${error.statusCode}`;
      }
    } else if (error instanceof WorkflowError) {
      formatted += `\n   Workflow: ${error.workflowName}`;
      if (error.agentName) {
        formatted += `\n   Agent: ${error.agentName}`;
      }
      if (error.step !== undefined) {
        formatted += `\n   Step: ${error.step}`;
      }
    } else if (error instanceof TimeoutError) {
      formatted += `\n   Timeout: ${error.timeoutMs}ms`;
      if (error.operation) {
        formatted += `\n   Operation: ${error.operation}`;
      }
    }

    return formatted;
  }

  if (error instanceof Error) {
    return `❌ Error: ${error.message}`;
  }

  return `❌ Unknown error: ${String(error)}`;
}
