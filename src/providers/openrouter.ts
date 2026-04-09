/**
 * OpenRouter provider using raw HTTP, no external SDK.
 * Supports timeout, retry, and logging.
 */

import { Provider, ProviderOptions } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall, Tool as ToolType } from "../types";
import { ProviderError, ValidationError } from "../errors";
import { withTimeout } from "../utils/timeout";
import { withRetry } from "../utils/retry";
import { defaultLogger } from "../utils/logger";
import { buildMessagesArray, buildToolsArray, parseToolCalls, isRetryableStatusCode, extractStatusCode } from "./utils";
import { OpenAIResponseSchema } from "./schemas";

export class OpenRouterProvider implements Provider {
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    defaultModel = "z-ai/glm-5.1",
    baseUrl = "https://openrouter.ai/api/v1"
  ) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseUrl = baseUrl;
  }

  modelName(model: string): string {
    if (model.includes("/")) {
      return model;
    }
    return `z-ai/${model}`;
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

    logger.debug('OpenRouter chat request started', {
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
            logger.warn(`OpenRouter retry attempt ${attempt}`, {
              error: error.message,
              delayMs,
            });
          },
        }
      );

      logger.debug('OpenRouter chat request succeeded', {
        responseId: response.id,
        finishReason: response.finishReason,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('OpenRouter chat request failed', error, {
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
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://autohand.dev",
        "X-Title": "Autohand Code Agents",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName(model || this.defaultModel),
        messages: buildMessagesArray(messages),
        ...(tools && tools.length > 0 ? { tools: buildToolsArray(tools), tool_choice: "auto" } : {}),
        ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(options?.temperature ? { temperature: options.temperature } : {}),
      }),
      signal,
    });

    if (!response.ok) {
      throw new ProviderError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        'openrouter',
        { statusCode: response.status }
      );
    }

    const data = await response.json();
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

    const content = message.content || "";
    const finishReason = choice.finish_reason;

    const toolCalls = message.tool_calls ? parseToolCalls(data) : undefined;

    return {
      id: response.id,
      content,
      toolCalls,
      finishReason,
      raw: data,
    };
  }
}
