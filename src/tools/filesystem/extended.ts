/**
 * Extended filesystem operations (find, glob, search, patch).
 */

import { ToolDefinition } from "../base";
import { Tool, ToolResult } from "../../types";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ApplyPatchTool extends ToolDefinition {
  getName(): string {
    return "apply_patch";
  }

  getDescription(): string {
    return "Apply a unified diff patch to a file.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file",
        },
        patch: {
          type: "string",
          description: "Unified diff patch content",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["file_path", "patch"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;
    const patch = params.patch as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      // Write patch to temp file
      const tempPatchPath = path.join(workDir, `.temp_patch_${Date.now()}.diff`);
      await fs.writeFile(tempPatchPath, patch, "utf-8");

      // Apply patch using patch command
      const { stdout, stderr } = await execAsync(`patch -p1 < ${tempPatchPath}`, {
        cwd: workDir,
      });

      // Clean up temp file
      await fs.unlink(tempPatchPath);

      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot apply patch: ${error.message}` : "Cannot apply patch",
      };
    }
  }
}

export class FindTool extends ToolDefinition {
  getName(): string {
    return "find";
  }

  getDescription(): string {
    return "Find files by name pattern.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "File name pattern to search for",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        max_depth: {
          type: "number",
          description: "Maximum search depth",
        },
      },
      required: ["pattern"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const pattern = params.pattern as string;
    const maxDepth = params.max_depth as number;

    try {
      const args = [workDir, "-name", pattern];
      if (maxDepth !== undefined) {
        args.unshift(`-maxdepth`, maxDepth.toString());
      }

      const { stdout, stderr } = await execAsync(`find ${args.join(" ")}`);
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot find files: ${error.message}` : "Cannot find files",
      };
    }
  }
}

export class GlobTool extends ToolDefinition {
  getName(): string {
    return "glob";
  }

  getDescription(): string {
    return "Find files matching a glob pattern.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Glob pattern (e.g., '**/*.ts')",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["pattern"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const pattern = params.pattern as string;

    try {
      // Use find with glob pattern (simplified approach)
      const { stdout, stderr } = await execAsync(`find ${workDir} -name '${pattern}'`, {
        cwd: workDir,
      });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot glob files: ${error.message}` : "Cannot glob files",
      };
    }
  }
}

export class SearchInFilesTool extends ToolDefinition {
  getName(): string {
    return "search_in_files";
  }

  getDescription(): string {
    return "Search for text content in files.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Text pattern to search for (supports regex)",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
        file_pattern: {
          type: "string",
          description: "File pattern to limit search (e.g., '*.ts')",
        },
      },
      required: ["pattern"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const pattern = params.pattern as string;
    const filePattern = params.file_pattern as string;

    try {
      let command = `grep -r "${pattern}" ${workDir}`;
      if (filePattern) {
        command += ` --include="${filePattern}"`;
      }

      const { stdout, stderr } = await execAsync(command, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      // grep returns non-zero exit code when no matches found
      if (error instanceof Error && error.message.includes("exit code")) {
        return { data: "No matches found" };
      }
      return {
        error: error instanceof Error ? `Cannot search in files: ${error.message}` : "Cannot search in files",
      };
    }
  }
}
