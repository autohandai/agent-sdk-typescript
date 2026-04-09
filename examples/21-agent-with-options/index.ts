/**
 * 21 Agent with Options - Full Agent configuration with AgentOptions.
 *
 * Demonstrates building an Agent with all configuration parameters:
 * name, instructions, tools, model, max_turns, and AgentOptions.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/21-agent-with-options
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner, SDKError } from "@autohandai/agent-sdk";
import { OpenRouterProvider } from "@autohandai/agent-sdk";

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
 * Main function that demonstrates agent configuration
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-options-"));

  try {
    validateEnvironment();

    // Create a fully configured agent
    const agent = new Agent(
      "code-reviewer",
      "You are a senior code reviewer. Analyze TypeScript code for bugs, security issues, and style problems. Be specific about what is wrong and suggest fixes. Reference specific line numbers if possible.",
      ["read_file", "glob", "bash"],
      5
    );

    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Print the agent configuration
    console.log("Agent Configuration:");
    console.log(`  Name:          ${agent.name}`);
    console.log(`  Instructions:  ${agent.instructions.substring(0, 80)}...`);
    console.log(`  Tools:         ${agent.tools.join(", ")}`);
    console.log(`  Max turns:     ${agent.maxTurns}`);
    console.log();

    // Get AgentOptions from the agent
    const config = agent.getConfig();
    console.log(`AgentOptions:`);
    console.log(`  tools:         ${config.tools.join(", ")}`);
    console.log(`  maxTurns:      ${config.maxTurns}`);
    console.log();

    // Create a code sample to review
    fs.writeFileSync(
      path.join(tmpdir, "buggy.ts"),
      `function processData(data: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    result.push(data[i] * 2);
  }
  return result;
}

function connectDb(host: string, port: number, password: string): { connected: boolean } {
  // In production, this would connect to a real database
  console.log(\`Connecting to \${host}:\${port} with password \${password}\`);
  return { connected: true };
}

const SECRET_KEY = "my-super-secret-key-123";
const DB_PASSWORD = "admin123";

if (import.meta.main) {
  console.log(processData([1, 2, 3, 4, 5]));
  connectDb("localhost", 5432, DB_PASSWORD);
}
`
    );

    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const result = await Runner.run(
        agent,
        "Review the code in buggy.ts. Identify all issues and suggest fixes."
      );
      console.log("Result:");
      console.log(result.finalOutput);
      console.log(`\nTurns used: ${result.turns}`);
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
