/**
 * An AI agent with instructions, tools, and a model configuration.
 * Uses readonly properties for immutability and better type safety.
 */

import { Tool, AgentOptions, ModelId } from "./types/index";
import { Provider } from "./types/provider";

/**
 * Readonly configuration snapshot of an Agent.
 */
export interface AgentConfig {
  /** The agent's name */
  readonly name: string;
  /** The agent's instructions/system prompt */
  readonly instructions: string;
  /** Array of tools available to the agent */
  readonly tools: readonly Tool[];
  /** Maximum number of turns the agent can take */
  readonly maxTurns: number;
  /** Optional model identifier */
  readonly model?: ModelId;
  /** Optional LLM provider instance */
  readonly provider?: Provider;
}

/**
 * Represents an AI agent that can execute tasks using tools and LLM providers.
 * 
 * @example
 * ```typescript
 * import { Agent, OpenRouterProvider, DefaultToolRegistry } from "@autohandai/agent-sdk";
 * 
 * const agent = new Agent(
 *   "Assistant",
 *   "You are a helpful coding assistant.",
 *   DefaultToolRegistry.getAll()
 * );
 * agent.setProvider(new OpenRouterProvider("api-key", "gpt-4"));
 * ```
 */
export class Agent {
  private _name: string;
  private _instructions: string;
  private _tools: readonly Tool[];
  private _maxTurns: number;
  private _model?: ModelId;
  private _provider?: Provider;

  /**
   * Creates a new Agent instance.
   * 
   * @param name - The agent's name
   * @param instructions - The agent's instructions/system prompt
   * @param tools - Array of tools available to the agent (default: empty array)
   * @param maxTurns - Maximum number of turns the agent can take (default: 10)
   */
  constructor(name: string, instructions: string, tools: readonly Tool[] = [], maxTurns: number = 10) {
    this._name = name;
    this._instructions = instructions;
    this._tools = tools;
    this._maxTurns = maxTurns;
    this._model = undefined;
    this._provider = undefined;
  }

  /**
   * Gets the agent's name.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the agent's instructions.
   */
  get instructions(): string {
    return this._instructions;
  }

  /**
   * Gets the tools available to the agent.
   */
  get tools(): readonly Tool[] {
    return this._tools;
  }

  /**
   * Gets the maximum number of turns the agent can take.
   */
  get maxTurns(): number {
    return this._maxTurns;
  }

  /**
   * Gets the model identifier.
   */
  get model(): ModelId | undefined {
    return this._model;
  }

  /**
   * Gets the LLM provider instance.
   */
  get provider(): Provider | undefined {
    return this._provider;
  }

  /**
   * Sets the LLM provider for the agent.
   * 
   * @param provider - The LLM provider instance
   */
  setProvider(provider: Provider): void {
    this._provider = provider;
  }

  /**
   * Sets the model identifier for the agent.
   * 
   * @param model - The model identifier
   */
  setModel(model: ModelId): void {
    this._model = model;
  }

  /**
   * Creates a readonly configuration snapshot of the agent.
   * 
   * @returns A readonly AgentConfig object
   */
  getConfig(): AgentConfig {
    return {
      name: this._name,
      instructions: this._instructions,
      tools: this._tools,
      maxTurns: this._maxTurns,
      model: this._model,
      provider: this._provider,
    };
  }
}
