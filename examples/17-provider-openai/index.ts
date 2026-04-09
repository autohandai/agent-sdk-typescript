/**
 * 17 Provider: OpenAI - Direct OpenAI provider configuration.
 *
 * Demonstrates configuring the SDK to use OpenAI directly (not via env
 * vars), using the ProviderFactory with explicit API key.
 *
 * Prerequisites:
 * - Set OPENAI_API_KEY environment variable
 *
 * Usage:
 *   export OPENAI_API_KEY=your-openai-key-here
 *   cd examples/17-provider-openai
 *   bun run index.ts
 */

import { Agent, Runner, OpenAIProvider, SDKError } from "@autohandai/agent-sdk";

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your-openai-key-here") {
    throw new Error(
      "OPENAI_API_KEY environment variable is required. " +
      "Get a key at https://platform.openai.com/api-keys"
    );
  }
}

/**
 * Main function that demonstrates OpenAI provider usage
 */
async function main(): Promise<void> {
  try {
    validateEnvironment();

    const agent = new Agent(
      "assistant",
      "You are a concise, helpful assistant.",
      [],
      3
    );

    agent.setProvider(
      new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY!, model: "gpt-4o" })
    );

    console.log("Running with OpenAI provider (gpt-4o)...");
    const result = await Runner.run(
      agent,
      "What is a closure in TypeScript? Explain in 2 sentences."
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
