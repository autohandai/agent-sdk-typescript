/**
 * OpenRouter provider using raw HTTP, no external SDK.
 */

import { Provider, Message, ToolSchema, ChatResponse, ToolCall } from "../types";
import { config as defaultConfig } from "../config";

export class OpenRouterProvider implements Provider {
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    defaultModel = "your-modelcard-id-here",
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
    return `anthropic/${model}`;
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
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://autohand.dev",
        "X-Title": "Autohand Code Agents",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.modelName(model || this.defaultModel),
        messages: this.buildMessagesArray(messages),
        ...(tools && tools.length > 0 ? { tools: this.buildToolsArray(tools), tool_choice: "auto" } : {}),
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
        ...(temperature ? { temperature } : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  private buildMessagesArray(messages: Message[]): unknown[] {
    return messages.map((msg) => {
      const obj: Record<string, unknown> = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        obj.tool_calls = msg.tool_calls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        }));
      }

      if (msg.name) {
        obj.name = msg.name;
      }

      if (msg.tool_call_id) {
        obj.tool_call_id = msg.tool_call_id;
      }

      return obj;
    });
  }

  private buildToolsArray(tools: ToolSchema[]): unknown[] {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private parseResponse(data: unknown): ChatResponse {
    const response = data as Record<string, unknown>;
    const id = response.id as string;
    const choices = response.choices as Array<Record<string, unknown>>;
    const choice = choices[0];
    const message = choice.message as Record<string, unknown>;

    const content = (message.content as string) || "";
    const finishReason = choice.finish_reason as string | undefined;

    let toolCalls: ToolCall[] | undefined;
    if (message.tool_calls) {
      const tcArray = message.tool_calls as Array<Record<string, unknown>>;
      toolCalls = tcArray.map((tc) => {
        const function_ = tc.function as Record<string, unknown>;
        return {
          id: tc.id as string,
          name: function_.name as string,
          arguments: function_.arguments as string,
        };
      });
    }

    return {
      id,
      content,
      toolCalls,
      finishReason,
      raw: data,
    };
  }
}
