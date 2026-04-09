/**
 * Apply a find-and-replace edit to a file.
 */

import { ToolDefinition } from "../base";
import { Tool, ToolResult } from "../../types";
import * as fs from "fs/promises";
import * as path from "path";

export class EditFileTool extends ToolDefinition {
  getName(): string {
    return "edit_file";
  }

  getDescription(): string {
    return "Apply a find-and-replace edit to a file.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file",
        },
        old_string: {
          type: "string",
          description: "Text to find and replace",
        },
        new_string: {
          type: "string",
          description: "Replacement text",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["file_path", "old_string", "new_string"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const filePath = params.file_path as string;
    const oldString = params.old_string as string;
    const newString = params.new_string as string;

    const fullPath = path.resolve(workDir, filePath);

    try {
      const content = await fs.readFile(fullPath, "utf-8");
      if (!content.includes(oldString)) {
        return { error: "Old string not found in file" };
      }
      const newContent = content.replace(oldString, newString);
      await fs.writeFile(fullPath, newContent, "utf-8");
      return { data: "File edited successfully" };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot edit file: ${error.message}` : "Cannot edit file",
      };
    }
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    return this.executeInternal(params);
  }
}
