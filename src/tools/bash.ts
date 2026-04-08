/**
 * Execute shell commands.
 */

import { Tool, ToolResult } from "../types";
import { ToolDefinition, ToolParameterValue } from "./base";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class BashTool extends ToolDefinition {
  getName(): Tool {
    return "bash";
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

  protected async executeInternal(params: Record<string, ToolParameterValue>): Promise<ToolResult<string>> {
    const command = params.command as string;
    const workDir = params.work_dir as string;

    if (!command) {
      return { error: "Command is required" };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workDir || process.cwd(),
      });

      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
