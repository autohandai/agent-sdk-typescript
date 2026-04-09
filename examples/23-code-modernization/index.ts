/**
 * 23 Code Modernization - Modernize legacy TypeScript code.
 *
 * A real-world example of an agent that modernizes legacy TypeScript code by:
 * - Identifying outdated patterns (e.g., old string formatting, deprecated imports)
 * - Suggesting modern alternatives
 * - Creating updated versions of files
 * - Generating migration guides
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/23-code-modernization
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
 * Create a sample legacy TypeScript project with outdated patterns
 */
function createLegacyProject(tmpdir: string): void {

  // Legacy module with outdated patterns
  fs.writeFileSync(
    path.join(tmpdir, "legacy-utils.ts"),
    `// Legacy utility functions - needs modernization
import * as fs from "fs";
import * as path from "path";

function processData(dataList: any[]): string {
  // Old string formatting
  const result = "Processing " + dataList.length + " items: " + JSON.stringify(dataList);

  // Using path.join in verbose way
  const configPath = path.join(process.cwd(), "config.txt");

  // Old exception handling
  let config = "";
  try {
    config = fs.readFileSync(configPath, 'utf-8');
  } catch (e: any) {
    console.log("Error reading config: " + e.message);
  }

  // Using forEach where map would be better
  const numbers = [1, 2, 3, 4, 5];
  const doubled: number[] = [];
  numbers.forEach((n) => doubled.push(n * 2));

  return result;
}

class OldStyleClass {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }
}
`
  );

  // Legacy test file
  fs.writeFileSync(
    path.join(tmpdir, "test-legacy.ts"),
    `import { processData, OldStyleClass } from "./legacy-utils";

const data = [1, 2, 3];
console.log(processData(data));

const obj = new OldStyleClass("test");
console.log(obj.getName());
`
  );

  // Package.json with old versions
  fs.writeFileSync(
    path.join(tmpdir, "package.json"),
    JSON.stringify({
      name: "legacy-project",
      version: "1.0.0",
      dependencies: {
        typescript: "^3.9.0",
        lodash: "^4.17.0",
      },
    }, null, 2)
  );
}

/**
 * Main function that demonstrates code modernization
 */
async function main(): Promise<void> {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "modernization-example-"));

  try {
    validateEnvironment();

    // Create legacy project
    createLegacyProject(tmpdir);
    console.log(`Created legacy project in: ${tmpdir}`);

    // Code modernization agent
    const modernizer = new Agent(
      "Code Modernizer",
      `You are a TypeScript code modernization expert. Your task:

1. Analyze legacy TypeScript code for outdated patterns:
   - Old string formatting (concatenation) -> template literals
   - Verbose code that can be simplified
   - Old-style classes without proper TypeScript features
   - forEach where map/filter/reduce would be better
   - Old dependency versions in package.json

2. Create modernized versions with:
   - Template literal formatting
   - Modern array methods (map, filter, reduce)
   - TypeScript class features (access modifiers, readonly)
   - Modern dependency versions

3. Generate a MIGRATION.md file explaining changes

4. Update package.json with modern dependency versions

Use read_file to examine code, write_file to create modernized versions,
and edit_file to make targeted improvements. Be thorough but practical.`,
      ["read_file", "write_file", "edit_file", "glob", "bash"],
      20
    );

    modernizer.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Run modernization
    const oldCwd = process.cwd();
    process.chdir(tmpdir);
    try {
      const result = await Runner.run(
        modernizer,
        `Modernize this legacy TypeScript project:

1. First, glob for all TypeScript files and read each one
2. Identify outdated patterns and create modernized versions
3. Create a MIGRATION.md file explaining all changes made
4. Update package.json with current package versions
5. Test that the modernized code still compiles with tsc

Focus on practical improvements that maintain functionality while modernizing style.`
      );
      console.log("\n" + "=".repeat(60));
      console.log("CODE MODERNIZATION RESULTS");
      console.log("=".repeat(60));
      console.log(result.finalOutput);

      // Show created files
      console.log("\n" + "=".repeat(60));
      console.log("FILES CREATED/MODIFIED");
      console.log("=".repeat(60));
      const files = fs.readdirSync(tmpdir);
      for (const file of files) {
        console.log(`  ${file}`);
      }
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
