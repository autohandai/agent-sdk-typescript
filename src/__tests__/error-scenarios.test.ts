/**
 * Comprehensive error scenario tests.
 * Tests various error conditions and edge cases.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { TimeoutError, RetryExhaustedError, ValidationError, ProviderError } from "../errors";
import { withTimeout } from "../utils/timeout";
import { withRetry } from "../utils/retry";
import { isRetryableError } from "../errors";

describe("Error Scenarios", () => {
  describe("TimeoutError", () => {
    it("should create TimeoutError with correct properties", () => {
      const error = new TimeoutError("Operation timed out", 5000, { operation: "test" });
      
      expect(error.message).toBe("Operation timed out");
      expect(error.code).toBe("TIMEOUT");
      expect(error.context).toEqual({ operation: "test", timeoutMs: 5000 });
    });

    it("should provide detailed error information", () => {
      const error = new TimeoutError("Request failed", 10000);
      const details = error.getDetails();
      
      expect(details).toContain("Request failed");
      expect(details).toContain("timeoutMs: 10000");
    });
  });

  describe("RetryExhaustedError", () => {
    it("should create RetryExhaustedError with attempt count", () => {
      const lastError = new Error("Network failure");
      const error = new RetryExhaustedError("Retries exhausted", 3, lastError, { url: "test.com" });
      
      expect(error.message).toBe("Retries exhausted");
      expect(error.code).toBe("RETRY_EXHAUSTED");
      expect(error.context).toEqual({ url: "test.com", attempts: 3 });
      expect(error.cause).toBe(lastError);
    });
  });

  describe("ValidationError", () => {
    it("should create ValidationError with field and value", () => {
      const error = new ValidationError("Invalid field", "email", "not-an-email", { schema: "User" });
      
      expect(error.message).toBe("Invalid field");
      expect(error.code).toBe("VALIDATION");
      expect(error.context).toEqual({ field: "email", value: "not-an-email", schema: "User" });
    });
  });

  describe("ProviderError", () => {
    it("should create ProviderError with provider name", () => {
      const cause = new Error("API error");
      const error = new ProviderError("Provider failed", "openai", { statusCode: 500 }, cause);
      
      expect(error.message).toBe("Provider failed");
      expect(error.code).toBe("PROVIDER_ERROR");
      expect(error.providerName).toBe("openai");
      expect(error.context).toEqual({ providerName: "openai", statusCode: 500 });
      expect(error.cause).toBe(cause);
    });
  });

  describe("isRetryableError", () => {
    it("should identify TimeoutError as retryable", () => {
      const error = new TimeoutError("Timeout", 5000);
      expect(isRetryableError(error)).toBe(true);
    });

    it("should identify ProviderError with retryable status codes", () => {
      const timeoutError = new ProviderError("Timeout", "openai", { statusCode: 408 });
      expect(isRetryableError(timeoutError)).toBe(true);

      const rateLimitError = new ProviderError("Rate limited", "openai", { statusCode: 429 });
      expect(isRetryableError(rateLimitError)).toBe(true);

      const serverError = new ProviderError("Server error", "openai", { statusCode: 500 });
      expect(isRetryableError(serverError)).toBe(true);
    });

    it("should not identify ProviderError with non-retryable status codes", () => {
      const badRequest = new ProviderError("Bad request", "openai", { statusCode: 400 });
      expect(isRetryableError(badRequest)).toBe(false);

      const unauthorized = new ProviderError("Unauthorized", "openai", { statusCode: 401 });
      expect(isRetryableError(unauthorized)).toBe(false);

      const forbidden = new ProviderError("Forbidden", "openai", { statusCode: 403 });
      expect(isRetryableError(forbidden)).toBe(false);

      const notFound = new ProviderError("Not found", "openai", { statusCode: 404 });
      expect(isRetryableError(notFound)).toBe(false);
    });

    it("should identify ProviderError without status code as retryable", () => {
      const networkError = new ProviderError("Network error", "openai");
      expect(isRetryableError(networkError)).toBe(true);
    });

    it("should not identify generic errors as retryable", () => {
      const genericError = new Error("Generic error");
      expect(isRetryableError(genericError)).toBe(false);
    });
  });

  describe("Timeout scenarios", () => {
    it("should timeout long-running operations", async () => {
      const slowOperation = async () => {
        return new Promise(resolve => setTimeout(resolve, 10000));
      };

      await expect(
        withTimeout(slowOperation, { timeoutMs: 100 })
      ).rejects.toThrow(TimeoutError);
    });

    it("should complete operations within timeout", async () => {
      const fastOperation = async () => {
        return "success";
      };

      const result = await withTimeout(fastOperation, { timeoutMs: 1000 });
      expect(result).toBe("success");
    });
  });

  describe("Retry scenarios", () => {
    it("should retry retryable errors", async () => {
      let attempts = 0;
      const flakyOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Temporary failure");
        }
        return "success";
      };

      const result = await withRetry(flakyOperation, {
        maxRetries: 3,
        isRetryable: () => true,
      });

      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should not retry non-retryable errors", async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error("Permanent failure");
      };

      await expect(
        withRetry(operation, {
          maxRetries: 3,
          isRetryable: () => false,
        })
      ).rejects.toThrow("Permanent failure");

      expect(attempts).toBe(1);
    });

    it("should exhaust retries after max attempts", async () => {
      const failingOperation = async () => {
        throw new Error("Always fails");
      };

      await expect(
        withRetry(failingOperation, {
          maxRetries: 2,
          isRetryable: () => true,
        })
      ).rejects.toThrow(RetryExhaustedError);
    });

    it("should use exponential backoff", async () => {
      const delays: number[] = [];
      const startTime = Date.now();

      const operation = async () => {
        delays.push(Date.now() - startTime);
        throw new Error("Retry");
      };

      await expect(
        withRetry(operation, {
          maxRetries: 2,
          initialBackoffMs: 50,
          maxBackoffMs: 1000,
          isRetryable: () => true,
        })
      ).rejects.toThrow(RetryExhaustedError);

      // Verify delays increase (exponential backoff)
      expect(delays[1] > delays[0]).toBe(true);
    });
  });

  describe("Validation scenarios", () => {
    it("should handle missing required fields", () => {
      const error = new ValidationError("Missing required field", "email", undefined);
      expect(error.context?.field).toBe("email");
    });

    it("should handle type mismatches", () => {
      const error = new ValidationError("Type mismatch", "age", "not-a-number");
      expect(error.context?.value).toBe("not-a-number");
    });

    it("should handle range violations", () => {
      const error = new ValidationError("Value out of range", "age", 150);
      expect(error.context?.value).toBe(150);
    });
  });

  describe("Provider error scenarios", () => {
    it("should handle network failures", () => {
      const error = new ProviderError("Network unreachable", "openai");
      expect(isRetryableError(error)).toBe(true);
    });

    it("should handle authentication failures", () => {
      const error = new ProviderError("Invalid API key", "openai", { statusCode: 401 });
      expect(isRetryableError(error)).toBe(false);
    });

    it("should handle rate limiting", () => {
      const error = new ProviderError("Rate limit exceeded", "openai", { statusCode: 429 });
      expect(isRetryableError(error)).toBe(true);
    });

    it("should handle server errors", () => {
      const error = new ProviderError("Internal server error", "openai", { statusCode: 500 });
      expect(isRetryableError(error)).toBe(true);
    });

    it("should handle malformed responses", () => {
      const error = new ValidationError("Invalid response format", "response", {});
      expect(error.code).toBe("VALIDATION");
    });
  });

  describe("Error propagation", () => {
    it("should preserve error causes", () => {
      const cause = new Error("Root cause");
      const error = new ProviderError("Wrapper error", "openai", {}, cause);
      expect(error.cause).toBe(cause);
    });

    it("should provide detailed error context", () => {
      const error = new TimeoutError("Operation failed", 5000, { operation: "test", userId: "123" });
      expect(error.context).toEqual({ operation: "test", userId: "123", timeoutMs: 5000 });
    });
  });

  describe("Error recovery", () => {
    it("should recover from transient failures", async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("Transient error");
        }
        return "recovered";
      };

      const result = await withRetry(operation, {
        maxRetries: 2,
        isRetryable: () => true,
      });

      expect(result).toBe("recovered");
    });

    it("should fail permanently on non-recoverable errors", async () => {
      const operation = async () => {
        throw new Error("Permanent error");
      };

      await expect(
        withRetry(operation, {
          maxRetries: 2,
          isRetryable: () => false,
        })
      ).rejects.toThrow("Permanent error");
    });
  });
});
