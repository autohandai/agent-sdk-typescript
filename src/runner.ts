/**
 * Executes agents and manages the agent loop.
 * Uses discriminated unions for better type safety and error handling.
 */

import { Agent } from "./agent";
import { 
  Message, 
  ToolCall, 
  ToolResult, 
  ToolSchema, 
  RunResult, 
  Tool, 
  SessionId, 
  Session,
  ModelId,
  UserMessage, 
  AssistantMessage, 
  ToolMessage, 
  SystemMessage,
  RunResultSuccess, 
  RunResultMaxTurns 
} from "./types";
import { loadConfig } from "./config";
import { createProvider } from "./providers/factory";
import { DefaultToolRegistry } from "./tools/registry";

/**
 * Error types for better error handling.
 */
export class AgentExecutionError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentExecutionError';
  }
}

export class ToolExecutionError extends AgentExecutionError {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly cause?: Error
  ) {
    super(message, cause);
    this.name = 'ToolExecutionError';
  }
}

export class ProviderError extends AgentExecutionError {
  constructor(
    message: string,
    public readonly providerName: string,
    public readonly cause?: Error
  ) {
    super(message, cause);
    this.name = 'ProviderError';
  }
}

export class Runner {
  /**
   * Run an agent synchronously with the given prompt.
   * @throws {AgentExecutionError} When agent configuration is invalid
   */
  static async runSync(agent: Agent, prompt: string): Promise<string> {
    const result = await this.run(agent, prompt);
    
    if (result.finalOutput === 'Max turns reached') {
      throw new AgentExecutionError(
        `Agent exceeded maximum turns (${agent.maxTurns}) without reaching a conclusion`,
        undefined,
        { maxTurns: agent.maxTurns, finalOutput: result.finalOutput }
      );
    }
    
    return result.finalOutput;
  }

  /**
   * Run an agent with the given prompt and return full result.
   * @throws {AgentExecutionError} When agent configuration is invalid
   * @throws {ToolExecutionError} When tool execution fails
   * @throws {ProviderError} When provider communication fails
   */
  static async run(agent: Agent, prompt: string): Promise<RunResult> {
    // Validate agent configuration
    if (!agent.instructions.trim()) {
      throw new AgentExecutionError('Agent instructions cannot be empty');
    }
    
    if (agent.maxTurns <= 0) {
      throw new AgentExecutionError('Agent maxTurns must be greater than 0');
    }

    // Load config if provider not set
    let provider = agent.provider;
    let model = agent.model;
    
    if (!provider) {
      try {
        const config = loadConfig();
        provider = createProvider(config);
        agent.setProvider(provider);
        if (!model) {
          model = config.model as ModelId | undefined;
          if (model) {
            agent.setModel(model);
          }
        }
      } catch (error) {
        throw new ProviderError(
          'Failed to load provider configuration',
          'default',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }

    // Create session with user message
    const userMessage: UserMessage = {
      role: 'user',
      content: prompt
    };
    
    const session: Session = {
      id: this.generateSessionId(),
      messages: [userMessage],
      workingDirectory: ".",
      createdAt: new Date(),
    };

    // Add system message with instructions
    const systemMessage: SystemMessage = {
      role: 'system',
      content: agent.instructions
    };
    
    const messages: Message[] = [systemMessage, ...session.messages];

    // ReAct loop with better error handling
    for (let turn = 0; turn < agent.maxTurns; turn++) {
      try {
        // Send to LLM provider
        const toolSchemas = this.buildToolSchemas(agent.tools);
        const response = await provider!.chat(messages, model!, toolSchemas);

        // Check if tool calls were made
        if (response.toolCalls && response.toolCalls.length > 0) {
          // Execute each tool with error handling
          const toolResults: ToolResult<string>[] = [];
          
          for (const toolCall of response.toolCalls) {
            try {
              const result = await this.executeTool(toolCall);
              toolResults.push(result);
              
              const toolMessage: ToolMessage = {
                role: 'tool',
                content: result.error || result.data || "",
                tool_call_id: toolCall.id
              };
              
              session.messages.push(toolMessage);
              messages.push(toolMessage);
            } catch (error) {
              const errorMessage: ToolMessage = {
                role: 'tool',
                content: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
                tool_call_id: toolCall.id
              };
              
              toolResults.push({
                error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
              });
              
              session.messages.push(errorMessage);
              messages.push(errorMessage);
            }
          }
          
          const assistantMessage: AssistantMessage = {
            role: 'assistant',
            content: "",
            tool_calls: response.toolCalls
          };
          
          messages.push(assistantMessage);
        } else {
          // No tool calls, final answer
          const finalMessage: AssistantMessage = {
            role: 'assistant',
            content: response.content
          };
          
          session.messages.push(finalMessage);
          return {
            finalOutput: response.content,
            session,
            turns: turn + 1,
          } as RunResultSuccess;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'ProviderError') {
          throw error; // Re-throw provider errors
        }
        
        // Log error but continue with next turn
        const errorMessage: AssistantMessage = {
          role: 'assistant',
          content: `Error during turn ${turn + 1}: ${error instanceof Error ? error.message : String(error)}`
        };
        
        session.messages.push(errorMessage);
        messages.push(errorMessage);
      }
    }

    return {
      finalOutput: 'Max turns reached',
      session,
      turns: agent.maxTurns,
    } as RunResultMaxTurns;
  }

  /**
   * Build tool schemas from agent tools.
   * @returns {ToolSchema[]} Array of tool schemas for LLM
   */
  private static buildToolSchemas(tools: readonly Tool[]): ToolSchema[] {
    const registry = new DefaultToolRegistry();
    const schemas: ToolSchema[] = [];
    
    for (const tool of tools) {
      const toolDef = registry.getTools().get(tool);
      if (toolDef) {
        const schema: ToolSchema = {
          name: toolDef.getName(),
          description: toolDef.getDescription(),
          parameters: toolDef.getParameters(),
        };
        schemas.push(schema);
      }
    }
    
    return schemas;
  }

  /**
   * Execute a tool with better error handling.
   * @param {ToolCall} toolCall - The tool call to execute
   * @returns {Promise<ToolResult<string>>} Tool execution result
   * @throws {ToolExecutionError} When tool execution fails
   */
  private static async executeTool(toolCall: ToolCall): Promise<ToolResult<string>> {
    const registry = new DefaultToolRegistry();
    
    try {
      // Validate tool call
      if (!toolCall.name || !toolCall.id) {
        throw new ToolExecutionError(
          'Invalid tool call: missing name or id',
          toolCall.name || 'unknown'
        );
      }
      
      const result = await registry.execute(toolCall);
      
      // Validate result
      if (!result.data && !result.error) {
        return {
          error: 'Tool returned neither data nor error'
        };
      }
      
      return result;
    } catch (error) {
      throw new ToolExecutionError(
        `Failed to execute tool ${toolCall.name}`,
        toolCall.name,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate a unique session ID using branded type.
   * @returns {SessionId} A branded session ID
   */
  private static generateSessionId(): SessionId {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `sess_${timestamp}_${random}` as SessionId;
  }
}
