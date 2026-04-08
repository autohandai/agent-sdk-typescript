/**
 * Execute shell commands.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolResult } from "../types";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class BashTool extends ToolDefinition {
  getName(): Tool {
    return Tool.BASH;
  }

  getDescription(): string {
    return "Execute a shell command.";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "Shell command to execute",
        },
        work_dir: {
          type: "string",
          description: "Working directory",
          default: ".",
        },
      },
      required: ["command"],
    };
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    const workDir = (params.work_dir as string) || ".";
    const command = params.command as string;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workDir,
      });

      if (stderr) {
        return {
          data: stdout,
          error: stderr,
        };
      }

      return { data: stdout };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot execute command: ${error.message}` : "Cannot execute command",
      };
    }
  }
}
