/**
 * 02 Streaming Query - See the agent response as it arrives.
 *
 * Note: The TypeScript SDK currently does not support streaming responses.
 * This example is included for API parity with the Python SDK.
 * Use Runner.run() for non-streaming responses.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/02-streaming-query
 *   bun run index.ts
 */

import { Agent, Runner, DefaultToolRegistry } from "@autohandai/agent-sdk";
import { OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const apiKey = process.env.AUTOHAND_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error(
      "AUTOHAND_API_KEY environment variable is required. " +
      "Please set it with: export AUTOHAND_API_KEY=your-api-key"
    );
  }
}

/**
 * Main function that creates and runs an agent
 */
async function main(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();

    // Create an agent with all available tools
    const agent = new Agent(
      "Assistant",
      "You are a helpful coding assistant.",
      DefaultToolRegistry.getAll()
    );

    // Set up the provider with validated API key
    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run the agent (non-streaming in TypeScript SDK)
    const result = await Runner.run(agent, "Explain closures in one sentence");
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
