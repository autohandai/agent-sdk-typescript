/**
 * Azure OpenAI provider implementation.
 * Uses raw HTTP calls to Azure OpenAI API.
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

export interface AzureConfig {
  apiKey: string;
  resourceName: string;
  deploymentName: string;
  apiVersion?: string;
  baseUrl?: string;
}

export class AzureProvider implements Provider {
  private apiKey: string;
  private resourceName: string;
  private deploymentName: string;
  private apiVersion: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: AzureConfig, defaultModel: string = "gpt-4") {
    this.apiKey = config.apiKey;
    this.resourceName = config.resourceName;
    this.deploymentName = config.deploymentName;
    this.apiVersion = config.apiVersion || "2024-10-21";
    this.baseUrl = config.baseUrl || `https://${config.resourceName}.openai.azure.com/openai/deployments/${config.deploymentName}`;
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

    logger.debug('Azure chat request started', {
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
            logger.warn(`Azure retry attempt ${attempt}`, {
              error: error.message,
              delayMs,
            });
          },
        }
      );

      logger.debug('Azure chat request succeeded', {
        responseId: response.id,
        finishReason: response.finishReason,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Azure chat request failed', error, {
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
    const response = await fetch(`${this.baseUrl}/chat/completions?api-version=${this.apiVersion}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
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
        `Azure OpenAI API error: ${response.status} ${response.statusText}`,
        'azure',
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
