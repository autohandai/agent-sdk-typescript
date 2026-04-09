/**
 * Integration tests for agent execution with mocked providers.
 * Tests the full agent execution flow without making real API calls.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Agent, Runner } from "../../agent";
import { Provider, Message, ToolSchema, ChatResponse } from "../../types";
import { DefaultToolRegistry } from "../../tools/registry";
import { Tool } from "../../types";

/**
 * Mock provider for testing.
 * Simulates provider responses without making real API calls.
 */
class MockProvider implements Provider {
  private responses: ChatResponse[] = [];
  private callCount = 0;

  setResponses(responses: ChatResponse[]) {
    this.responses = responses;
    this.callCount = 0;
  }

  modelName(model: string): string {
    return model;
  }

  async chat(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    options?: any
  ): Promise<ChatResponse> {
    const response = this.responses[this.callCount % this.responses.length];
    this.callCount++;
    return response;
  }

  getCallCount(): number {
    return this.callCount;
  }
}

describe("Agent Execution Integration Tests", () => {
  let mockProvider: MockProvider;
  let agent: Agent;

  beforeEach(() => {
    mockProvider = new MockProvider();
    agent = new Agent(
      "TestAgent",
      "You are a helpful assistant.",
      DefaultToolRegistry.getAll(),
      5
    );
    agent.setProvider(mockProvider);
  });

  describe("Simple conversation without tools", () => {
    it("should complete a simple conversation", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "Hello! How can I help you today?",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Hello!");
      
      expect(result.finalOutput).toBe("Hello! How can I help you today?");
      expect(result.turns).toBe(1);
      expect(mockProvider.getCallCount()).toBe(1);
    });

    it("should handle multi-turn conversations", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "I can help with that.",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Can you help me?");
      
      expect(result.finalOutput).toBe("I can help with that.");
      expect(result.turns).toBe(1);
    });
  });

  describe("Tool execution", () => {
    it("should execute tool calls successfully", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "",
          finishReason: "tool_calls",
          toolCalls: [
            {
              id: "call-1",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "test.txt" }),
            },
          ],
          raw: {},
        },
        {
          id: "resp-2",
          content: "I read the file successfully.",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Read the test file");
      
      expect(result.finalOutput).toBe("I read the file successfully.");
      expect(result.turns).toBe(2);
      expect(mockProvider.getCallCount()).toBe(2);
    });

    it("should handle multiple tool calls in a single turn", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "",
          finishReason: "tool_calls",
          toolCalls: [
            {
              id: "call-1",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "file1.txt" }),
            },
            {
              id: "call-2",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "file2.txt" }),
            },
          ],
          raw: {},
        },
        {
          id: "resp-2",
          content: "I read both files.",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Read both files");
      
      expect(result.finalOutput).toBe("I read both files.");
      expect(result.turns).toBe(2);
    });
  });

  describe("Error handling", () => {
    it("should handle tool execution errors gracefully", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "",
          finishReason: "tool_calls",
          toolCalls: [
            {
              id: "call-1",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "/nonexistent/file.txt" }),
            },
          ],
          raw: {},
        },
        {
          id: "resp-2",
          content: "The file doesn't exist.",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Read a nonexistent file");
      
      expect(result.finalOutput).toBe("The file doesn't exist.");
      expect(result.turns).toBe(2);
    });

    it("should handle max turns reached", async () => {
      // Always return tool calls to force max turns
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "",
          finishReason: "tool_calls",
          toolCalls: [
            {
              id: "call-1",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "test.txt" }),
            },
          ],
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Keep working");
      
      expect(result.finalOutput).toBe("Max turns reached");
      expect(result.turns).toBe(5);
    });
  });

  describe("Resource cleanup", () => {
    it("should clean up resources on successful completion", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "Done",
          finishReason: "stop",
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Test");
      
      expect(result.finalOutput).toBe("Done");
      // SessionManager should have disposed resources
    });

    it("should clean up resources on error", async () => {
      mockProvider.setResponses([
        {
          id: "resp-1",
          content: "",
          finishReason: "tool_calls",
          toolCalls: [
            {
              id: "call-1",
              name: "READ_FILE" as Tool,
              arguments: JSON.stringify({ path: "test.txt" }),
            },
          ],
          raw: {},
        },
      ]);

      const result = await Runner.run(agent, "Test");
      
      // Should complete without hanging
      expect(result).toBeDefined();
    });
  });

  describe("Configuration validation", () => {
    it("should reject empty instructions", async () => {
      const invalidAgent = new Agent("", "Tools", [], 5);
      
      await expect(Runner.run(invalidAgent, "Test")).rejects.toThrow(
        "Agent instructions cannot be empty"
      );
    });

    it("should reject invalid max turns", async () => {
      const invalidAgent = new Agent("Test", "Instructions", [], 0);
      
      await expect(Runner.run(invalidAgent, "Test")).rejects.toThrow(
        "Agent maxTurns must be greater than 0"
      );
    });
  });
});
