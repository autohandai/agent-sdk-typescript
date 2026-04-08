/**
 * Tests for extended filesystem tools.
 */

import {
  ApplyPatchTool,
  FindTool,
  GlobTool,
  SearchInFilesTool,
} from "../../tools/filesystem/extended";
import { Tool } from "../../types";

describe("Extended Filesystem Tools", () => {
  describe("ApplyPatchTool", () => {
    it("should have correct name", () => {
      const tool = new ApplyPatchTool();
      expect(tool.getName()).toBe(Tool.APPLY_PATCH);
    });

    it("should have description", () => {
      const tool = new ApplyPatchTool();
      expect(tool.getDescription()).toBe("Apply a unified diff patch to a file.");
    });

    it("should require file_path and patch parameters", () => {
      const tool = new ApplyPatchTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
      expect(params.required).toContain("patch");
    });
  });

  describe("FindTool", () => {
    it("should have correct name", () => {
      const tool = new FindTool();
      expect(tool.getName()).toBe(Tool.FIND);
    });

    it("should have description", () => {
      const tool = new FindTool();
      expect(tool.getDescription()).toBe("Find files by name pattern.");
    });

    it("should require pattern parameter", () => {
      const tool = new FindTool();
      const params = tool.getParameters();
      expect(params.required).toContain("pattern");
    });
  });

  describe("GlobTool", () => {
    it("should have correct name", () => {
      const tool = new GlobTool();
      expect(tool.getName()).toBe(Tool.GLOB);
    });

    it("should have description", () => {
      const tool = new GlobTool();
      expect(tool.getDescription()).toBe("Find files matching a glob pattern.");
    });

    it("should require pattern parameter", () => {
      const tool = new GlobTool();
      const params = tool.getParameters();
      expect(params.required).toContain("pattern");
    });
  });

  describe("SearchInFilesTool", () => {
    it("should have correct name", () => {
      const tool = new SearchInFilesTool();
      expect(tool.getName()).toBe(Tool.SEARCH_IN_FILES);
    });

    it("should have description", () => {
      const tool = new SearchInFilesTool();
      expect(tool.getDescription()).toBe("Search for text content in files.");
    });

    it("should require pattern parameter", () => {
      const tool = new SearchInFilesTool();
      const params = tool.getParameters();
      expect(params.required).toContain("pattern");
    });
  });
});
