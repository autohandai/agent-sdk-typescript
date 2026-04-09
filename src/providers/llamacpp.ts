/**
 * Llama.cpp provider implementation.
 * Uses raw HTTP calls to Llama.cpp server API.
 * Supports timeout, retry, and logging.
 */

import { Provider, ProviderOptions } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall, Tool as ToolType } from "../types";
import { ProviderError, ValidationError } from "../errors";
import { withTimeout } from "../utils/timeout";
import { withRetry } from "../utils/retry";
import { defaultLogger } from "../utils/logger";
import { buildMessagesArray, buildToolsArray, parseToolCalls, isRetryableStatusCode } from "./utils";
import { OpenAIResponseSchema } from "./schemas";

export interface LlamaCppConfig {
  apiKey?: string;
  baseUrl?: string;
  port?: number;
}

export class LlamaCppProvider implements Provider {
  private baseUrl: string;
  private port: number;
  private apiKey?: string;
  private defaultModel: string;

  constructor(config: LlamaCppConfig, defaultModel: string = "llama-3-8b-instruct") {
    this.baseUrl = config.baseUrl || "http://localhost";
    this.port = config.port || 8080;
    this.apiKey = config.apiKey;
    this.defaultModel = defaultModel;
  }

  modelName(model: string): string {
    return model;
  }

  async chat(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    options?: ProviderOptions
  ): Promise<ChatResponse> {
    const logger = options?.logger || defaultLogger;
    const timeout = options?.timeout || 30000;
    const maxRetries = options?.maxRetries || 3;

    logger.debug('LlamaCpp chat request started', {
      model,
      toolsCount: tools?.length || 0,
      messagesCount: messages.length,
    });

    try {
      const response = await withRetry(
        () => withTimeout(
          (signal) => this.makeRequest(messages, model, tools, options, signal),
          { timeoutMs: timeout }
        ),
        {
          maxRetries,
          isRetryable: (error) => {
            if (error instanceof ProviderError) {
              const statusCode = error.context?.statusCode as number;
              return statusCode ? isRetryableStatusCode(statusCode) : true;
            }
            return false;
          },
          onRetry: (attempt, error, delayMs) => {
            logger.warn(`LlamaCpp retry attempt ${attempt}`, {
              error: error.message,
              delayMs,
            });
          },
        }
      );

      logger.debug('LlamaCpp chat request succeeded', {
        responseId: response.id,
        finishReason: response.finishReason,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('LlamaCpp chat request failed', error, {
          model,
          messagesCount: messages.length,
        });
      }
      throw error;
    }
  }

  private async makeRequest(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    options?: ProviderOptions,
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}:${this.port}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages: buildMessagesArray(messages),
        ...(tools && tools.length > 0 ? { tools: buildToolsArray(tools) } : {}),
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(options?.temperature ? { temperature: options.temperature } : {}),
        stream: false,
      }),
      signal,
    });

    if (!response.ok) {
      throw new ProviderError(
        `Llama.cpp API error: ${response.status} ${response.statusText}`,
        'llamacpp',
        { statusCode: response.status }
      );
    }

    const data = await response.json() as Record<string, unknown>;
    return this.parseResponse(data);
  }

  private parseResponse(data: unknown): ChatResponse {
    // Validate response structure using Zod
    const validationResult = OpenAIResponseSchema.passthrough().safeParse(data);
    
    if (!validationResult.success) {
      throw new ValidationError(
        `Invalid API response structure: ${validationResult.error.message}`,
        'response',
        data
      );
    }

    const response = validationResult.data;
    const choice = response.choices[0];
    const message = choice.message;

    const toolCalls = message.tool_calls ? parseToolCalls(data) : undefined;

    return {
      id: response.id,
      content: message.content || "",
      toolCalls,
      finishReason: choice.finish_reason,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
      raw: data,
    };
  }
}
