/**
 * 11 Sessions Save/Load - Persisting and restoring conversations.
 *
 * Demonstrates creating a Session, adding messages, saving to JSON,
 * and loading it back. Sessions capture the full conversation history.
 *
 * Usage:
 *   cd examples/11-sessions-save-load
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Session } from "@autohandai/agent-sdk";

/**
 * Main function that demonstrates session persistence
 */
function main(): void {
  // Create a session and add messages
  const session = new Session({
    working_directory: "/tmp/my-project",
  });

  session.addUserMessage("How do I write a hello world in Python?");
  session.addAssistantMessage("Use the `print()` function: print('Hello, World!')");
  session.addUserMessage("What about in Go?");
  session.addAssistantMessage('In Go: fmt.Println("Hello, World!")');

  console.log(`Session ID: ${session.id}`);
  console.log(`Working directory: ${session.workingDirectory}`);
  console.log(`Created at: ${session.createdAt}`);
  console.log(`Message count: ${session.messages.length}`);
  console.log();

  // Save to a temp file
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "session-example-"));
  try {
    const sessionPath = path.join(tmpdir, "my_session.json");

    console.log(`Saving session to: ${sessionPath}`);
    session.save(sessionPath);

    // Read and display the saved JSON
    console.log(`\nSaved session contents:`);
    console.log(fs.readFileSync(sessionPath, "utf-8"));

    // Load the session back
    console.log(`\nLoading session from: ${sessionPath}`);
    const loaded = Session.load(sessionPath);

    console.log(`Loaded session ID: ${loaded.id}`);
    console.log(`Message count: ${loaded.messages.length}`);
    console.log();
    console.log("Conversation history:");
    for (const msg of loaded.messages) {
      const roleLabel = msg.role.toUpperCase();
      console.log(`  [${roleLabel}] ${msg.content.substring(0, 80)}`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
