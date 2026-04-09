/**
 * Read the contents of a file.
 */

import { ToolDefinition } from "../base";
import { Tool, ToolResult } from "../../types";
import * as fs from "fs/promises";
import * as path from "path";

export class ReadFileTool extends ToolDefinition {
  getName(): string {
    return "read_file";
  }

  getDescription(): string {
    return "Read the contents of a file.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to read",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["file_path"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      return { data: content };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot read file: ${error.message}` : "Cannot read file",
      };
    }
  }
}
