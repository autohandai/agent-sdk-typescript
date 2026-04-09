/**
 * 13 Permissions YOLO - Auto-approving all tool calls.
 *
 * Demonstrates the YOLO permission mode where all tool calls are
 * automatically approved without user interaction.
 *
 * Usage:
 *   cd examples/13-permissions-yolo
 *   bun run index.ts
 */

import { PermissionManager, PermissionMode } from "@autohandai/agent-sdk";

/**
 * Main function that demonstrates permission modes
 */
function main(): void {
  try {
    // YOLO mode: auto-approve everything
    console.log("=== YOLO Permission Mode ===");
    const yolo = new PermissionManager(PermissionMode.YOLO);
    console.log(`  Mode: ${yolo.mode}`);
    console.log(`  Should approve: ${yolo.shouldApprove()}`);
    console.log(`  Prompt approval result: ${yolo.shouldApprove()}`);
    console.log();

    // ASK mode: would prompt user (returns False in non-interactive MVP)
    console.log("=== ASK Permission Mode ===");
    const ask = new PermissionManager(PermissionMode.ASK);
    console.log(`  Mode: ${ask.mode}`);
    console.log(`  Should approve: ${ask.shouldApprove()}`);
    console.log();

    // DENY mode: block everything
    console.log("=== DENY Permission Mode ===");
    const deny = new PermissionManager(PermissionMode.DENY);
    console.log(`  Mode: ${deny.mode}`);
    console.log(`  Should approve: ${deny.shouldApprove()}`);
    console.log();

    // Default mode (no argument) is YOLO
    console.log("=== Default (no mode specified) ===");
    const defaultManager = new PermissionManager();
    console.log(`  Mode: ${defaultManager.mode}`);
    console.log(`  Should approve: ${defaultManager.shouldApprove()}`);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
