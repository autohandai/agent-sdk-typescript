/**
 * Custom error hierarchy for Autohand Code SDK.
 * Provides structured error handling with error codes and context.
 */

/**
 * Base error class for all SDK errors.
 * Includes error code, context, and cause for better error handling.
 */
export abstract class SDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get a detailed error message including context.
   */
  getDetails(): string {
    const details = [this.message];
    
    if (this.context) {
      details.push(`Context: ${JSON.stringify(this.context)}`);
    }
    
    if (this.cause) {
      details.push(`Caused by: ${this.cause.message}`);
    }
    
    return details.join('\n');
  }
}

/**
 * Error thrown when an operation times out.
 */
export class TimeoutError extends SDKError {
  code = 'TIMEOUT' as const;

  constructor(
    message: string,
    timeoutMs: number,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 'TIMEOUT', { ...context, timeoutMs }, cause);
  }
}

/**
 * Error thrown when retry attempts are exhausted.
 */
export class RetryExhaustedError extends SDKError {
  code = 'RETRY_EXHAUSTED' as const;

  constructor(
    message: string,
    attempts: number,
    lastError: Error,
    context?: Record<string, unknown>
  ) {
    super(message, 'RETRY_EXHAUSTED', { ...context, attempts }, lastError);
  }
}

/**
 * Error thrown when runtime validation fails.
 */
export class ValidationError extends SDKError {
  code = 'VALIDATION' as const;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION', { ...context, field, value });
  }
}

/**
 * Error thrown when provider communication fails.
 */
export class ProviderError extends SDKError {
  code = 'PROVIDER_ERROR' as const;

  constructor(
    message: string,
    public readonly providerName: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 'PROVIDER_ERROR', { ...context, providerName }, cause);
  }
}

/**
 * Error thrown when tool execution fails.
 */
export class ToolExecutionError extends SDKError {
  code = 'TOOL_EXECUTION' as const;

  constructor(
    message: string,
    public readonly toolName: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message, 'TOOL_EXECUTION', { ...context, toolName }, cause);
  }
}

/**
 * Error thrown when agent configuration is invalid.
 */
export class AgentConfigError extends SDKError {
  code = 'AGENT_CONFIG' as const;

  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'AGENT_CONFIG', context);
  }
}

/**
 * Error thrown when a resource is not found.
 */
export class NotFoundError extends SDKError {
  code = 'NOT_FOUND' as const;

  constructor(
    message: string,
    resourceType: string,
    resourceId: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'NOT_FOUND', { ...context, resourceType, resourceId });
  }
}

/**
 * Type guard to check if an error is an SDKError.
 */
export function isSDKError(error: unknown): error is SDKError {
  return error instanceof SDKError;
}

/**
 * Type guard to check if an error is retryable.
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }
  
  if (error instanceof ProviderError) {
    // Provider errors from HTTP status codes
    const statusCode = error.context?.statusCode as number;
    if (statusCode) {
      return statusCode === 408 || // Request timeout
             statusCode === 429 || // Too many requests
             statusCode >= 500;   // Server errors
    }
  }
  
  // Network errors (no status code)
  if (error instanceof ProviderError && !error.context?.statusCode) {
    return true;
  }
  
  return false;
}
