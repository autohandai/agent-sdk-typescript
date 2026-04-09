/**
 * Azure OpenAI provider implementation.
 * Uses raw HTTP calls to Azure OpenAI API.
 */

import { Provider } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall, Tool as ToolType } from "../types";

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
    maxTokens?: number,
    temperature?: number
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions?api-version=${this.apiVersion}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          tool_calls: (msg.role === 'assistant' && 'tool_calls' in msg && msg.tool_calls) ? msg.tool_calls.map(call => ({
            id: call.id,
            type: "function",
            function: {
              name: call.name,
              arguments: call.arguments,
            },
          })) : undefined,
        })),
        tools: tools?.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Record<string, unknown>;
    
    const toolCalls: ToolCall[] = [];
    const choices = data.choices as Array<Record<string, unknown>> | undefined;
    const firstChoice = choices?.[0] as Record<string, unknown> | undefined;
    const message = firstChoice?.message as Record<string, unknown> | undefined;
    
    if (message?.tool_calls) {
      const calls = message.tool_calls as Array<Record<string, unknown>>;
      for (const call of calls) {
        const fn = call.function as Record<string, unknown>;
        toolCalls.push({
          id: call.id as string,
          name: fn.name as ToolType,
          arguments: JSON.stringify(fn.arguments),
        });
      }
    }

    const usage = data.usage as Record<string, unknown> | undefined;

    return {
      id: (message?.id as string) || `chat_${Date.now()}`,
      content: (message?.content as string) || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: firstChoice?.finish_reason as string | undefined,
      usage: usage ? {
        prompt_tokens: usage.prompt_tokens as number,
        completion_tokens: usage.completion_tokens as number,
        total_tokens: usage.total_tokens as number,
      } : undefined,
      raw: data,
    };
  }
}
