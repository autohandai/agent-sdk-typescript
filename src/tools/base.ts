/**
 * Abstract base class for tool definitions.
 * Uses Zod for runtime parameter validation.
 * Implements Disposable for resource cleanup.
 */

import { Tool, ToolResult } from "../types";
import { z } from "zod";
import { ValidationError } from "../errors";
import { Disposable } from "../utils/disposable";

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

export abstract class ToolDefinition implements Disposable {
  /**
   * Get the tool name as a string.
   */
  abstract getName(): string;

  /**
   * Get the tool description.
   */
  abstract getDescription(): string;

  /**
   * Get the tool parameters schema in JSON Schema format for LLM.
   */
  abstract getParameters(): Record<string, unknown>;

  /**
   * Get the Zod schema for runtime parameter validation.
   * Override this to provide custom validation logic.
   * Default implementation converts JSON Schema to basic Zod schema.
   */
  getParameterSchema(): z.ZodSchema<Record<string, unknown>> {
    const jsonSchema = this.getParameters();
    return this.jsonSchemaToZod(jsonSchema);
  }

  /**
   * Execute the tool with given parameters.
   * @param {Record<string, ToolParameterValue>} params - Tool parameters with type constraint
   * @returns {Promise<ToolResult<string>>} Tool execution result
   * @throws {Error} When tool execution fails
   */
  async execute(params: Record<string, unknown>): Promise<ToolResult<string>> {
    // Validate parameters before execution using Zod
    const schema = this.getParameterSchema();
    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        error: `Parameter validation failed: ${result.error.message}`
      };
    }

    try {
      return await this.executeInternal(result.data);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Internal execution method to be implemented by subclasses.
   * Receives validated parameters.
   */
  protected abstract executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>>;

  /**
   * Convert JSON Schema to basic Zod schema for validation.
   * This is a simplified conversion - override getParameterSchema() for complex validation.
   */
  private jsonSchemaToZod(jsonSchema: Record<string, unknown>): z.ZodSchema<Record<string, unknown>> {
    const shape: Record<string, z.ZodTypeAny> = {};

    if (jsonSchema.properties && typeof jsonSchema.properties === 'object') {
      const properties = jsonSchema.properties as Record<string, unknown>;
      
      for (const [key, propSchema] of Object.entries(properties)) {
        if (typeof propSchema === 'object' && propSchema !== null) {
          const prop = propSchema as Record<string, unknown>;
          let zodType: z.ZodTypeAny;

          // Convert type to Zod
          if (prop.type === 'string') {
            zodType = z.string();
          } else if (prop.type === 'number') {
            zodType = z.number();
          } else if (prop.type === 'boolean') {
            zodType = z.boolean();
          } else if (prop.type === 'array') {
            zodType = z.array(z.any());
          } else if (prop.type === 'object') {
            zodType = z.record(z.any());
          } else {
            zodType = z.any();
          }

          // Handle optional fields
          const isRequired = jsonSchema.required && 
                           Array.isArray(jsonSchema.required) && 
                           jsonSchema.required.includes(key);
          
          shape[key] = isRequired ? zodType : zodType.optional();
        }
      }
    }

    return z.object(shape).passthrough();
  }

  /**
   * Dispose of any resources held by this tool.
   * Override this method to clean up tool-specific resources like file handles, timers, etc.
   * Default implementation is a no-op.
   */
  dispose(): void {
    // Default implementation - override in subclasses if needed
  }
}
