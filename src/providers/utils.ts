/**
 * Shared utilities for provider implementations.
 * Eliminates code duplication across providers.
 */

import { Message, ToolSchema, ToolCall, Tool as ToolType } from "../types";

/**
 * Build messages array for API requests.
 * Handles different message types and tool calls.
 */
export function buildMessagesArray(messages: Message[]): unknown[] {
  return messages.map((msg) => {
    const obj: Record<string, unknown> = {
      role: msg.role,
      content: msg.content,
    };

    if (msg.role === 'assistant' && 'tool_calls' in msg && msg.tool_calls && msg.tool_calls.length > 0) {
      obj.tool_calls = msg.tool_calls.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.name,
          arguments: tc.arguments,
        },
      }));
    }

    if ('name' in msg && msg.name) {
      obj.name = msg.name;
    }

    if ('tool_call_id' in msg && msg.tool_call_id) {
      obj.tool_call_id = msg.tool_call_id;
    }

    return obj;
  });
}

/**
 * Build tools array for API requests.
 * Converts tool schemas to OpenAI-compatible format.
 */
export function buildToolsArray(tools: ToolSchema[]): unknown[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

/**
 * Parse tool calls from API response.
 * Converts API response to internal ToolCall format.
 */
export function parseToolCalls(data: unknown): ToolCall[] {
  const response = data as Record<string, unknown>;
  const choices = response.choices as Array<Record<string, unknown>>;
  const choice = choices[0];
  const message = choice.message as Record<string, unknown>;

  if (!message.tool_calls) {
    return [];
  }

  const tcArray = message.tool_calls as Array<Record<string, unknown>>;
  return tcArray.map((tc) => {
    const fn = tc.function as Record<string, unknown>;
    return {
      id: tc.id as string,
      name: fn.name as ToolType,
      arguments: fn.arguments as string,
    };
  });
}

/**
 * Determine if an HTTP status code is retryable.
 */
export function isRetryableStatusCode(statusCode: number): boolean {
  return statusCode === 408 || // Request timeout
         statusCode === 429 || // Too many requests
         statusCode >= 500;   // Server errors
}

/**
 * Extract HTTP status code from error if available.
 */
export function extractStatusCode(error: Error): number | undefined {
  const message = error.message;
  const match = message.match(/(\d{3})/);
  return match ? parseInt(match[1], 10) : undefined;
}
