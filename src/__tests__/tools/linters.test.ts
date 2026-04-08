/**
 * Tests for linter tools.
 */

import {
  LintFileTool,
  LintDirectoryTool,
  ListLintersTool,
} from "../../tools/linters";
import { Tool } from "../../types";

describe("Linter Tools", () => {
  describe("LintFileTool", () => {
    it("should have correct name", () => {
      const tool = new LintFileTool();
      expect(tool.getName()).toBe(Tool.LINT_FILE);
    });

    it("should have description", () => {
      const tool = new LintFileTool();
      expect(tool.getDescription()).toBe("Lint a file using a code linter.");
    });

    it("should require file_path parameter", () => {
      const tool = new LintFileTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
    });
  });

  describe("LintDirectoryTool", () => {
    it("should have correct name", () => {
      const tool = new LintDirectoryTool();
      expect(tool.getName()).toBe(Tool.LINT_DIRECTORY);
    });

    it("should have description", () => {
      const tool = new LintDirectoryTool();
      expect(tool.getDescription()).toBe("Lint all files in a directory.");
    });

    it("should require directory_path parameter", () => {
      const tool = new LintDirectoryTool();
      const params = tool.getParameters();
      expect(params.required).toContain("directory_path");
    });
  });

  describe("ListLintersTool", () => {
    it("should have correct name", () => {
      const tool = new ListLintersTool();
      expect(tool.getName()).toBe(Tool.LIST_LINTERS);
    });

    it("should have description", () => {
      const tool = new ListLintersTool();
      expect(tool.getDescription()).toBe("List available code linters.");
    });

    it("should return list of linters", async () => {
      const tool = new ListLintersTool();
      const result = await tool.execute({});
      expect(result.data).toBeDefined();
      expect(result.data).toContain("eslint");
      expect(result.data).toContain("flake8");
    });
  });
});
