/**
 * Logging system with configurable log levels
 * Replaces scattered console.log calls with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private level: LogLevel;
  private prefix: string;

  constructor(prefix: string = '', level?: LogLevel) {
    this.prefix = prefix;
    this.level = level !== undefined ? level : this.getDefaultLogLevel();
  }

  /**
   * Get log level from environment variable
   */
  private getDefaultLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();

    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      case 'none':
        return LogLevel.NONE;
      default:
        return LogLevel.INFO; // Default
    }
  }

  /**
   * Set log level programmatically
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Format timestamp
   */
  private timestamp(): string {
    const now = new Date();
    const time = now.toLocaleTimeString('de-DE', { hour12: false });
    return `[${time}]`;
  }

  /**
   * Format log message with prefix
   */
  private format(level: string, message: string): string {
    const ts = this.timestamp();
    const pfx = this.prefix ? `[${this.prefix}]` : '';
    return `${ts}${pfx}[${level}] ${message}`;
  }

  /**
   * Debug logging (verbose details)
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.format('DEBUG', message), ...args);
    }
  }

  /**
   * Info logging (general information)
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format('INFO', message), ...args);
    }
  }

  /**
   * Warning logging
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.format('WARN', message), ...args);
    }
  }

  /**
   * Error logging
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.format('ERROR', message), ...args);
    }
  }

  /**
   * Success logging (always shown unless NONE)
   */
  success(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format('✅', message), ...args);
    }
  }

  /**
   * Create child logger with prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(childPrefix, this.level);
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience functions
export const debug = (msg: string, ...args: any[]) => logger.debug(msg, ...args);
export const info = (msg: string, ...args: any[]) => logger.info(msg, ...args);
export const warn = (msg: string, ...args: any[]) => logger.warn(msg, ...args);
export const error = (msg: string, ...args: any[]) => logger.error(msg, ...args);
export const success = (msg: string, ...args: any[]) => logger.success(msg, ...args);
