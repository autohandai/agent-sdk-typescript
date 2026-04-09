/**
 * Executes agents and manages the agent loop.
 * Uses discriminated unions for better type safety and error handling.
 * Implements resource cleanup via SessionManager.
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
import { SessionManager } from "./utils/session";

/**
 * Error thrown when agent execution fails.
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

/**
 * Error thrown when tool execution fails.
 */
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

/**
 * Error thrown when provider communication fails.
 */
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

/**
 * Executes agents and manages the agent execution loop.
 * Provides both synchronous and asynchronous execution modes.
 * 
 * @example
 * ```typescript
 * import { Runner, Agent } from "@autohandai/agent-sdk";
 * 
 * const agent = new Agent("Assistant", "You are helpful.", tools);
 * const result = await Runner.run(agent, "Hello!");
 * console.log(result.finalOutput);
 * ```
 */
export class Runner {
  private static toolSchemaCache: Map<string, ToolSchema[]> = new Map();

  /**
   * Runs an agent synchronously with the given prompt.
   * Throws an error if the agent exceeds max turns without reaching a conclusion.
   * 
   * @param agent - The agent to run
   * @param prompt - The user prompt to start the conversation
   * @returns The final output from the agent
   * @throws {AgentExecutionError} When agent configuration is invalid or max turns exceeded
   * 
   * @example
   * ```typescript
   * const result = await Runner.runSync(agent, "Read the file");
   * console.log(result);
   * ```
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
   * Runs an agent with the given prompt and returns the full result.
   * Includes session information and turn count.
   * 
   * @param agent - The agent to run
   * @param prompt - The user prompt to start the conversation
   * @returns The complete run result including session and turn count
   * @throws {AgentExecutionError} When agent configuration is invalid
   * @throws {ToolExecutionError} When tool execution fails
   * @throws {ProviderError} When provider communication fails
   * 
   * @example
   * ```typescript
   * const result = await Runner.run(agent, "Analyze the code");
   * console.log(`Turns: ${result.turns}`);
   * console.log(`Output: ${result.finalOutput}`);
   * ```
   */
  static async run(agent: Agent, prompt: string): Promise<RunResult> {
    // Create session manager for resource cleanup
    const sessionManager = new SessionManager();
    
    try {
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
        // Check if session was aborted
        if (sessionManager.isAborted()) {
          throw new AgentExecutionError('Agent execution was aborted');
        }

        try {
          // Send to LLM provider with session signal for cancellation
          const toolSchemas = this.buildToolSchemas(agent.tools);
          const response = await provider!.chat(messages, model!, toolSchemas, {
            timeout: 30000,
            maxRetries: 3,
          });

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
    } finally {
      // Always cleanup resources
      sessionManager.dispose();
    }
  }

  /**
   * Build tool schemas from agent tools with caching.
   * @returns {ToolSchema[]} Array of tool schemas for LLM
   */
  private static buildToolSchemas(tools: readonly Tool[]): ToolSchema[] {
    // Create cache key from sorted tool names
    const cacheKey = tools.slice().sort().join(',');
    
    // Check cache
    if (this.toolSchemaCache.has(cacheKey)) {
      return this.toolSchemaCache.get(cacheKey)!;
    }
    
    // Build schemas
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
    
    // Cache the result
    this.toolSchemaCache.set(cacheKey, schemas);
    
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
