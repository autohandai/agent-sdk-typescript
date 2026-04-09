/**
 * Retry middleware with exponential backoff for transient failures.
 * Provides configurable retry logic for network operations.
 */

import { RetryExhaustedError, isRetryableError } from "../errors";

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds (default: 100) */
  initialBackoffMs?: number;
  /** Maximum backoff delay in milliseconds (default: 10000) */
  maxBackoffMs?: number;
  /** Function to determine if an error is retryable (default: built-in logic) */
  isRetryable?: (error: Error) => boolean;
  /** Callback called before each retry attempt */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Calculate exponential backoff delay with jitter.
 * @param attempt - Current attempt number (1-indexed)
 * @param initialBackoffMs - Initial backoff in milliseconds
 * @param maxBackoffMs - Maximum backoff in milliseconds
 * @returns Backoff delay in milliseconds
 */
function calculateBackoff(
  attempt: number,
  initialBackoffMs: number,
  maxBackoffMs: number
): number {
  // Exponential backoff: 2^(attempt-1) * initialBackoff
  const exponentialDelay = initialBackoffMs * Math.pow(2, attempt - 1);
  
  // Add jitter to avoid thundering herd problem
  const jitter = Math.random() * 0.1 * exponentialDelay;
  
  // Cap at maxBackoff
  return Math.min(exponentialDelay + jitter, maxBackoffMs);
}

/**
 * Sleep for a specified duration.
 * @param ms - Duration to sleep in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async function with retry logic.
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws RetryExhaustedError if all retry attempts fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialBackoffMs = 100,
    maxBackoffMs = 10000,
    isRetryable: customIsRetryable,
    onRetry,
  } = options;

  const isRetryable = customIsRetryable || isRetryableError;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Don't retry on last attempt
      if (attempt > maxRetries || !isRetryable(err)) {
        if (attempt > 1) {
          throw new RetryExhaustedError(
            `All ${maxRetries} retry attempts exhausted`,
            maxRetries,
            err
          );
        }
        throw err;
      }

      const delayMs = calculateBackoff(attempt, initialBackoffMs, maxBackoffMs);

      if (onRetry) {
        onRetry(attempt, err, delayMs);
      }

      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new RetryExhaustedError(
    `All ${maxRetries} retry attempts exhausted`,
    maxRetries,
    lastError || new Error('Unknown error')
  );
}
