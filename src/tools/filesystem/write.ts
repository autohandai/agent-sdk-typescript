/**
 * Write content to a file.
 */

import { ToolDefinition } from "../base";
import { Tool, ToolResult } from "../../types";
import * as fs from "fs/promises";
import * as path from "path";

export class WriteFileTool extends ToolDefinition {
  getName(): string {
    return "write_file";
  }

  getDescription(): string {
    return "Write content to a file.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file",
        },
        content: {
          type: "string",
          description: "Content to write",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["file_path", "content"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;
    const content = params.content as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      // Create parent directories if they don't exist
      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });

      await fs.writeFile(fullPath, content, "utf-8");
      return { data: "File written successfully" };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot write file: ${error.message}` : "Cannot write file",
      };
    }
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    return this.executeInternal(params);
  }
}
