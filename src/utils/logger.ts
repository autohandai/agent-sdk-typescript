/**
 * Logger interface for structured logging throughout the SDK.
 * Provides configurable logging levels and context metadata.
 */

export interface LogContext {
  /** Additional metadata to include with the log entry */
  [key: string]: unknown;
}

export interface Logger {
  /**
   * Log a debug message.
   * @param message - The log message
   * @param context - Additional context metadata
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log an info message.
   * @param message - The log message
   * @param context - Additional context metadata
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log a warning message.
   * @param message - The log message
   * @param context - Additional context metadata
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log an error message.
   * @param message - The log message
   * @param error - The error object (optional)
   * @param context - Additional context metadata
   */
  error(message: string, error?: Error, context?: LogContext): void;
}

/**
 * Console-based logger implementation.
 * Outputs to console with appropriate log levels.
 */
export class ConsoleLogger implements Logger {
  constructor(
    private readonly prefix: string = 'AutohandSDK',
    private readonly level: LogLevel = LogLevel.INFO
  ) {}

  debug(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.prefix}] ${message}`, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.prefix}] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.prefix}] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.prefix}] ${message}`, error || '', context || '');
    }
  }
}

/**
 * No-op logger implementation.
 * Suppresses all log output for production use.
 */
export class NoOpLogger implements Logger {
  debug(_message: string, _context?: LogContext): void {
    // No-op
  }

  info(_message: string, _context?: LogContext): void {
    // No-op
  }

  warn(_message: string, _context?: LogContext): void {
    // No-op
  }

  error(_message: string, _error?: Error, _context?: LogContext): void {
    // No-op
  }
}

/**
 * Log levels for filtering log output.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Default logger instance (no-op for production).
 */
export const defaultLogger: Logger = new NoOpLogger();
