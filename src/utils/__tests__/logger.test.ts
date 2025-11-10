import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Clear environment variable
    delete process.env.LOG_LEVEL;
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new Logger('test', LogLevel.DEBUG);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug + info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should not log debug when level is INFO', () => {
      const logger = new Logger('test', LogLevel.INFO);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // only info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should only log warnings and errors when level is WARN', () => {
      const logger = new Logger('test', LogLevel.WARN);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should only log errors when level is ERROR', () => {
      const logger = new Logger('test', LogLevel.ERROR);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should not log anything when level is NONE', () => {
      const logger = new Logger('test', LogLevel.NONE);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Formatting', () => {
    it('should include timestamp in log messages', () => {
      const logger = new Logger('', LogLevel.INFO);
      logger.info('Test message');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toMatch(/\[\d{2}:\d{2}:\d{2}\]/); // [HH:MM:SS]
      expect(call).toContain('[INFO]');
      expect(call).toContain('Test message');
    });

    it('should include prefix when provided', () => {
      const logger = new Logger('MyModule', LogLevel.INFO);
      logger.info('Test');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[MyModule]');
    });

    it('should not include prefix when empty', () => {
      const logger = new Logger('', LogLevel.INFO);
      logger.info('Test');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('[][]'); // No double empty brackets
    });
  });

  describe('Environment Variable', () => {
    it('should use INFO level by default', () => {
      const logger = new Logger('test');

      logger.debug('Debug');
      logger.info('Info');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // only info
    });

    it('should respect LOG_LEVEL=debug environment variable', () => {
      process.env.LOG_LEVEL = 'debug';
      const logger = new Logger('test');

      logger.debug('Debug');
      logger.info('Info');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // both
    });

    it('should respect LOG_LEVEL=warn environment variable', () => {
      process.env.LOG_LEVEL = 'warn';
      const logger = new Logger('test');

      logger.info('Info');
      logger.warn('Warn');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect LOG_LEVEL=error environment variable', () => {
      process.env.LOG_LEVEL = 'error';
      const logger = new Logger('test');

      logger.warn('Warn');
      logger.error('Error');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect LOG_LEVEL=none environment variable', () => {
      process.env.LOG_LEVEL = 'none';
      const logger = new Logger('test');

      logger.error('Error');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('setLevel', () => {
    it('should change log level dynamically', () => {
      const logger = new Logger('test', LogLevel.INFO);

      logger.debug('Debug 1');
      expect(consoleLogSpy).toHaveBeenCalledTimes(0);

      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Debug 2');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('child', () => {
    it('should create child logger with nested prefix', () => {
      const parent = new Logger('Parent', LogLevel.INFO);
      const child = parent.child('Child');

      child.info('Test');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[Parent:Child]');
    });

    it('should inherit parent log level', () => {
      const parent = new Logger('Parent', LogLevel.WARN);
      const child = parent.child('Child');

      child.info('Info');
      child.warn('Warn');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('success', () => {
    it('should log success messages with checkmark', () => {
      const logger = new Logger('test', LogLevel.INFO);
      logger.success('Operation completed');

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).toContain('[✅]');
      expect(call).toContain('Operation completed');
    });

    it('should not log success when level is NONE', () => {
      const logger = new Logger('test', LogLevel.NONE);
      logger.success('Success');

      expect(consoleLogSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('Additional arguments', () => {
    it('should pass additional arguments to console', () => {
      const logger = new Logger('test', LogLevel.INFO);
      const obj = { key: 'value' };

      logger.info('Message', obj, 123);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message'),
        obj,
        123
      );
    });
  });
});
