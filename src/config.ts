/**
 * Configuration for the Autohand Code Agent SDK.
 * Supports all providers from CLI: openrouter, ollama, openai, llamacpp, mlx, llmgateway, azure, zai
 */

/**
 * Base configuration for all providers.
 */
export interface BaseProviderConfig {
  /** API key for authentication */
  apiKey?: string;
  /** Custom base URL for the provider API */
  baseUrl?: string;
  /** Model name to use */
  model?: string;
}

/**
 * Configuration for OpenRouter provider.
 */
export interface OpenRouterConfig extends BaseProviderConfig {
  /** API key (required) */
  apiKey: string;
}

/**
 * Configuration for Ollama provider.
 */
export interface OllamaConfig extends BaseProviderConfig {
  /** Ollama base URL (default: http://localhost:11434) */
  baseUrl?: string;
  /** Ollama port number */
  port?: number;
}

/**
 * Configuration for OpenAI provider.
 */
export interface OpenAIConfig extends BaseProviderConfig {
  /** API key (required) */
  apiKey: string;
  /** OpenAI organization ID */
  organizationId?: string;
}

/**
 * Configuration for Azure OpenAI provider.
 */
export interface AzureConfig extends BaseProviderConfig {
  /** API key (required) */
  apiKey: string;
  /** Azure resource name (required) */
  resourceName: string;
  /** Azure deployment name (required) */
  deploymentName: string;
  /** Azure API version */
  apiVersion?: string;
}

/**
 * Configuration for Z-AI provider.
 */
export interface ZaiConfig extends BaseProviderConfig {
  /** API key (required) */
  apiKey: string;
}

/**
 * Configuration for LLM Gateway provider.
 */
export interface LLMGatewayConfig extends BaseProviderConfig {
  /** API key (required) */
  apiKey: string;
}

/**
 * Configuration for Llama.cpp provider.
 */
export interface LlamaCppConfig extends BaseProviderConfig {
  /** Llama.cpp base URL */
  baseUrl?: string;
  /** Llama.cpp port number */
  port?: number;
}

/**
 * Configuration for MLX provider.
 */
export interface MLXConfig extends BaseProviderConfig {
  /** MLX base URL */
  baseUrl?: string;
  /** Path to the model file */
  modelPath?: string;
}

/**
 * Complete configuration object for the SDK.
 */
export interface Config {
  /** Provider name to use */
  provider: 'openrouter' | 'ollama' | 'openai' | 'llamacpp' | 'mlx' | 'llmgateway' | 'azure' | 'zai';
  /** OpenRouter-specific configuration */
  openrouter?: OpenRouterConfig;
  /** Ollama-specific configuration */
  ollama?: OllamaConfig;
  /** OpenAI-specific configuration */
  openai?: OpenAIConfig;
  /** Azure-specific configuration */
  azure?: AzureConfig;
  /** Z-AI-specific configuration */
  zai?: ZaiConfig;
  /** LLM Gateway-specific configuration */
  llmgateway?: LLMGatewayConfig;
  /** Llama.cpp-specific configuration */
  llamacpp?: LlamaCppConfig;
  /** MLX-specific configuration */
  mlx?: MLXConfig;
  // Legacy support for backward compatibility
  /** Legacy: API key (use provider-specific config instead) */
  apiKey?: string;
  /** Legacy: Model name (use provider-specific config instead) */
  model?: string;
  /** Legacy: Base URL (use provider-specific config instead) */
  baseUrl?: string;
}

/**
 * Loads configuration from environment variables.
 * Supports all provider configurations from CLI.
 * 
 * Environment variables:
 * - AUTOHAND_PROVIDER: Provider name (default: "openrouter")
 * - AUTOHAND_API_KEY: API key for the provider
 * - AUTOHAND_MODEL: Model name
 * - AUTOHAND_BASE_URL: Custom base URL
 * - Provider-specific variables (e.g., AUTOHAND_OLLAMA_BASE_URL, AUTOHAND_AZURE_RESOURCE_NAME)
 * 
 * @returns Configuration object loaded from environment
 * 
 * @example
 * ```typescript
 * import { loadConfig } from "@autohandai/agent-sdk";
 * 
 * // Set environment variables first
 * process.env.AUTOHAND_PROVIDER = "openai";
 * process.env.AUTOHAND_API_KEY = "sk-...";
 * 
 * const config = loadConfig();
 * console.log(config.provider); // "openai"
 * ```
 */
export function loadConfig(): Config {
  return {
    provider: (process.env.AUTOHAND_PROVIDER as any) || "openrouter",
    openrouter: process.env.AUTOHAND_PROVIDER === "openrouter" ? {
      apiKey: process.env.AUTOHAND_API_KEY || "",
      model: process.env.AUTOHAND_MODEL || "z-ai/glm-5.1",
    } : undefined,
    ollama: process.env.AUTOHAND_PROVIDER === "ollama" ? {
      baseUrl: process.env.AUTOHAND_OLLAMA_BASE_URL,
      model: process.env.AUTOHAND_MODEL || "llama2",
    } : undefined,
    openai: process.env.AUTOHAND_PROVIDER === "openai" ? {
      apiKey: process.env.AUTOHAND_API_KEY || "",
      model: process.env.AUTOHAND_MODEL || "gpt-4",
    } : undefined,
    azure: process.env.AUTOHAND_PROVIDER === "azure" ? {
      apiKey: process.env.AUTOHAND_API_KEY || "",
      resourceName: process.env.AUTOHAND_AZURE_RESOURCE_NAME || "",
      deploymentName: process.env.AUTOHAND_AZURE_DEPLOYMENT_NAME || "",
      model: process.env.AUTOHAND_MODEL || "gpt-4",
    } : undefined,
    zai: process.env.AUTOHAND_PROVIDER === "zai" ? {
      apiKey: process.env.AUTOHAND_API_KEY || "",
      model: process.env.AUTOHAND_MODEL || "glm-5.1",
    } : undefined,
    llmgateway: process.env.AUTOHAND_PROVIDER === "llmgateway" ? {
      apiKey: process.env.AUTOHAND_API_KEY || "",
      model: process.env.AUTOHAND_MODEL || "llama-3.1-8b",
    } : undefined,
    llamacpp: process.env.AUTOHAND_PROVIDER === "llamacpp" ? {
      baseUrl: process.env.AUTOHAND_LLAMACPP_BASE_URL,
      model: process.env.AUTOHAND_MODEL || "llama-3-8b-instruct",
    } : undefined,
    mlx: process.env.AUTOHAND_PROVIDER === "mlx" ? {
      baseUrl: process.env.AUTOHAND_MLX_BASE_URL,
      model: process.env.AUTOHAND_MODEL || "mlx-lm",
    } : undefined,
    // Legacy support for backward compatibility
    apiKey: process.env.AUTOHAND_API_KEY,
    model: process.env.AUTOHAND_MODEL,
    baseUrl: process.env.AUTOHAND_BASE_URL,
  };
}

/**
 * Default configuration instance loaded from environment variables.
 * This is pre-loaded on module import.
 * 
 * @example
 * ```typescript
 * import { config } from "@autohandai/agent-sdk";
 * 
 * console.log(config.provider);
 * ```
 */
export const config = loadConfig();
