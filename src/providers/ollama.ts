/**
 * Ollama provider implementation.
 * Uses raw HTTP calls to Ollama API.
 */

import { Provider } from "../types/provider";
import { Message, ToolSchema, ChatResponse, ToolCall } from "../types";

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

    const data = await response.json();
    
    const toolCalls: ToolCall[] = [];
    if (data.message?.tool_calls) {
      for (const call of data.message.tool_calls) {
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random()}`,
          name: call.function.name,
          arguments: JSON.stringify(call.function.arguments),
        });
      }
    }

    return {
      id: `chat_${Date.now()}`,
      content: data.message?.content || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.done ? "stop" : "length",
      usage: {
        prompt_tokens: data.prompt_eval_count,
        completion_tokens: data.eval_count,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      raw: data,
    };
  }
}
