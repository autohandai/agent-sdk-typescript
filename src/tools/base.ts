/**
 * Abstract base class for tool definitions.
 */

import { Tool, ToolResult } from "../types";

export abstract class ToolDefinition {
  /**
   * Get the tool enum value.
   */
  abstract getName(): Tool;

  /**
   * Get the tool description.
   */
  abstract getDescription(): string;

  /**
   * Get the tool parameters schema.
   */
  abstract getParameters(): Record<string, unknown>;

  /**
   * Execute the tool with given parameters.
   */
  abstract execute(params: Record<string, unknown>): Promise<ToolResult>;
}
