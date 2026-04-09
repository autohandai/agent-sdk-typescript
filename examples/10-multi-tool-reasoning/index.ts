/**
 * 10 Multi-Tool Reasoning - Using multiple tools across turns.
 *
 * Demonstrates an agent that uses READ_FILE and BASH together across
 * multiple turns to understand code, run tests, and report a summary.
 * Shows the ReAct loop with multi-tool turns.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/10-multi-tool-reasoning
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner } from "@autohandai/agent-sdk";
import { OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";
import { ReadFileTool, WriteFileTool } from "@autohandai/agent-sdk";
import { BashTool } from "@autohandai/agent-sdk";

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
 * Main function that demonstrates multi-tool reasoning
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "multi-tool-example-"));

  try {
    // Create a small project with a module and a test
    fs.writeFileSync(
      path.join(tmpdir, "math-utils.ts"),
      `export function fibonacci(n: number): number {
  /** Return the nth Fibonacci number. */
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

export function factorial(n: number): number {
  /** Return n factorial. */
  if (n < 0) {
    throw new Error("factorial undefined for negative numbers");
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
`
    );
    fs.writeFileSync(
      path.join(tmpdir, "test-math-utils.ts"),
      `import { fibonacci, factorial } from "./math-utils";

function testFibonacci(): void {
  console.assert(fibonacci(0) === 0);
  console.assert(fibonacci(1) === 1);
  console.assert(fibonacci(5) === 5);
  console.assert(fibonacci(10) === 55);
  console.log("Fibonacci tests passed");
}

function testFactorial(): void {
  console.assert(factorial(0) === 1);
  console.assert(factorial(5) === 120);
  console.assert(factorial(10) === 3628800);
  console.log("Factorial tests passed");
}

testFibonacci();
testFactorial();
`
    );
    fs.writeFileSync(path.join(tmpdir, "package.json"), `{ "name": "test-project", "type": "module" }\n`);

    // Demonstrate direct tool execution
    const readTool = new ReadFileTool();
    const bashTool = new BashTool();

    console.log("=== Step 1: Read the source file ===");
    const readResult = await readTool.execute({
      file_path: "math-utils.ts",
      work_dir: tmpdir,
    });
    const data = readResult.data;
    console.log(`Result: ${data?.substring(0, 200)}...` || `Error: ${readResult.error}`);

    console.log("\n=== Step 2: Run the tests ===");
    const testResult = await bashTool.execute({
      command: "bun run test-math-utils.ts",
      working_directory: tmpdir,
    });
    console.log(testResult.data || testResult.error);

    // Validate environment before agent-based approach
    validateEnvironment();

    // Agent-based approach: READ_FILE + BASH across turns
    const agent = new Agent(
      "code-analyst",
      "You are a code analyst agent. Your job is to read source files, understand the code, run tests, and report a summary. Use read_file to examine code and bash to run commands. After reading files, run the tests and report whether they pass.",
      ["read_file", "bash", "glob"],
      6
    );

    agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    console.log("\n=== Agent-based multi-tool approach ===");
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const agentResult = await Runner.run(
        agent,
        "First, glob for all TypeScript files in this directory. Then read each TypeScript file. Finally, run `bun run test-math-utils.ts` and report the test results. Summarize the codebase."
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
