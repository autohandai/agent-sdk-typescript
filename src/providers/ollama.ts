/**
 * Ollama provider implementation.
 * Uses raw HTTP calls to Ollama API.
 */

import { Provider } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall, Tool as ToolType } from "../types";

export class OllamaProvider implements Provider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = "http://localhost:11434", model: string = "llama2") {
    this.baseUrl = baseUrl;
    this.model = model;
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
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        tools: tools?.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Record<string, unknown>;
    
    const toolCalls: ToolCall[] = [];
    const message = data.message as Record<string, unknown> | undefined;
    if (message?.tool_calls) {
      const calls = message.tool_calls as Array<Record<string, unknown>>;
      for (const call of calls) {
        const fn = call.function as Record<string, unknown>;
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random()}`,
          name: fn.name as ToolType,
          arguments: JSON.stringify(fn.arguments),
        });
      }
    }

    return {
      id: `chat_${Date.now()}`,
      content: (message?.content as string) || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.done ? "stop" : "length",
      usage: {
        prompt_tokens: data.prompt_eval_count as number,
        completion_tokens: data.eval_count as number,
        total_tokens: ((data.prompt_eval_count as number) || 0) + ((data.eval_count as number) || 0),
      },
      raw: data,
    };
  }
}
