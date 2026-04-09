/**
 * Factory for creating provider instances.
 * Supports all 7 providers from CLI: openrouter, ollama, openai, llamacpp, mlx, llmgateway, azure, zai
 */

import { Provider } from "../types/provider";
import { Config } from "../config";
import { OpenRouterProvider } from "./openrouter";
import { OllamaProvider } from "./ollama";
import { OpenAIProvider, type OpenAIConfig } from "./openai";
import { AzureProvider, type AzureConfig } from "./azure";
import { ZaiProvider, type ZaiConfig } from "./zai";
import { LLMGatewayProvider, type LLMGatewayConfig } from "./llmgateway";
import { LlamaCppProvider, type LlamaCppConfig } from "./llamacpp";
import { MLXProvider, type MLXConfig } from "./mlx";

/**
 * Error thrown when provider is not configured.
 */
export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`Provider '${providerName}' is not configured`);
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * Create a provider instance based on configuration.
 */
export function createProvider(config: Config): Provider {
  switch (config.provider) {
    case 'openrouter':
      if (!config.openrouter?.apiKey) {
        throw new ProviderNotConfiguredError('openrouter');
      }
      return new OpenRouterProvider(
        config.openrouter.apiKey,
        config.openrouter.model || "z-ai/glm-5.1",
        config.openrouter.baseUrl || "https://openrouter.ai/api/v1"
      );

    case 'ollama':
      if (!config.ollama) {
        throw new ProviderNotConfiguredError('ollama');
      }
      return new OllamaProvider(
        config.ollama.baseUrl || "http://localhost:11434",
        config.ollama.model || "llama2"
      );

    case 'openai':
      if (!config.openai?.apiKey) {
        throw new ProviderNotConfiguredError('openai');
      }
      return new OpenAIProvider(config.openai);

    case 'azure':
      if (!config.azure?.apiKey || !config.azure?.resourceName || !config.azure?.deploymentName) {
        throw new ProviderNotConfiguredError('azure');
      }
      return new AzureProvider(config.azure);

    case 'zai':
      if (!config.zai?.apiKey) {
        throw new ProviderNotConfiguredError('zai');
      }
      return new ZaiProvider(config.zai);

    case 'llmgateway':
      if (!config.llmgateway?.apiKey) {
        throw new ProviderNotConfiguredError('llmgateway');
      }
      return new LLMGatewayProvider(config.llmgateway);

    case 'llamacpp':
      if (!config.llamacpp) {
        throw new ProviderNotConfiguredError('llamacpp');
      }
      return new LlamaCppProvider(config.llamacpp, "llama-3-8b-instruct");

    case 'mlx':
      if (!config.mlx) {
        throw new ProviderNotConfiguredError('mlx');
      }
      return new MLXProvider(config.mlx);

    default:
      throw new ProviderNotConfiguredError(config.provider);
  }
}

/**
 * Create a provider by name with default configuration.
 */
export function createProviderByName(providerName: string, apiKey: string): Provider {
  switch (providerName) {
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    case 'ollama':
      return new OllamaProvider();
    case 'openai':
      return new OpenAIProvider({ apiKey });
    case 'azure':
      throw new ProviderNotConfiguredError('azure requires additional configuration');
    case 'zai':
      return new ZaiProvider({ apiKey });
    case 'llmgateway':
      return new LLMGatewayProvider({ apiKey });
    case 'llamacpp':
      throw new ProviderNotConfiguredError('llamacpp requires additional configuration');
    case 'mlx':
      return new MLXProvider({});
    default:
      throw new ProviderNotConfiguredError(providerName);
  }
}
