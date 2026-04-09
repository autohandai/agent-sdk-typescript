/**
 * Timeout handler for async operations using AbortController.
 * Provides configurable timeout handling with custom error creation.
 */

import { TimeoutError } from "../errors";

export interface TimeoutOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Custom error to throw on timeout (optional) */
  onTimeout?: (timeoutMs: number) => Error;
}

/**
 * Execute an async operation with a timeout.
 * @param fn - The async function to execute
 * @param options - Timeout configuration
 * @returns The result of the function
 * @throws TimeoutError if the operation times out
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeoutMs = 30000, onTimeout } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await fn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw onTimeout 
        ? onTimeout(timeoutMs) 
        : new TimeoutError(
            `Operation timed out after ${timeoutMs}ms`,
            timeoutMs
          );
    }

    throw error;
  }
}
