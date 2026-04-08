/**
 * An AI agent with instructions, tools, and a model configuration.
 * Uses readonly properties for immutability and better type safety.
 */

import { Tool, AgentOptions, ModelId } from "./types/index";
import { Provider } from "./types/provider";

export interface AgentConfig {
  readonly name: string;
  readonly instructions: string;
  readonly tools: readonly Tool[];
  readonly maxTurns: number;
  readonly model?: ModelId;
  readonly provider?: Provider;
}

export class Agent {
  private _name: string;
  private _instructions: string;
  private _tools: readonly Tool[];
  private _maxTurns: number;
  private _model?: ModelId;
  private _provider?: Provider;

  constructor(name: string, instructions: string, tools: readonly Tool[] = [], maxTurns: number = 10) {
    this._name = name;
    this._instructions = instructions;
    this._tools = tools;
    this._maxTurns = maxTurns;
    this._model = undefined;
    this._provider = undefined;
  }

  get name(): string {
    return this._name;
  }

  get instructions(): string {
    return this._instructions;
  }

  get tools(): readonly Tool[] {
    return this._tools;
  }

  get maxTurns(): number {
    return this._maxTurns;
  }

  get model(): ModelId | undefined {
    return this._model;
  }

  get provider(): Provider | undefined {
    return this._provider;
  }

  setProvider(provider: Provider): void {
    this._provider = provider;
  }

  setModel(model: ModelId): void {
    this._model = model;
  }

  /**
   * Create a readonly configuration snapshot of the agent.
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
