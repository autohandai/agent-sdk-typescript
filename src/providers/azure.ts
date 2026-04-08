/**
 * Azure OpenAI provider implementation.
 * Uses raw HTTP calls to Azure OpenAI API.
 */

import { Provider } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall } from "../types";

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
          tool_calls: msg.tool_calls ? msg.tool_calls.map(call => ({
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

    const data = await response.json();
    
    const toolCalls: ToolCall[] = [];
    if (data.choices?.[0]?.message?.tool_calls) {
      for (const call of data.choices[0].message.tool_calls) {
        toolCalls.push({
          id: call.id,
          name: call.function.name,
          arguments: JSON.stringify(call.function.arguments),
        });
      }
    }

    return {
      id: data.choices?.[0]?.message?.id || `chat_${Date.now()}`,
      content: data.choices?.[0]?.message?.content || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      raw: data,
    };
  }
}
