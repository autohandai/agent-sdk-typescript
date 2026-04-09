/**
 * Unit tests for OpenRouterProvider
 */

import { OpenRouterProvider } from "../../providers/openrouter";
import { ProviderNotConfiguredError } from "../../types/provider";
import { createProviderByName } from "../../providers/factory";

describe("OpenRouterProvider", () => {
  test("can be created", () => {
    const provider = new OpenRouterProvider("test-api-key", "test-model");
    expect(provider).toBeDefined();
  });

  test("modelName adds prefix for models without slash", () => {
    const provider = new OpenRouterProvider("test-key", "test-model");
    expect(provider.modelName("gpt-4")).toBe("z-ai/gpt-4");
  });

  test("modelName preserves models with slash", () => {
    const provider = new OpenRouterProvider("test-key", "test-model");
    expect(provider.modelName("openai/gpt-4")).toBe("openai/gpt-4");
  });

  test("modelName preserves models with prefix", () => {
    const provider = new OpenRouterProvider("test-key", "test-model");
    expect(provider.modelName("google/gemini-pro")).toBe("google/gemini-pro");
  });
});

describe("ProviderFactory", () => {
  test("creates OpenRouter provider", () => {
    const provider = createProviderByName("openrouter", "test-key");
    expect(provider).toBeInstanceOf(OpenRouterProvider);
  });

  test("throws error for unsupported provider", () => {
    expect(() => createProviderByName("unsupported", "test-key")).toThrow(
      "Provider 'unsupported' is not configured"
    );
  });
});
