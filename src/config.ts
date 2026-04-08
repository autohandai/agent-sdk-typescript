/**
 * Configuration for the Autohand Agents SDK.
 * Loads configuration from environment variables.
 */

export interface Config {
  provider: string;
  apiKey?: string;
  model: string;
  baseUrl?: string;
}

/**
 * Load configuration from environment variables.
 */
export function loadConfig(): Config {
  return {
    provider: process.env.AUTOHAND_PROVIDER || "openrouter",
    apiKey: process.env.AUTOHAND_API_KEY,
    model: process.env.AUTOHAND_MODEL || "your-modelcard-id-here",
    baseUrl: process.env.AUTOHAND_BASE_URL,
  };
}

/**
 * Default configuration instance.
 */
export const config = loadConfig();
