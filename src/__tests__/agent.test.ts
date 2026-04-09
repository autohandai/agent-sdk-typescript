/**
 * Unit tests for Agent
 */

import { Agent, ModelId } from "../index";

describe("Agent", () => {
  test("can be created with minimal args", () => {
    const agent = new Agent("Assistant", "You are helpful");
    expect(agent.name).toBe("Assistant");
    expect(agent.instructions).toBe("You are helpful");
    expect(agent.maxTurns).toBe(10);
    expect(agent.tools).toHaveLength(0);
  });

  test("can be created with tools", () => {
    const agent = new Agent("Assistant", "You are helpful", ["read_file", "bash"]);
    expect(agent.tools).toHaveLength(2);
    expect(agent.tools[0]).toBe("read_file");
    expect(agent.tools[1]).toBe("bash");
  });

  test("can be created with max turns", () => {
    const agent = new Agent("Assistant", "You are helpful", [], 20);
    expect(agent.maxTurns).toBe(20);
  });

  test("can set provider", () => {
    const agent = new Agent("Assistant", "You are helpful");
    const mockProvider = {} as any;
    agent.setProvider(mockProvider);
    expect(agent.provider).toBe(mockProvider);
  });

  test("can set model", () => {
    const agent = new Agent("Assistant", "You are helpful");
    agent.setModel("gpt-4" as ModelId);
    expect(agent.model).toBe("gpt-4");
  });
});
