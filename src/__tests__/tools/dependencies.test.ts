/**
 * Tests for dependency tools.
 */

import {
  ReadPackageManifestTool,
  AddDependencyTool,
  RemoveDependencyTool,
} from "../../tools/dependencies";

describe("Dependency Tools", () => {
  describe("ReadPackageManifestTool", () => {
    it("should have correct name", () => {
      const tool = new ReadPackageManifestTool();
      expect(tool.getName()).toBe("read_package_manifest");
    });

    it("should have description", () => {
      const tool = new ReadPackageManifestTool();
      expect(tool.getDescription()).toBe("Read package manifest (package.json, requirements.txt, etc.).");
    });
  });

  describe("AddDependencyTool", () => {
    it("should have correct name", () => {
      const tool = new AddDependencyTool();
      expect(tool.getName()).toBe("add_dependency");
    });

    it("should have description", () => {
      const tool = new AddDependencyTool();
      expect(tool.getDescription()).toBe("Add a dependency to the package manifest.");
    });

    it("should require package parameter", () => {
      const tool = new AddDependencyTool();
      const params = tool.getParameters();
      expect(params.required).toContain("package");
    });

    it("should have dev parameter with default", () => {
      const tool = new AddDependencyTool();
      const params = tool.getParameters();
      const properties = params.properties as Record<string, unknown>;
      expect(properties.dev).toHaveProperty("default", false);
    });
  });

  describe("RemoveDependencyTool", () => {
    it("should have correct name", () => {
      const tool = new RemoveDependencyTool();
      expect(tool.getName()).toBe("remove_dependency");
    });

    it("should have description", () => {
      const tool = new RemoveDependencyTool();
      expect(tool.getDescription()).toBe("Remove a dependency from the package manifest.");
    });

    it("should require package parameter", () => {
      const tool = new RemoveDependencyTool();
      const params = tool.getParameters();
      expect(params.required).toContain("package");
    });
  });
});
