/**
 * Factory for creating provider instances from configuration.
 */

import { Provider } from "../types/provider";
import { OpenRouterProvider } from "./openrouter";
import { ProviderNotConfiguredError } from "../types/provider";
import { Config } from "../config";

export function createProvider(config: Config): Provider {
  return createProviderByName(config.provider, config.apiKey, config.model);
}

export function createProviderByName(
  providerName: string,
  apiKey?: string,
  model?: string
): Provider {
  const name = providerName || "openrouter";

  switch (name.toLowerCase()) {
    case "openrouter":
      if (!apiKey) {
        throw new ProviderNotConfiguredError("openrouter");
      }
      return new OpenRouterProvider(apiKey, model);
    case "openai":
      // TODO: Implement OpenAI provider
      throw new Error("OpenAI provider not yet implemented");
    case "ollama":
      // TODO: Implement Ollama provider
      throw new Error("Ollama provider not yet implemented");
    default:
      throw new ProviderNotConfiguredError(name);
  }
}
