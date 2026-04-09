/**
 * 07 Find and Glob - Discovering files in a directory.
 *
 * Demonstrates how an agent can use the FIND and GLOB tools to discover
 * files matching patterns. Useful for code exploration and inventory tasks.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/07-find-and-glob
 *   bun run index.ts
 */

import * as path from "path";
import { Agent, Runner } from "@autohandai/agent-sdk";
import { OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";
import { FindTool, GlobTool } from "@autohandai/agent-sdk";

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
 * Main function that demonstrates file discovery tools
 */
async function main(): Promise<void> {
  try {
    // Use the SDK's own source tree as a playground
    const searchPath = path.resolve(__dirname, "../../../src");

    console.log(`Searching in: ${searchPath}\n`);

    // GLOB: Find all TypeScript files
    console.log("--- GLOB *.ts (recursive) ---");
    const globTool = new GlobTool();
    const globResult = await globTool.execute({
      pattern: "**/*.ts",
      path: searchPath,
    });
    console.log(globResult.data || globResult.error);
    console.log();

    // GLOB: Find __init__.py files (if any)
    console.log("--- GLOB **/__init__.py ---");
    const globResult2 = await globTool.execute({
      pattern: "**/__init__.py",
      path: searchPath,
    });
    console.log(globResult2.data || globResult2.error);
    console.log();

    // FIND: Find files containing "provider" in the name
    console.log("--- FIND 'provider' ---");
    const findTool = new FindTool();
    const findResult = await findTool.execute({
      pattern: "provider",
      path: searchPath,
    });
    console.log(findResult.data || findResult.error);

    // Validate environment before agent-based approach
    validateEnvironment();

    // Agent-based approach
    const agent = new Agent(
      "file-explorer",
      "You are a file exploration agent. Use the find and glob tools to discover TypeScript files in the directory specified by the user. Report all file paths you find.",
      ["find", "glob"],
      5
    );

    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    console.log("\n--- Agent-based approach ---");
    const agentResult = await Runner.run(
      agent,
      `Use glob to find all .ts files recursively in ${searchPath}, then use find to locate any files with 'config' in the name. Summarize what you found.`
    );
    console.log(agentResult.finalOutput);
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
