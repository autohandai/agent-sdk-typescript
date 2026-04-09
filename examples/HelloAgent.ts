/**
 * Simple example of using the Autohand Code Agent SDK
 * 
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 * 
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   bun run examples/HelloAgent.ts
 */

import { Agent, Runner, OpenRouterProvider } from "@autohandai/agent-sdk";
import { SDKError } from "@autohandai/agent-sdk";

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const apiKey = process.env.AUTOHAND_API_KEY;
  if (!apiKey || apiKey === "your-api-key") {
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

    // Create an agent with essential tools
    const agent = new Agent(
      "Assistant",
      "You are a helpful coding assistant.",
      ["read_file", "write_file", "bash"]
    );

    // Set up the provider with validated API key
    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run the agent
    const result = await Runner.run(agent, "Say hello!");
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
