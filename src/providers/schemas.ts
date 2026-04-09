/**
 * Zod schemas for validating provider API responses.
 * Provides runtime validation for type safety.
 */

import { z } from "zod";

/**
 * Schema for OpenAI-compatible API response.
 */
export const OpenAIResponseSchema = z.object({
  id: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string().nullable(),
        tool_calls: z.array(
          z.object({
            id: z.string(),
            type: z.literal("function"),
            function: z.object({
              name: z.string(),
              arguments: z.string(),
            }),
          })
        ).optional(),
      }),
      finish_reason: z.string().optional(),
    })
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }).optional(),
});

/**
 * Schema for Ollama API response (different structure).
 */
export const OllamaResponseSchema = z.object({
  message: z.object({
    role: z.string(),
    content: z.string(),
    tool_calls: z.array(
      z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      })
    ).optional(),
  }),
  done: z.boolean(),
  prompt_eval_count: z.number().optional(),
  eval_count: z.number().optional(),
});

/**
 * Type for validated OpenAI response.
 */
export type ValidatedOpenAIResponse = z.infer<typeof OpenAIResponseSchema>;

/**
 * Type for validated Ollama response.
 */
export type ValidatedOllamaResponse = z.infer<typeof OllamaResponseSchema>;
