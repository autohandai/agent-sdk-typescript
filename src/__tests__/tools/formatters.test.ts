/**
 * Tests for formatter tools.
 */

import {
  FormatFileTool,
  FormatDirectoryTool,
  ListFormattersTool,
  CheckFormattingTool,
} from "../../tools/formatters";
import { Tool } from "../../types";

describe("Formatter Tools", () => {
  describe("FormatFileTool", () => {
    it("should have correct name", () => {
      const tool = new FormatFileTool();
      expect(tool.getName()).toBe(Tool.FORMAT_FILE);
    });

    it("should have description", () => {
      const tool = new FormatFileTool();
      expect(tool.getDescription()).toBe("Format a file using a code formatter.");
    });

    it("should require file_path parameter", () => {
      const tool = new FormatFileTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
    });
  });

  describe("FormatDirectoryTool", () => {
    it("should have correct name", () => {
      const tool = new FormatDirectoryTool();
      expect(tool.getName()).toBe(Tool.FORMAT_DIRECTORY);
    });

    it("should have description", () => {
      const tool = new FormatDirectoryTool();
      expect(tool.getDescription()).toBe("Format all files in a directory.");
    });

    it("should require directory_path parameter", () => {
      const tool = new FormatDirectoryTool();
      const params = tool.getParameters();
      expect(params.required).toContain("directory_path");
    });
  });

  describe("ListFormattersTool", () => {
    it("should have correct name", () => {
      const tool = new ListFormattersTool();
      expect(tool.getName()).toBe(Tool.LIST_FORMATTERS);
    });

    it("should have description", () => {
      const tool = new ListFormattersTool();
      expect(tool.getDescription()).toBe("List available code formatters.");
    });

    it("should return list of formatters", async () => {
      const tool = new ListFormattersTool();
      const result = await tool.execute({});
      expect(result.data).toBeDefined();
      expect(result.data).toContain("prettier");
      expect(result.data).toContain("black");
    });
  });

  describe("CheckFormattingTool", () => {
    it("should have correct name", () => {
      const tool = new CheckFormattingTool();
      expect(tool.getName()).toBe(Tool.CHECK_FORMATTING);
    });

    it("should have description", () => {
      const tool = new CheckFormattingTool();
      expect(tool.getDescription()).toBe("Check if a file is properly formatted.");
    });

    it("should require file_path parameter", () => {
      const tool = new CheckFormattingTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
    });
  });
});
