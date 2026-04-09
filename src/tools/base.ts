/**
 * Abstract base class for tool definitions.
 * Uses generic constraints for better type safety.
 */

import { Tool, ToolResult } from "../types";
import { RuntimeValidator } from "../validation/schemas";

/**
 * Type constraint for tool parameter values.
 */
export type ToolParameterValue = 
  | string 
  | number 
  | boolean 
  | string[] 
  | number[] 
  | boolean[] 
  | Record<string, unknown>;

export abstract class ToolDefinition {
  /**
   * Get the tool name as a string.
   */
  abstract getName(): string;

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
   * @param {Record<string, ToolParameterValue>} params - Tool parameters with type constraint
   * @returns {Promise<ToolResult<string>>} Tool execution result
   * @throws {Error} When tool execution fails
   */
  async execute(params: Record<string, unknown>): Promise<ToolResult<string>> {
    // Validate parameters before execution
    const validationError = this.validateParameters(params);
    if (validationError) {
      return { error: validationError };
    }

    try {
      return await this.executeInternal(params);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Internal execution method to be implemented by subclasses.
   */
  protected abstract executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>>;

  /**
   * Validate tool parameters before execution.
   */
  protected validateParameters(params: Record<string, unknown>): string | null {
    const schema = this.getParameters();
    
    // Check required parameters
    if (schema.required && Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (!(required in params)) {
          return `Missing required parameter: ${required}`;
        }
      }
    }
    
    // Check parameter types
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, value] of Object.entries(params)) {
        const paramSchema = (schema.properties as Record<string, unknown>)[key];
        if (paramSchema && typeof paramSchema === 'object') {
          const paramDef = paramSchema as Record<string, unknown>;
          const allowedTypes = this.getAllowedTypes(paramDef);
          if (allowedTypes && !allowedTypes.includes(typeof value)) {
            return `Invalid type for parameter ${key}: expected ${allowedTypes.join(' or ')}, got ${typeof value}`;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Get allowed types for a parameter schema.
   */
  private getAllowedTypes(paramDef: Record<string, unknown>): string[] | null {
    if (Array.isArray(paramDef.type)) {
      return paramDef.type as string[];
    }
    if (typeof paramDef.type === 'string') {
      return [paramDef.type];
    }
    return null;
  }
}
