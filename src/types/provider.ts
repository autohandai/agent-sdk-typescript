/**
 * Abstract base for all LLM providers.
 * All providers call raw HTTP — no external SDK dependencies.
 */

import { Message, ToolSchema, ChatResponse } from "./index";

export interface Provider {
  /**
   * Return the full model identifier for this provider.
   * E.g. OpenRouter prefixes like 'z-ai/glm-5.1'.
   */
  modelName(model: string): string;

  /**
   * Send messages and get a response.
   */
  chat(messages: Message[], model: string, tools?: ToolSchema[]): Promise<ChatResponse>;

  /**
   * Send messages and get a response with additional options.
   */
  chat(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    maxTokens?: number,
    temperature?: number
  ): Promise<ChatResponse>;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`Provider '${providerName}' is not configured`);
    this.name = "ProviderNotConfiguredError";
  }
}
