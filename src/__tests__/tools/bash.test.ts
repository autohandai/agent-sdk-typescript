/**
 * Unit tests for BashTool
 */

import { BashTool } from "../../index";

describe("BashTool", () => {
  test("has correct name", () => {
    const tool = new BashTool();
    expect(tool.getName()).toBe("bash");
  });

  test("has description", () => {
    const tool = new BashTool();
    expect(tool.getDescription()).toBe("Execute a shell command.");
  });

  test("has parameters", () => {
    const tool = new BashTool();
    const params = tool.getParameters();
    expect(params).toHaveProperty("type", "object");
    expect(params).toHaveProperty("properties");
    expect(params).toHaveProperty("required");
  });

  test("executes echo command", async () => {
    const tool = new BashTool();
    const result = await tool.execute({
      command: "echo hello",
      work_dir: ".",
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toContain("hello");
  });

  test("executes pwd command", async () => {
    const tool = new BashTool();
    const result = await tool.execute({
      command: "pwd",
      work_dir: ".",
    });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
  });
});
