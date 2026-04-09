/**
 * 22 Sequential Agent Pipeline - Multi-agent orchestration.
 *
 * Two agents chained together: one investigates (reads and analyzes code),
 * the second implements (writes the fix). Demonstrates multi-agent
 * coordination with shared state via Session.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/22-sequential-agent-pipeline
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Agent, Runner, Session, SDKError } from "@autohandai/agent-sdk";
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
 * Run the investigator agent and return findings
 */
async function runInvestigator(agent: Agent, prompt: string): Promise<string> {
  const result = await Runner.run(agent, prompt);
  return result.finalOutput;
}

/**
 * Run the implementer agent with the investigation findings
 */
async function runImplementer(agent: Agent, prompt: string): Promise<string> {
  const result = await Runner.run(agent, prompt);
  return result.finalOutput;
}

/**
 * Main function that demonstrates sequential agent pipeline
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-example-"));

  try {
    // Create a project with a known issue
    fs.writeFileSync(
      path.join(tmpdir, "utils.ts"),
      `function parseCsv(text: string): Record<string, string>[] {
  /** Parse a CSV string into a list of dicts. */
  const lines = text.trim().split('\\n');
  const headers = lines[0].split(',');
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]; // Bug: no handling for different line lengths
    }
    result.push(row);
  }
  return result;
}
`
    );

    validateEnvironment();

    // Agent 1: Investigator - reads code, finds issues
    const investigator = new Agent(
      "investigator",
      "You are a code investigator. Read source files, analyze them, and produce a detailed bug report. Your output should include: 1. The specific bugs found, 2. The file and line numbers affected, 3. A description of what the correct code should do. Format your report clearly so another agent can implement the fix.",
      ["read_file", "glob"],
      4
    );

    investigator.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Agent 2: Implementer - creates and applies fixes
    const implementer = new Agent(
      "implementer",
      "You are a code implementer. Given a bug report and source file content, produce the corrected version of the file. Write the complete corrected file content. Be sure to fix ALL bugs identified in the report.",
      ["read_file", "write_file"],
      3
    );

    implementer.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    const oldCwd = process.cwd();
    process.chdir(tmpdir);

    try {
      // Stage 1: Investigate
      console.log("=== Stage 1: Investigation ===");
      const findings = await runInvestigator(
        investigator,
        "Read utils.ts and identify all bugs and issues. Provide a detailed report of what is wrong and what needs to be fixed."
      );
      console.log(findings);
      console.log();

      // Stage 2: Implement (using investigation findings as context)
      console.log("=== Stage 2: Implementation ===");
      const task = `Based on this investigation report:\n\n${findings}\n\nRead utils.ts and produce the corrected version of the file. Write the complete corrected content.`;
      const implementation = await runImplementer(implementer, task);
      console.log(implementation);
      console.log();
    } finally {
      process.chdir(oldCwd);
    }

    // Demonstrate session sharing concept
    console.log("=== Session Sharing ===");
    const sharedSession = new Session({
      messages: [
        { role: "user", content: "Fix the CSV parser in utils.ts" },
        { role: "assistant", content: "Investigating... found: no bounds checking" },
      ],
      working_directory: tmpdir,
    });
    console.log(`Shared session has ${sharedSession.messages.length} messages`);
    console.log(`Working directory: ${sharedSession.workingDirectory}`);
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
