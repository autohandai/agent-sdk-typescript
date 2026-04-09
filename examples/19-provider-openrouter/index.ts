/**
 * 19 Provider: OpenRouter - Direct OpenRouter provider with custom model selection.
 *
 * Demonstrates configuring the SDK to use OpenRouter with a specific model.
 * OpenRouter provides access to many models through a single API.
 *
 * Prerequisites:
 * - Set OPENROUTER_API_KEY environment variable
 *
 * Usage:
 *   export OPENROUTER_API_KEY=your-openrouter-key-here
 *   cd examples/19-provider-openrouter
 *   bun run index.ts
 */

import { Agent, Runner, OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "your-openrouter-key-here") {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is required. " +
      "Get a key at https://openrouter.ai/keys"
    );
  }
}

/**
 * Main function that demonstrates OpenRouter provider usage
 */
async function main(): Promise<void> {
  try {
    validateEnvironment();

    const provider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!, "anthropic/claude-3-haiku");
    console.log("Provider type: OpenRouterProvider");
    console.log(`Model: anthropic/claude-3-haiku`);

    const agent = new Agent(
      "assistant",
      "You are a creative writing assistant.",
      [],
      3
    );

    agent.setProvider(provider);
    agent.setModel("anthropic/claude-3-haiku");

    console.log("\nRunning with OpenRouter provider (claude-3-haiku)...");
    const result = await Runner.run(
      agent,
      "Write a 3-line poem about a compiler at sunset."
    );
    console.log(result.finalOutput);
  } catch (error) {
    if (error instanceof SDKError) {
      console.error(`SDK Error: ${error.message}`);
      if (error.context) {
        console.error(`Context: ${JSON.stringify(error.context)}`);
      }
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
