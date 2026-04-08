/**
 * LLM Gateway provider implementation.
 * Uses raw HTTP calls to generic LLM Gateway API.
 */

import { Provider } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall } from "../types";

export interface LLMGatewayConfig {
  apiKey: string;
  baseUrl?: string;
}

export class LLMGatewayProvider implements Provider {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: LLMGatewayConfig, defaultModel: string = "llama-3.1-8b") {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.llmgateway.com/v1";
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
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
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
      throw new Error(`LLM Gateway API error: ${response.status} ${response.statusText}`);
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
