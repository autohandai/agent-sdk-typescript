/**
 * 06 Patch Application - Apply unified diffs to files programmatically.
 *
 * The APPLY_PATCH tool lets agents make surgical changes using unified diff
 * format — safer than raw edits for multi-line changes.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/06-patch-application
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner } from "@autohandai/agent-sdk";
import { OpenRouterProvider, SDKError } from "@autohandai/agent-sdk";
import { WriteFileTool, ApplyPatchTool } from "@autohandai/agent-sdk";
import { ToolRegistry } from "@autohandai/agent-sdk";

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
 * Main function that demonstrates patch application
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "patch-example-"));

  try {
    // Create a buggy file
    const buggyFile = path.join(tmpdir, "calculator.ts");
    fs.writeFileSync(
      buggyFile,
      `function add(a: number, b: number): number {
  return a - b; // Bug: should be a + b
}

function subtract(a: number, b: number): number {
  return a - b;
}

function multiply(a: number, b: number): number {
  return a / b; // Bug: should be a * b
}
`
    );

    // Create a tool registry for direct tool execution
    const toolRegistry = new ToolRegistry();

    console.log("=== Before patch ===");
    console.log(fs.readFileSync(buggyFile, "utf-8"));

    // Unified diff patch that fixes both bugs
    const patch = `--- a/calculator.ts
+++ b/calculator.ts
@@ -1,9 +1,9 @@
 function add(a: number, b: number): number {
-  return a - b; // Bug: should be a + b
+  return a + b;
 
 function subtract(a: number, b: number): number {
   return a - b;
 
 function multiply(a: number, b: number): number {
-  return a / b; // Bug: should be a * b
+  return a * b;
`;

    console.log("=== Applying patch ===");
    const applyPatchTool = new ApplyPatchTool();
    const result = await applyPatchTool.execute({
      file_path: "calculator.ts",
      patch: patch,
      work_dir: tmpdir,
    });

    if (result.error) {
      console.log(`Patch error: ${result.error}`);
    } else {
      console.log(`Patch result: ${result.data}`);
      console.log(`\n=== After patch ===`);
      console.log(fs.readFileSync(buggyFile, "utf-8"));
    }

    // Validate environment before agent-based approach
    validateEnvironment();

    // Agent-based approach
    const agent = new Agent(
      "patch-fixer",
      "You are a code fix agent. Apply unified diff patches to fix bugs in files using the apply_patch tool. Also use write_file to create files and read_file to verify changes.",
      ["apply_patch", "write_file", "read_file"],
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
        "Create a file called greeting.ts with: function greet(name: string): string { return `Hello, ${name}`; }\nThen apply this patch:\n--- a/greeting.ts\n+++ b/greeting.ts\n@@ -1,2 +1,3 @@\n function greet(name: string): string {\n-  return `Hello, ${name}`;\n+  return `Good morning, ${name}!`;\n+\n\nRead the file to verify."
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
