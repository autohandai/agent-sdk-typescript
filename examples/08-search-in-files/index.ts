/**
 * 08 Search in Files - Grep across a directory.
 *
 * Demonstrates how an agent uses the SEARCH_IN_FILES tool to grep for
 * a pattern across all files in a directory.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/08-search-in-files
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner } from "@autohandai/agent-sdk";
import { OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";
import { SearchInFilesTool, WriteFileTool } from "@autohandai/agent-sdk";

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
 * Main function that demonstrates search in files
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "search-example-"));

  try {
    // Write some sample files
    fs.writeFileSync(
      path.join(tmpdir, "main.ts"),
      `import { createApp } from "./app";
import { DEBUG } from "./config";

const app = createApp({ debug: DEBUG });

if (import.meta.main) {
  app.run();
}
`
    );
    fs.writeFileSync(
      path.join(tmpdir, "app.ts"),
      `export function createApp(options: { debug?: boolean } = {}) {
  const app = {
    debug: options.debug || false,
    run: () => console.log("App running"),
  };
  return app;
}
`
    );
    fs.writeFileSync(
      path.join(tmpdir, "config.ts"),
      `export const DEBUG = true;
export const DATABASE_URL = "sqlite:///dev.db";
export const SECRET_KEY = "change-me";
`
    );

    // Demonstrate direct tool usage
    const searchTool = new SearchInFilesTool();

    console.log("=== Searching for 'debug' across all files ===\n");
    const result1 = await searchTool.execute({
      query: "debug",
      path: tmpdir,
      glob: "**",
    });
    console.log(result1.data || result1.error);

    console.log("\n=== Searching for 'createApp' ===\n");
    const result2 = await searchTool.execute({
      query: "createApp",
      path: tmpdir,
      glob: "**/*.ts",
    });
    console.log(result2.data || "No matches found.");

    console.log("\n=== Searching for 'SECRET' ===\n");
    const result3 = await searchTool.execute({
      query: "SECRET",
      path: tmpdir,
      glob: "**/*.ts",
    });
    console.log(result3.data || "No matches found.");

    // Validate environment before agent-based approach
    validateEnvironment();

    // Agent-based approach
    const agent = new Agent(
      "code-auditor",
      "You are a code security auditor. Use search_in_files to look for common security issues like hardcoded secrets, debug flags, and insecure defaults. Report your findings.",
      ["search_in_files", "glob", "read_file"],
      5
    );

    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    console.log("\n=== Agent-based approach ===");
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const agentResult = await Runner.run(
        agent,
        `Search in ${tmpdir} for any hardcoded secrets, API keys, or debug settings. Report each finding with the file path and line.`
      );
      console.log(agentResult.finalOutput);
    } finally {
      process.chdir(oldCwd);
    }
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
  } finally {
    // Cleanup
    fs.rmSync(tmpdir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
