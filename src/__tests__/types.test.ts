/**
 * Unit tests for core types
 */

import { ToolCall, Message, ToolResult } from "../types";

describe("ToolCall", () => {
  test("can be created", () => {
    const tc: ToolCall = {
      id: "call_123",
      name: "read_file",
      arguments: '{"file_path":"test.txt"}',
    };
    expect(tc.id).toBe("call_123");
    expect(tc.name).toBe("read_file");
  });
});

describe("Message", () => {
  test("can be created with minimal fields", () => {
    const msg: Message = {
      role: "user",
      content: "Hello",
    };
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hello");
  });

  test("can be created with all fields", () => {
    const tc: ToolCall = {
      id: "call_1",
      name: "read_file",
      arguments: "{}",
    };
    const msg: Message = {
      role: "assistant",
      content: "Response",
      tool_calls: [tc],
    };
    expect("tool_calls" in msg && msg.tool_calls).toHaveLength(1);
    expect("tool_calls" in msg && msg.tool_calls![0].id).toBe("call_1");
  });
});

describe("ToolResult", () => {
  test("can represent success", () => {
    const result: ToolResult = {
      data: "File content",
    };
    expect(result.data).toBe("File content");
    expect(result.error).toBeUndefined();
  });

  test("can represent error", () => {
    const result: ToolResult = {
      error: "File not found",
    };
    expect(result.error).toBe("File not found");
    expect(result.data).toBeUndefined();
  });
});
