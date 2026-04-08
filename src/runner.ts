/**
 * Executes agents and manages the agent loop.
 */

import { Agent } from "./agent";
import { Message, ToolCall, ToolResult, ToolSchema, RunResult, Tool } from "./types";
import { loadConfig } from "./config";
import { createProvider } from "./providers/factory";
import { DefaultToolRegistry } from "./tools/registry";

export class Runner {
  /**
   * Run an agent synchronously with the given prompt.
   */
  static async runSync(agent: Agent, prompt: string): Promise<string> {
    const result = await this.run(agent, prompt);
    return result.finalOutput;
  }

  /**
   * Run an agent synchronously with the given prompt and return full result.
   */
  static async run(agent: Agent, prompt: string): Promise<RunResult> {
    // Load config if provider not set
    if (!agent.provider) {
      const config = loadConfig();
      agent.setProvider(createProvider(config));
      if (!agent.model) {
        agent.setModel(config.model);
      }
    }

    // Create session with user message
    const session: RunResult["session"] = {
      id: this.generateId(),
      messages: [{ role: "user", content: prompt }],
      workingDirectory: ".",
      createdAt: new Date(),
    };

    // Add system message with instructions
    const messages: Message[] = [
      { role: "system", content: agent.instructions },
      ...session.messages,
    ];

    // ReAct loop
    for (let turn = 0; turn < agent.maxTurns; turn++) {
      // Send to LLM provider
      const toolSchemas = this.buildToolSchemas(agent.tools);
      const response = await agent.provider!.chat(messages, agent.model!, toolSchemas);

      // Check if tool calls were made
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Execute each tool
        for (const toolCall of response.toolCalls) {
          const result = await this.executeTool(toolCall);
          session.messages.push({
            role: "tool",
            content: result.error || result.data || "",
          });

          messages.push({
            role: "assistant",
            content: "",
            tool_calls: [toolCall],
          });
          messages.push({
            role: "tool",
            content: result.error || result.data || "",
          });
        }
      } else {
        // No tool calls, final answer
        session.messages.push({ role: "assistant", content: response.content });
        return {
          finalOutput: response.content,
          session,
          turns: turn + 1,
        };
      }
    }

    return {
      finalOutput: "Max turns reached",
      session,
      turns: agent.maxTurns,
    };
  }

  private static buildToolSchemas(tools: Tool[]): ToolSchema[] {
    const registry = new DefaultToolRegistry();
    const schemas: ToolSchema[] = [];
    
    for (const tool of tools) {
      const toolDef = registry.getTools().get(tool);
      if (toolDef) {
        schemas.push({
          name: toolDef.getName(),
          description: toolDef.getDescription(),
          parameters: toolDef.getParameters(),
        });
      }
    }
    
    return schemas;
  }

  private static async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const registry = new DefaultToolRegistry();
    try {
      return await registry.execute(toolCall);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private static generateId(): string {
    return `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
}
