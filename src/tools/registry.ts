/**
 * Registry for managing tool definitions and execution.
 */

import { ToolDefinition } from "./base";
import { Tool, ToolCall, ToolResult } from "../types";
import { ReadFileTool } from "./filesystem/read";
import { WriteFileTool } from "./filesystem/write";
import { EditFileTool } from "./filesystem/edit";
import { BashTool } from "./bash";

export class ToolRegistry {
  private tools: Map<Tool, ToolDefinition> = new Map();

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

  getTools(): Map<Tool, ToolDefinition> {
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
    
    // Register bash tool
    this.register(new BashTool());
    
    // TODO: Add more tools as needed (git, web search, etc.)
  }
}
