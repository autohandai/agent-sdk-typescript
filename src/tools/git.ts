/**
 * Git operations tools.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolResult } from "../types";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class GitStatusTool extends ToolDefinition {
  getName(): string {
    return "git_status";
  }

  getDescription(): string {
    return "Show the working tree status.";
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
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";

    try {
      const { stdout, stderr } = await execAsync("git status", { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot get git status: ${error.message}` : "Cannot get git status",
      };
    }
  }
}

export class GitDiffTool extends ToolDefinition {
  getName(): string {
    return "git_diff";
  }

  getDescription(): string {
    return "Show changes between commits, commit and working tree, etc.";
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
        args: {
          type: "string",
          description: "Additional arguments to pass to git diff",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git diff ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot get git diff: ${error.message}` : "Cannot get git diff",
      };
    }
  }
}

export class GitLogTool extends ToolDefinition {
  getName(): string {
    return "git_log";
  }

  getDescription(): string {
    return "Show commit logs.";
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
        args: {
          type: "string",
          description: "Additional arguments to pass to git log",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git log ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot get git log: ${error.message}` : "Cannot get git log",
      };
    }
  }
}

export class GitCommitTool extends ToolDefinition {
  getName(): string {
    return "git_commit";
  }

  getDescription(): string {
    return "Record changes to the repository.";
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
        message: {
          type: "string",
          description: "Commit message",
        },
        args: {
          type: "string",
          description: "Additional arguments to pass to git commit",
        },
      },
      required: ["message"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const message = params.message as string;
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git commit ${args || ""} -m "${message}"`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot commit: ${error.message}` : "Cannot commit",
      };
    }
  }
}

export class GitAddTool extends ToolDefinition {
  getName(): string {
    return "git_add";
  }

  getDescription(): string {
    return "Add file contents to the index.";
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
        paths: {
          type: "string",
          description: "Paths to add (e.g., '.' for all, or specific files)",
        },
      },
      required: ["paths"],
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const paths = params.paths as string;

    try {
      const { stdout, stderr } = await execAsync(`git add ${paths}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot add files: ${error.message}` : "Cannot add files",
      };
    }
  }
}

export class GitResetTool extends ToolDefinition {
  getName(): string {
    return "git_reset";
  }

  getDescription(): string {
    return "Reset current HEAD to the specified state.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git reset",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git reset ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot reset: ${error.message}` : "Cannot reset",
      };
    }
  }
}

export class GitPushTool extends ToolDefinition {
  getName(): string {
    return "git_push";
  }

  getDescription(): string {
    return "Update remote refs along with associated objects.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git push",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git push ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot push: ${error.message}` : "Cannot push",
      };
    }
  }
}

export class GitPullTool extends ToolDefinition {
  getName(): string {
    return "git_pull";
  }

  getDescription(): string {
    return "Fetch from and integrate with another repository or a local branch.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git pull",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git pull ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot pull: ${error.message}` : "Cannot pull",
      };
    }
  }
}

export class GitFetchTool extends ToolDefinition {
  getName(): string {
    return "git_fetch";
  }

  getDescription(): string {
    return "Download objects and refs from another repository.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git fetch",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git fetch ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot fetch: ${error.message}` : "Cannot fetch",
      };
    }
  }
}

export class GitCheckoutTool extends ToolDefinition {
  getName(): string {
    return "git_checkout";
  }

  getDescription(): string {
    return "Switch branches or restore working tree files.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git checkout",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git checkout ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot checkout: ${error.message}` : "Cannot checkout",
      };
    }
  }
}

export class GitBranchTool extends ToolDefinition {
  getName(): string {
    return "git_branch";
  }

  getDescription(): string {
    return "List, create, or delete branches.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git branch",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git branch ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot branch: ${error.message}` : "Cannot branch",
      };
    }
  }
}

export class GitMergeTool extends ToolDefinition {
  getName(): string {
    return "git_merge";
  }

  getDescription(): string {
    return "Join two or more development histories together.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git merge",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git merge ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot merge: ${error.message}` : "Cannot merge",
      };
    }
  }
}

export class GitRebaseTool extends ToolDefinition {
  getName(): string {
    return "git_rebase";
  }

  getDescription(): string {
    return "Reapply commits on top of another base tip.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git rebase",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git rebase ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot rebase: ${error.message}` : "Cannot rebase",
      };
    }
  }
}

export class GitStashTool extends ToolDefinition {
  getName(): string {
    return "git_stash";
  }

  getDescription(): string {
    return "Stash the changes in a dirty working directory away.";
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
        args: {
          type: "string",
          description: "Arguments to pass to git stash",
        },
      },
    };
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>> {
    const workDir = (params.work_dir as string) || ".";
    const args = params.args as string;

    try {
      const { stdout, stderr } = await execAsync(`git stash ${args || ""}`, { cwd: workDir });
      return { data: stdout, error: stderr || undefined };
    } catch (error) {
      return {
        error: error instanceof Error ? `Cannot stash: ${error.message}` : "Cannot stash",
      };
    }
  }
}
