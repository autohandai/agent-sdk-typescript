/**
 * Package dependency management tools.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolResult } from "../types";
import * as fs from "fs/promises";
import * as path from "path";

export class ReadPackageManifestTool extends ToolDefinition {
  getName(): Tool {
    return Tool.READ_PACKAGE_MANIFEST;
  }

  getDescription(): string {
    return "Read package manifest (package.json, requirements.txt, etc.).";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        manifest_type: {
          type: "string",
          description: "Type of manifest (package.json, requirements.txt, etc.)",
        },
      },
    };
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const workDir = (params.work_dir as string) || ".";
    const manifestType = params.manifest_type as string;

    // Try to detect manifest type if not specified
    let manifestPath: string | undefined;
    
    if (manifestType === "package.json") {
      manifestPath = path.resolve(workDir, "package.json");
    } else if (manifestType === "requirements.txt") {
      manifestPath = path.resolve(workDir, "requirements.txt");
    } else if (manifestType === "pyproject.toml") {
      manifestPath = path.resolve(workDir, "pyproject.toml");
    } else if (manifestType === "Cargo.toml") {
      manifestPath = path.resolve(workDir, "Cargo.toml");
    } else {
      // Auto-detect
      const possiblePaths = [
        path.resolve(workDir, "package.json"),
        path.resolve(workDir, "requirements.txt"),
        path.resolve(workDir, "pyproject.toml"),
        path.resolve(workDir, "Cargo.toml"),
      ];
      
      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          manifestPath = p;
          break;
        } catch {
          continue;
        }
      }
    }
    
    if (!manifestPath) {
      return { error: "No package manifest found" };
    }

    try {
      const content = await fs.readFile(manifestPath, "utf-8");
      return { data: content };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot read manifest: ${error.message}` : "Cannot read manifest",
      };
    }
  }
}

export class AddDependencyTool extends ToolDefinition {
  getName(): Tool {
    return Tool.ADD_DEPENDENCY;
  }

  getDescription(): string {
    return "Add a dependency to the package manifest.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        package: {
          type: "string",
          description: "Package name and version (e.g., 'lodash@4.17.21')",
        },
        dev: {
          type: "boolean",
          description: "Add as dev dependency",
          default: false,
        },
      },
      required: ["package"],
    };
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const workDir = (params.work_dir as string) || ".";
    const packageSpec = params.package as string;
    const isDev = params.dev as boolean;

    // Note: This is a placeholder implementation
    // In a real implementation, you would use npm, pip, cargo, etc.
    // For now, we'll return an error indicating this needs CLI integration
    
    return {
      error: "Add dependency tool requires package manager CLI integration. Use the appropriate package manager command directly.",
    };
  }
}

export class RemoveDependencyTool extends ToolDefinition {
  getName(): Tool {
    return Tool.REMOVE_DEPENDENCY;
  }

  getDescription(): string {
    return "Remove a dependency from the package manifest.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        package: {
          type: "string",
          description: "Package name",
        },
      },
      required: ["package"],
    };
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const workDir = (params.work_dir as string) || ".";
    const packageName = params.package as string;

    // Note: This is a placeholder implementation
    // In a real implementation, you would use npm, pip, cargo, etc.
    
    return {
      error: "Remove dependency tool requires package manager CLI integration. Use the appropriate package manager command directly.",
    };
  }
}
