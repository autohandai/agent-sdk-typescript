/**
 * Abstract base for all LLM providers.
 * All providers call raw HTTP — no external SDK dependencies.
 */

import { Message, ToolSchema, ChatResponse } from "./index";
import { Logger } from "../utils/logger";

export interface ProviderOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number;
  /** Logger instance for debugging (default: NoOpLogger) */
  logger?: Logger;
  /** Maximum tokens in response (provider-specific) */
  maxTokens?: number;
  /** Sampling temperature (provider-specific) */
  temperature?: number;
}

export interface Provider {
  /**
   * Return the full model identifier for this provider.
   * E.g. OpenRouter prefixes like 'z-ai/glm-5.1'.
   */
  modelName(model: string): string;

  /**
   * Send messages and get a response.
   */
  chat(messages: Message[], model: string, tools?: ToolSchema[], options?: ProviderOptions): Promise<ChatResponse>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`Provider '${providerName}' is not configured`);
    this.name = "ProviderNotConfiguredError";
  }
}
