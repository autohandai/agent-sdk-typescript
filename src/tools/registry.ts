/**
 * Registry for managing tool definitions and execution.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolCall, ToolResult } from "../types";
import { ReadFileTool } from "./filesystem/read";
import { WriteFileTool } from "./filesystem/write";
import { EditFileTool } from "./filesystem/edit";
import { BashTool } from "./bash";
import {
  ApplyPatchTool,
  FindTool,
  GlobTool,
  SearchInFilesTool,
} from "./filesystem/extended";
import {
  GitStatusTool,
  GitDiffTool,
  GitLogTool,
  GitCommitTool,
  GitAddTool,
  GitResetTool,
  GitPushTool,
  GitPullTool,
  GitFetchTool,
  GitCheckoutTool,
  GitBranchTool,
  GitMergeTool,
  GitRebaseTool,
  GitStashTool,
} from "./git";
import { WebSearchTool } from "./web";
import { NotebookReadTool, NotebookEditTool } from "./notebook";
import {
  ReadPackageManifestTool,
  AddDependencyTool,
  RemoveDependencyTool,
} from "./dependencies";
import {
  FormatFileTool,
  FormatDirectoryTool,
  ListFormattersTool,
  CheckFormattingTool,
} from "./formatters";
import {
  LintFileTool,
  LintDirectoryTool,
  ListLintersTool,
} from "./linters";

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.getName(), tool);
  }

  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const toolName = toolCall.name as Tool;
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        error: `Tool not found: ${toolCall.name}`,
      };
    }

    // Parse arguments JSON string to object (simplified)
    let params: Record<string, unknown> = {};
    try {
      if (toolCall.arguments) {
        params = JSON.parse(toolCall.arguments);
      }
    } catch (error) {
      return {
        error: `Invalid JSON arguments: ${toolCall.arguments}`,
      };
    }

    return await tool.execute(params);
  }

  getTools(): Map<string, ToolDefinition> {
    return this.tools;
  }
}

/**
 * Default tool registry with common tools registered.
 */
export class DefaultToolRegistry extends ToolRegistry {
  constructor() {
    super();
    
    // Register filesystem tools
    this.register(new ReadFileTool());
    this.register(new WriteFileTool());
    this.register(new EditFileTool());
    this.register(new ApplyPatchTool());
    this.register(new FindTool());
    this.register(new GlobTool());
    this.register(new SearchInFilesTool());
    
    // Register bash tool
    this.register(new BashTool());
    
    // Register git tools
    this.register(new GitStatusTool());
    this.register(new GitDiffTool());
    this.register(new GitLogTool());
    this.register(new GitCommitTool());
    this.register(new GitAddTool());
    this.register(new GitResetTool());
    this.register(new GitPushTool());
    this.register(new GitPullTool());
    this.register(new GitFetchTool());
    this.register(new GitCheckoutTool());
    this.register(new GitBranchTool());
    this.register(new GitMergeTool());
    this.register(new GitRebaseTool());
    this.register(new GitStashTool());
    
    // Register web tool
    this.register(new WebSearchTool());
    
    // Register notebook tools
    this.register(new NotebookReadTool());
    this.register(new NotebookEditTool());
    
    // Register dependency tools
    this.register(new ReadPackageManifestTool());
    this.register(new AddDependencyTool());
    this.register(new RemoveDependencyTool());
    
    // Register formatter tools
    this.register(new FormatFileTool());
    this.register(new FormatDirectoryTool());
    this.register(new ListFormattersTool());
    this.register(new CheckFormattingTool());
    
    // Register linter tools
    this.register(new LintFileTool());
    this.register(new LintDirectoryTool());
    this.register(new ListLintersTool());
  }
}
