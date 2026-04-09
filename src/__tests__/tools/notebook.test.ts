/**
 * Tests for notebook tools.
 */

import { NotebookReadTool, NotebookEditTool } from "../../tools/notebook";

describe("Notebook Tools", () => {
  describe("NotebookReadTool", () => {
    it("should have correct name", () => {
      const tool = new NotebookReadTool();
      expect(tool.getName()).toBe("notebook_read");
    });

    it("should have description", () => {
      const tool = new NotebookReadTool();
      expect(tool.getDescription()).toBe("Read a Jupyter notebook file.");
    });

    it("should require file_path parameter", () => {
      const tool = new NotebookReadTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
    });
  });

  describe("NotebookEditTool", () => {
    it("should have correct name", () => {
      const tool = new NotebookEditTool();
      expect(tool.getName()).toBe("notebook_edit");
    });

    it("should have description", () => {
      const tool = new NotebookEditTool();
      expect(tool.getDescription()).toBe("Edit a cell in a Jupyter notebook.");
    });

    it("should require file_path, cell_index, and new_source parameters", () => {
      const tool = new NotebookEditTool();
      const params = tool.getParameters();
      expect(params.required).toContain("file_path");
      expect(params.required).toContain("cell_index");
      expect(params.required).toContain("new_source");
    });
  });
});
