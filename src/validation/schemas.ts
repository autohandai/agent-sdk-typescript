/**
 * Runtime validation schemas using Zod for type-safe data handling.
 * Follows TypeScript best practices with discriminated unions and branded types.
 */

import { z } from "zod";
import { Tool, PermissionMode, TOOL_NAMES, PERMISSION_MODES } from "../types";

/**
 * Schema for tool call arguments validation.
 */
export const ToolCallSchema = z.object({
  id: z.string().min(1, "Tool call ID is required"),
  name: z.enum(TOOL_NAMES, "Tool name must be a valid Tool value"),
  arguments: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Arguments must be valid JSON string"
    }
  ),
});

/**
 * Schema for agent configuration validation.
 */
export const AgentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  instructions: z.string().min(1, "Agent instructions are required"),
  tools: z.array(z.enum(TOOL_NAMES)).min(0, "Tools array cannot be empty"),
  maxTurns: z.number().min(1).max(100, "Max turns must be between 1 and 100"),
  model: z.string().optional(),
  provider: z.any().optional(),
});

/**
 * Schema for permission mode validation.
 */
export const PermissionModeSchema = z.enum(PERMISSION_MODES, {
  errorMap: (issue) => ({
    message: `Invalid permission mode: ${issue.received}`,
  }),
});

/**
 * Schema for session creation validation.
 */
export const SessionConfigSchema = z.object({
  workingDirectory: z.string().min(1, "Working directory is required"),
  prompt: z.string().min(1, "Prompt is required"),
});

/**
 * Type-safe parsing with discriminated unions.
 */
export class SafeParser {
  /**
   * Parse tool call with type safety.
   */
  static parseToolCall(data: unknown) {
    return ToolCallSchema.safeParse(data);
  }

  /**
   * Parse agent configuration with type safety.
   */
  static parseAgentConfig(data: unknown) {
    return AgentConfigSchema.safeParse(data);
  }

  /**
   * Parse permission mode with type safety.
   */
  static parsePermissionMode(data: unknown) {
    return PermissionModeSchema.safeParse(data);
  }

  /**
   * Parse session configuration with type safety.
   */
  static parseSessionConfig(data: unknown) {
    return SessionConfigSchema.safeParse(data);
  }
}

/**
 * Runtime validation utilities.
 */
export class RuntimeValidator {
  /**
   * Validate tool call at runtime.
   */
  static validateToolCall(toolCall: unknown): asserts toolCall is z.infer<typeof ToolCallSchema> {
    const result = SafeParser.parseToolCall(toolCall);
    if (!result.success) {
      throw new Error(`Invalid tool call: ${result.error.message}`);
    }
  }

  /**
   * Validate agent configuration at runtime.
   */
  static validateAgentConfig(config: unknown): asserts config is z.infer<typeof AgentConfigSchema> {
    const result = SafeParser.parseAgentConfig(config);
    if (!result.success) {
      throw new Error(`Invalid agent config: ${result.error.message}`);
    }
  }

  /**
   * Validate permission mode at runtime.
   */
  static validatePermissionMode(mode: unknown): asserts mode is PermissionMode {
    const result = SafeParser.parsePermissionMode(mode);
    if (!result.success) {
      throw new Error(`Invalid permission mode: ${result.error.message}`);
    }
  }

  /**
   * Validate session configuration at runtime.
   */
  static validateSessionConfig(config: unknown): asserts config is z.infer<typeof SessionConfigSchema> {
    const result = SafeParser.parseSessionConfig(config);
    if (!result.success) {
      throw new Error(`Invalid session config: ${result.error.message}`);
    }
  }
}

// Export types for inference
export type ToolCallInput = z.infer<typeof ToolCallSchema>;
export type AgentConfigInput = z.infer<typeof AgentConfigSchema>;
export type SessionConfigInput = z.infer<typeof SessionConfigSchema>;
