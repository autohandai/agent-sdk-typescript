/**
 * An AI agent with instructions, tools, and a model configuration.
 */

import { Tool, AgentOptions } from "./types/index";
import { Provider } from "./types/provider";

export class Agent {
  name: string;
  instructions: string;
  tools: Tool[];
  model?: string;
  maxTurns: number;
  provider?: Provider;

  constructor(name: string, instructions: string, tools: Tool[] = [], maxTurns: number = 10) {
    this.name = name;
    this.instructions = instructions;
    this.tools = tools;
    this.maxTurns = maxTurns;
    this.model = undefined;
    this.provider = undefined;
  }

  setProvider(provider: Provider): void {
    this.provider = provider;
  }

  setModel(model: string): void {
    this.model = model;
  }
}
