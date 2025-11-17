import {
  CacliError,
  TokenError,
  OAuth2Error,
  NetworkError,
  WorkflowError,
  TimeoutError,
  ValidationError,
  formatError,
  isTokenError,
  isOAuth2Error,
  isNetworkError,
  isTimeoutError,
} from '../errors';

describe('Custom Error Classes', () => {
  describe('CacliError', () => {
    it('should create basic error', () => {
      const error = new CacliError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('CacliError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should capture stack trace', () => {
      const error = new CacliError('Test error');
      expect(error.stack).toBeDefined();
    });
  });

  describe('TokenError', () => {
    it('should include provider information', () => {
      const error = new TokenError('Token expired', 'google', 'EXPIRED');

      expect(error.message).toBe('Token expired');
      expect(error.provider).toBe('google');
      expect(error.code).toBe('EXPIRED');
      expect(error.name).toBe('TokenError');
    });

    it('should be identifiable with type guard', () => {
      const error = new TokenError('Test', 'github');
      expect(isTokenError(error)).toBe(true);
      expect(isOAuth2Error(error)).toBe(false);
    });
  });

  describe('OAuth2Error', () => {
    it('should include OAuth details', () => {
      const error = new OAuth2Error(
        'Authentication failed',
        'google',
        'access_denied',
        'User denied access'
      );

      expect(error.message).toBe('Authentication failed');
      expect(error.provider).toBe('google');
      expect(error.oauthError).toBe('access_denied');
      expect(error.errorDescription).toBe('User denied access');
      expect(error.name).toBe('OAuth2Error');
    });

    it('should be identifiable with type guard', () => {
      const error = new OAuth2Error('Test', 'google');
      expect(isOAuth2Error(error)).toBe(true);
      expect(isTokenError(error)).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should include network details', () => {
      const error = new NetworkError(
        'Request failed',
        'https://api.example.com',
        404,
        { error: 'Not found' }
      );

      expect(error.message).toBe('Request failed');
      expect(error.url).toBe('https://api.example.com');
      expect(error.statusCode).toBe(404);
      expect(error.responseBody).toEqual({ error: 'Not found' });
      expect(error.code).toBe('404');
    });

    it('should be identifiable with type guard', () => {
      const error = new NetworkError('Test', 'http://test.com');
      expect(isNetworkError(error)).toBe(true);
    });
  });

  describe('WorkflowError', () => {
    it('should include workflow context', () => {
      const error = new WorkflowError(
        'Step failed',
        'develop',
        'backend',
        2
      );

      expect(error.message).toBe('Step failed');
      expect(error.workflowName).toBe('develop');
      expect(error.agentName).toBe('backend');
      expect(error.step).toBe(2);
    });
  });

  describe('TimeoutError', () => {
    it('should include timeout information', () => {
      const error = new TimeoutError('Operation timed out', 5000, 'API call');

      expect(error.message).toBe('Operation timed out');
      expect(error.timeoutMs).toBe(5000);
      expect(error.operation).toBe('API call');
    });

    it('should be identifiable with type guard', () => {
      const error = new TimeoutError('Test', 1000);
      expect(isTimeoutError(error)).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should include validation details', () => {
      const error = new ValidationError('Invalid email', 'email', 'not-an-email');

      expect(error.message).toBe('Invalid email');
      expect(error.field).toBe('email');
      expect(error.value).toBe('not-an-email');
    });
  });

  describe('formatError', () => {
    it('should format TokenError with details', () => {
      const error = new TokenError('Token expired', 'google', 'EXPIRED');
      const formatted = formatError(error);

      expect(formatted).toContain('TokenError');
      expect(formatted).toContain('Token expired');
      expect(formatted).toContain('Provider: google');
    });

    it('should format OAuth2Error with description', () => {
      const error = new OAuth2Error(
        'Auth failed',
        'google',
        'access_denied',
        'User denied'
      );
      const formatted = formatError(error);

      expect(formatted).toContain('OAuth2Error');
      expect(formatted).toContain('Provider: google');
      expect(formatted).toContain('Details: User denied');
    });

    it('should format NetworkError with status', () => {
      const error = new NetworkError('Failed', 'http://test.com', 404);
      const formatted = formatError(error);

      expect(formatted).toContain('NetworkError');
      expect(formatted).toContain('URL: http://test.com');
      expect(formatted).toContain('Status: 404');
    });

    it('should format WorkflowError with context', () => {
      const error = new WorkflowError('Failed', 'develop', 'backend', 2);
      const formatted = formatError(error);

      expect(formatted).toContain('WorkflowError');
      expect(formatted).toContain('Workflow: develop');
      expect(formatted).toContain('Agent: backend');
      expect(formatted).toContain('Step: 2');
    });

    it('should format TimeoutError with timeout', () => {
      const error = new TimeoutError('Timeout', 5000, 'API call');
      const formatted = formatError(error);

      expect(formatted).toContain('TimeoutError');
      expect(formatted).toContain('Timeout: 5000ms');
      expect(formatted).toContain('Operation: API call');
    });

    it('should handle regular Error', () => {
      const error = new Error('Regular error');
      const formatted = formatError(error);

      expect(formatted).toContain('Error: Regular error');
    });

    it('should handle unknown error types', () => {
      const formatted = formatError('string error');
      expect(formatted).toContain('Unknown error: string error');
    });
  });
});
