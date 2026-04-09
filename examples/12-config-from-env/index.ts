/**
 * 12 Config from Environment - Loading SDK configuration via env vars.
 *
 * Demonstrates how to configure the SDK using environment variables
 * and then use loadConfig() to pick them up.
 *
 * Prerequisites:
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_MODEL environment variable (optional)
 *
 * Usage:
 *   export AUTOHAND_PROVIDER=openrouter
 *   export AUTOHAND_API_KEY=your-api-key
 *   export AUTOHAND_MODEL=z-ai/glm-5.1
 *   cd examples/12-config-from-env
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { loadConfig, config } from "@autohandai/agent-sdk";

/**
 * Main function that demonstrates configuration loading
 */
function main(): void {
  // Load configuration --- env vars take priority over file config
  const loadedConfig = loadConfig();

  console.log("Config loaded from environment variables:");
  console.log(`  Provider:    ${loadedConfig.provider}`);
  console.log(`  Model:       ${loadedConfig.model}`);
  console.log(`  API Key:     ${loadedConfig.apiKey?.substring(0, 10)}...` || "  API Key:     (not set)");
  console.log(`  Max turns:   ${loadedConfig.maxTurns}`);
  console.log();

  // Config.save() writes to a JSON file
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "config-example-"));
  try {
    const configPath = path.join(tmpdir, "config.json");

    console.log(`Saving config to: ${configPath}`);
    loadedConfig.save(configPath);

    // Verify by reading the file
    console.log(`\nSaved config file contents:`);
    console.log(fs.readFileSync(configPath, "utf-8"));

    // Clean up
    fs.unlinkSync(configPath);

    // Demonstrate programmatic config
    console.log("\n--- Programmatic config ---");
    const config2 = config();
    config2.setProvider("openai", "sk-test-key");
    config2.setModel("gpt-4o");
    console.log(`  Provider:  ${config2.provider}`);
    console.log(`  Model:     ${config2.model}`);
    console.log(`  API Key:   ${config2.apiKey}`);
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
