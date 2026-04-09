/**
 * Integration tests for error handling scenarios.
 * Tests timeout, retry, and error propagation.
 */

import { describe, it, expect } from "@jest/globals";
import { RetryExhaustedError } from "../errors";
import { withRetry } from "../utils/retry";

describe("Error Handling", () => {
  describe("Retry", () => {
    it("should retry on retryable errors", async () => {
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

    it("should throw RetryExhaustedError after max retries", async () => {
      const failingOperation = async () => {
        throw new Error("Persistent failure");
      };

      await expect(
        withRetry(failingOperation, {
          maxRetries: 2,
          isRetryable: () => true,
        })
      ).rejects.toThrow(RetryExhaustedError);
    });

    it("should not retry non-retryable errors", async () => {
      let attempts = 0;

      const operation = async () => {
        attempts++;
        throw new Error("Non-retryable error");
      };

      await expect(
        withRetry(operation, {
          maxRetries: 3,
          isRetryable: () => false,
        })
      ).rejects.toThrow("Non-retryable error");

      expect(attempts).toBe(1);
    });

    it("should use exponential backoff between retries", async () => {
      const retryTimes: number[] = [];
      let startTime = Date.now();

      const operation = async () => {
        retryTimes.push(Date.now() - startTime);
        startTime = Date.now();
        throw new Error("Retry");
      };

      await expect(
        withRetry(operation, {
          maxRetries: 2,
          isRetryable: () => true,
        })
      ).rejects.toThrow(RetryExhaustedError);

      // Verify delays increase (exponential backoff)
      expect(retryTimes[1] > retryTimes[0]).toBe(true);
    });
  });
});
