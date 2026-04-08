/**
 * Configuration for the Autohand Code Agent SDK.
 * Supports all providers from CLI: openrouter, ollama, openai, llamacpp, mlx, llmgateway, azure, zai
 */

export interface BaseProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface OpenRouterConfig extends BaseProviderConfig {
  apiKey: string;
}

export interface OllamaConfig extends BaseProviderConfig {
  baseUrl?: string;
  port?: number;
}

export interface OpenAIConfig extends BaseProviderConfig {
  apiKey: string;
  organizationId?: string;
}

export interface AzureConfig extends BaseProviderConfig {
  apiKey: string;
  resourceName: string;
  deploymentName: string;
  apiVersion?: string;
}

export interface ZaiConfig extends BaseProviderConfig {
  apiKey: string;
}

export interface LLMGatewayConfig extends BaseProviderConfig {
  apiKey: string;
}

export interface LlamaCppConfig extends BaseProviderConfig {
  baseUrl?: string;
  port?: number;
}

export interface MLXConfig extends BaseProviderConfig {
  baseUrl?: string;
  modelPath?: string;
}

export interface Config {
  provider: 'openrouter' | 'ollama' | 'openai' | 'llamacpp' | 'mlx' | 'llmgateway' | 'azure' | 'zai';
  openrouter?: OpenRouterConfig;
  ollama?: OllamaConfig;
  openai?: OpenAIConfig;
  azure?: AzureConfig;
  zai?: ZaiConfig;
  llmgateway?: LLMGatewayConfig;
  llamacpp?: LlamaCppConfig;
  mlx?: MLXConfig;
  // Legacy support
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Load configuration from environment variables.
 * Supports all provider configurations from CLI.
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
 * Default configuration instance.
 */
export const config = loadConfig();
