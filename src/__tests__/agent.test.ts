/**
 * Unit tests for Agent
 */

import { Agent, Tool } from "../index";

describe("Agent", () => {
  test("can be created with minimal args", () => {
    const agent = new Agent("Assistant", "You are helpful");
    expect(agent.name).toBe("Assistant");
    expect(agent.instructions).toBe("You are helpful");
    expect(agent.maxTurns).toBe(10);
    expect(agent.tools).toHaveLength(0);
  });

  test("can be created with tools", () => {
    const agent = new Agent("Assistant", "You are helpful", [Tool.READ_FILE, Tool.BASH]);
    expect(agent.tools).toHaveLength(2);
    expect(agent.tools[0]).toBe(Tool.READ_FILE);
    expect(agent.tools[1]).toBe(Tool.BASH);
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
    agent.setModel("gpt-4");
    expect(agent.model).toBe("gpt-4");
  });
});
