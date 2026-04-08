/**
 * Tests for web tools.
 */

import { WebSearchTool } from "../../tools/web";
import { Tool } from "../../types";

describe("Web Tools", () => {
  describe("WebSearchTool", () => {
    it("should have correct name", () => {
      const tool = new WebSearchTool();
      expect(tool.getName()).toBe(Tool.WEB_SEARCH);
    });

    it("should have description", () => {
      const tool = new WebSearchTool();
      expect(tool.getDescription()).toBe("Search the web for information.");
    });

    it("should require query parameter", () => {
      const tool = new WebSearchTool();
      const params = tool.getParameters();
      expect(params.required).toContain("query");
    });

    it("should have num_results parameter with default", () => {
      const tool = new WebSearchTool();
      const params = tool.getParameters();
      const properties = params.properties as Record<string, unknown>;
      expect(properties.num_results).toHaveProperty("default", 10);
    });

    it("should return error indicating API configuration needed", async () => {
      const tool = new WebSearchTool();
      const result = await tool.execute({ query: "test" });
      expect(result.error).toContain("API configuration");
    });
  });
});
