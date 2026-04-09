/**
 * Edge case and concurrent operation tests.
 * Tests boundary conditions, concurrent executions, and unusual scenarios.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Agent, Runner } from "../agent";
import { Provider, Message, ToolSchema, ChatResponse } from "../types";
import { DefaultToolRegistry } from "../tools/registry";
import { SessionManager } from "../utils/session";
import { CompositeDisposable } from "../utils/disposable";
import { Tool } from "../types";

/**
 * Mock provider for testing edge cases.
 */
class EdgeCaseProvider implements Provider {
  private delay: number = 0;
  private shouldFail: boolean = false;
  private callCount = 0;

  setDelay(ms: number) {
    this.delay = ms;
  }

  setShouldFail(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  reset() {
    this.callCount = 0;
  }

  getCallCount(): number {
    return this.callCount;
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
    this.callCount++;
    
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error("Simulated failure");
    }

    return {
      id: `resp-${this.callCount}`,
      content: "Response",
      finishReason: "stop",
      raw: {},
    };
  }
}

describe("Edge Cases", () => {
  describe("Empty inputs", () => {
    it("should handle empty prompt", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const result = await Runner.run(agent, "");
      expect(result).toBeDefined();
    });

    it("should handle empty tool list", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const result = await Runner.run(agent, "Test");
      expect(result).toBeDefined();
    });

    it("should handle empty instructions", async () => {
      const agent = new Agent("Test", "", [], 5);
      
      await expect(Runner.run(agent, "Test")).rejects.toThrow(
        "Agent instructions cannot be empty"
      );
    });
  });

  describe("Boundary values", () => {
    it("should handle max turns of 1", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 1);
      agent.setProvider(provider);

      const result = await Runner.run(agent, "Test");
      expect(result.turns).toBe(1);
    });

    it("should handle very large max turns", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 1000);
      agent.setProvider(provider);

      // Should not hang
      const result = await Runner.run(agent, "Test");
      expect(result.turns).toBe(1);
    });

    it("should handle zero max turns", async () => {
      const agent = new Agent("Test", "Instructions", [], 0);
      
      await expect(Runner.run(agent, "Test")).rejects.toThrow(
        "Agent maxTurns must be greater than 0"
      );
    });
  });

  describe("Special characters in inputs", () => {
    it("should handle unicode characters in prompt", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const result = await Runner.run(agent, "Hello 世界 🌍");
      expect(result).toBeDefined();
    });

    it("should handle very long prompts", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const longPrompt = "A".repeat(100000);
      const result = await Runner.run(agent, longPrompt);
      expect(result).toBeDefined();
    });

    it("should handle special characters in tool names", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const result = await Runner.run(agent, "Test with $pecial chars");
      expect(result).toBeDefined();
    });
  });

  describe("Resource management edge cases", () => {
    it("should handle multiple dispose calls", () => {
      const sessionManager = new SessionManager();
      sessionManager.dispose();
      sessionManager.dispose(); // Should not throw
    });

    it("should handle dispose of empty CompositeDisposable", () => {
      const disposable = new CompositeDisposable();
      disposable.dispose();
      expect(disposable.isEmpty()).toBe(true);
    });

    it("should handle adding to disposed CompositeDisposable", () => {
      const disposable = new CompositeDisposable();
      disposable.dispose();
      
      const testDisposable = { dispose: () => {} };
      disposable.add(testDisposable);
      disposable.dispose(); // Should not throw
    });
  });

  describe("SessionManager edge cases", () => {
    it("should handle multiple timer clear operations", () => {
      const sessionManager = new SessionManager();
      const timer = sessionManager.setTimeout(() => {}, 1000);
      sessionManager.clearTimeout(timer);
      sessionManager.clearTimeout(timer); // Should not throw
    });

    it("should handle abort on already aborted session", () => {
      const sessionManager = new SessionManager();
      sessionManager.abort();
      sessionManager.abort(); // Should not throw
    });

    it("should handle getting signal after abort", () => {
      const sessionManager = new SessionManager();
      sessionManager.abort();
      const signal = sessionManager.getSignal();
      expect(signal.aborted).toBe(true);
    });
  });

  describe("Concurrent operations", () => {
    it("should handle multiple concurrent agent runs", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const promises = [
        Runner.run(agent, "Test 1"),
        Runner.run(agent, "Test 2"),
        Runner.run(agent, "Test 3"),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.finalOutput === "Response")).toBe(true);
    });

    it("should handle concurrent tool executions", async () => {
      const provider = new EdgeCaseProvider();
      provider.setDelay(100);
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      const promises = Array(5).fill(null).map((_, i) => 
        Runner.run(agent, `Test ${i}`)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
    });

    it("should handle rapid sequential runs", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      for (let i = 0; i < 10; i++) {
        const result = await Runner.run(agent, `Test ${i}`);
        expect(result).toBeDefined();
      }
    });
  });

  describe("Error recovery edge cases", () => {
    it("should handle provider failure mid-execution", async () => {
      const provider = new EdgeCaseProvider();
      provider.setShouldFail(true);
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      // Should handle error gracefully
      await expect(Runner.run(agent, "Test")).rejects.toThrow();
    });

    it("should handle timeout during execution", async () => {
      const provider = new EdgeCaseProvider();
      provider.setDelay(10000); // Very long delay
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      // Should timeout (provider has default timeout)
      await expect(
        Runner.run(agent, "Test")
      ).rejects.toThrow();
    });
  });

  describe("Tool schema caching edge cases", () => {
    it("should handle cache hits for identical tool sets", async () => {
      const provider = new EdgeCaseProvider();
      const agent1 = new Agent("Test", "Instructions", DefaultToolRegistry.getAll(), 5);
      const agent2 = new Agent("Test", "Instructions", DefaultToolRegistry.getAll(), 5);
      
      agent1.setProvider(provider);
      agent2.setProvider(provider);

      const result1 = await Runner.run(agent1, "Test");
      const result2 = await Runner.run(agent2, "Test");

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it("should handle different tool sets", async () => {
      const provider = new EdgeCaseProvider();
      const agent1 = new Agent("Test", "Instructions", ["READ_FILE" as Tool], 5);
      const agent2 = new Agent("Test", "Instructions", ["WRITE_FILE" as Tool], 5);
      
      agent1.setProvider(provider);
      agent2.setProvider(provider);

      const result1 = await Runner.run(agent1, "Test");
      const result2 = await Runner.run(agent2, "Test");

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe("Memory and performance edge cases", () => {
    it("should handle many rapid tool schema builds", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      // Build schemas many times
      for (let i = 0; i < 100; i++) {
        const result = await Runner.run(agent, `Test ${i}`);
        expect(result).toBeDefined();
      }
    });

    it("should handle large message history", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);

      // Run with very long prompt to simulate large history
      const longPrompt = "Test ".repeat(10000);
      const result = await Runner.run(agent, longPrompt);
      expect(result).toBeDefined();
    });
  });

  describe("Configuration edge cases", () => {
    it("should handle provider set after model", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setModel("gpt-4");
      agent.setProvider(provider);

      const result = await Runner.run(agent, "Test");
      expect(result).toBeDefined();
    });

    it("should handle model set after provider", async () => {
      const provider = new EdgeCaseProvider();
      const agent = new Agent("Test", "Instructions", [], 5);
      agent.setProvider(provider);
      agent.setModel("gpt-4");

      const result = await Runner.run(agent, "Test");
      expect(result).toBeDefined();
    });

    it("should handle getting config without provider", async () => {
      const agent = new Agent("Test", "Instructions", [], 5);
      const config = agent.getConfig();
      
      expect(config.name).toBe("Test");
      expect(config.provider).toBeUndefined();
    });
  });
});
