/**
 * 09 Git Status Workflow - Inspecting repository state.
 *
 * Demonstrates how an agent can inspect git status, diff, and log to
 * understand the current state of a repository and create a summary report.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/09-git-status-workflow
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
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
 * Main function that demonstrates git workflow
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "git-example-"));

  try {
    // Initialize a git repo with some content
    execSync("git init -q", { cwd: tmpdir, stdio: "pipe" });
    execSync("git config user.email 'test@test.com'", { cwd: tmpdir, stdio: "pipe" });
    execSync("git config user.name 'Test'", { cwd: tmpdir, stdio: "pipe" });
    fs.writeFileSync(path.join(tmpdir, "README.md"), "# My Project\n");
    fs.writeFileSync(path.join(tmpdir, "app.ts"), "function hello(): string { return 'world'; }\n");
    execSync("git add -A", { cwd: tmpdir, stdio: "pipe" });
    execSync("git commit -q -m 'Initial commit'", { cwd: tmpdir, stdio: "pipe" });

    // Make some uncommitted changes
    fs.writeFileSync(path.join(tmpdir, "app.ts"), "function hello(): string { return 'hello world'; }\n");
    fs.writeFileSync(path.join(tmpdir, "TODO.md"), "- Add tests\n- Add docs\n");

    // Demonstrate direct git tool usage via bash
    console.log("=== Git status ===");
    try {
      const status = execSync("git status", { cwd: tmpdir, encoding: "utf-8" });
      console.log(status);
    } catch (error) {
      console.log("Error running git status");
    }

    console.log("\n=== Git diff ===");
    try {
      const diff = execSync("git diff", { cwd: tmpdir, encoding: "utf-8" });
      console.log(diff);
    } catch (error) {
      console.log("Error running git diff");
    }

    console.log("\n=== Git log (last 3 commits) ===");
    try {
      const log = execSync("git log --oneline -3", { cwd: tmpdir, encoding: "utf-8" });
      console.log(log);
    } catch (error) {
      console.log("Error running git log");
    }

    // Validate environment before agent-based approach
    validateEnvironment();

    // Agent-based approach
    const agent = new Agent(
      "git-inspector",
      "You are a git repository inspector agent. Use the bash tool to run git commands and report on the repository's status. Check git status, recent log entries, and any uncommitted diffs. Provide a clear summary of the current state.",
      ["bash", "git_status", "git_diff", "git_log"],
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
        "Check the git status of this repository. Run git status, git log --oneline -5, and git diff. Summarize the state."
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
