/**
 * 03 Code Reviewer Agent - An agent that reads and analyzes files.
 *
 * Give an agent file access tools and it can explore your codebase.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/03-code-reviewer-agent
 *   bun run index.ts
 */

import { Agent, Runner } from "@autohandai/agent-sdk";
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
 * Main function that creates and runs a code reviewer agent
 */
async function main(): Promise<void> {
  try {
    // Validate environment
    validateEnvironment();

    const agent = new Agent(
      "Code Reviewer",
      "You are a senior TypeScript engineer. Read code files, identify bugs, and suggest improvements. Be specific about file and line numbers.",
      ["read_file", "glob", "search_in_files"],
      15
    );

    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    const result = await Runner.run(
      agent,
      "What TypeScript files are in the current directory? Read each one and report any issues."
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
