/**
 * 28 CLI Wrapper Demo - Command-line interface for Autohand Code Agent SDK.
 *
 * A CLI wrapper that demonstrates how to use the Autohand Code TypeScript SDK
 * from the command line with various operations.
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/28-cli-wrapper-demo
 *   bun run index.ts --help
 *
 * Examples:
 *   bun run index.ts chat "Explain closures"
 *   bun run index.ts analyze ./src
 *   bun run index.ts fix ./src/agent.ts
 *   bun run index.ts search "Agent" ./src
 */

import { Agent, Runner, Session, SDKError } from "@autohandai/agent-sdk";
import { OpenRouterProvider } from "@autohandai/agent-sdk";
import { DefaultToolRegistry } from "@autohandai/agent-sdk";

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

// Simple CLI argument parser
class CLIArgs {
  command: string = "";
  args: string[] = [];
  model?: string;
  provider?: string;
  maxTurns?: number;
  tools?: string[];
  workingDir?: string;

  constructor(argv: string[]) {
    const args = argv.slice(2); // Skip node/bun and script path

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const value = args[i + 1];

        switch (key) {
          case "model":
            this.model = value;
            i += 2;
            break;
          case "provider":
            this.provider = value;
            i += 2;
            break;
          case "max-turns":
            this.maxTurns = parseInt(value);
            i += 2;
            break;
          case "tools":
            this.tools = value.split(",");
            i += 2;
            break;
          case "working-dir":
            this.workingDir = value;
            i += 2;
            break;
          case "help":
            this.command = "help";
            i += 1;
            break;
          default:
            console.log(`Unknown option: ${arg}`);
            i += 1;
            break;
        }
      } else if (!this.command) {
        this.command = arg;
        i += 1;
      } else {
        this.args.push(arg);
        i += 1;
      }
    }
  }
}

class CLIApp {
  private agent: Agent;
  private session: Session;

  constructor(args: CLIArgs) {
    validateEnvironment();

    // Determine tools
    const tools = args.tools || ["read_file", "write_file", "edit_file", "bash", "glob", "search_in_files"];

    // Create agent
    this.agent = new Agent(
      "Autohand Code CLI",
      "You are a helpful AI coding assistant. Follow the user's instructions precisely and report your actions clearly.",
      tools,
      args.maxTurns || 10
    );

    // Set provider
    const provider = args.provider || "openrouter";
    const apiKey = process.env.AUTOHAND_API_KEY!;
    const model = args.model || "z-ai/glm-5.1";

    if (provider === "openrouter") {
      this.agent.setProvider(new OpenRouterProvider(apiKey, model));
    }
    // Add other providers as needed

    // Initialize session
    this.session = new Session({
      working_directory: args.workingDir || process.cwd(),
    });
  }

  async runCommand(args: CLIArgs): Promise<void> {
    const { command, args: cmdArgs } = args;

    switch (command) {
      case "help":
        this.showHelp();
        break;

      case "chat":
        await this.chat(cmdArgs);
        break;

      case "analyze":
        await this.analyze(cmdArgs);
        break;

      case "fix":
        await this.fix(cmdArgs);
        break;

      case "search":
        await this.search(cmdArgs);
        break;

      case "explain":
        await this.explain(cmdArgs);
        break;

      default:
        console.log(`Unknown command: ${command}`);
        this.showHelp();
    }
  }

  private showHelp(): void {
    console.log(`
Autohand Code CLI - Command-line interface for Autohand Code Agent SDK

Usage:
  bun run index.ts [command] [arguments] [options]

Commands:
  chat <message>              Chat with the AI agent
  analyze <path>              Analyze a directory or file
  fix <file>                  Fix issues in a file
  search <query> <path>       Search for code patterns
  explain <file>             Explain code in a file
  help                        Show this help message

Options:
  --model <name>              Model to use (default: z-ai/glm-5.1)
  --provider <name>           Provider to use (default: openrouter)
  --max-turns <number>        Maximum agent turns (default: 10)
  --tools <list>              Comma-separated tool list
  --working-dir <path>        Working directory

Examples:
  bun run index.ts chat "Explain closures in TypeScript"
  bun run index.ts analyze ./src
  bun run index.ts fix ./src/agent.ts
  bun run index.ts search "Agent" ./src
  bun run index.ts explain ./src/runner.ts

Environment Variables:
  AUTOHAND_PROVIDER            Provider to use (default: openrouter)
  AUTOHAND_API_KEY             API key for the provider
  AUTOHAND_MODEL               Model to use

For more information, visit: https://github.com/autohand/agentsdk
    `);
  }

  private async chat(args: string[]): Promise<void> {
    const message = args.join(" ");
    if (!message) {
      console.log("Error: Please provide a message");
      return;
    }

    console.log(`💬 Chat: ${message}\n`);

    try {
      const result = await Runner.run(this.agent, message);
      console.log(`\n🤖 Response:\n${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`\n❌ SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }

  private async analyze(args: string[]): Promise<void> {
    const path = args[0];
    if (!path) {
      console.log("Error: Please provide a path to analyze");
      return;
    }

    console.log(`🔍 Analyzing: ${path}\n`);

    try {
      const result = await Runner.run(
        this.agent,
        `Analyze the code at ${path}. Identify any issues, bugs, or improvements. Provide a detailed report.`
      );
      console.log(`\n🤖 Analysis:\n${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`\n❌ SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }

  private async fix(args: string[]): Promise<void> {
    const file = args[0];
    if (!file) {
      console.log("Error: Please provide a file to fix");
      return;
    }

    console.log(`🔧 Fixing: ${file}\n`);

    try {
      const result = await Runner.run(
        this.agent,
        `Read the file ${file}, identify any bugs or issues, and fix them using the edit_file tool. Report all changes made.`
      );
      console.log(`\n🤖 Fix result:\n${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`\n❌ SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }

  private async search(args: string[]): Promise<void> {
    const query = args[0];
    const path = args[1] || ".";
    if (!query) {
      console.log("Error: Please provide a search query");
      return;
    }

    console.log(`🔎 Searching for "${query}" in ${path}\n`);

    try {
      const result = await Runner.run(
        this.agent,
        `Search for "${query}" in ${path} using the search_in_files tool. Report all matches with file paths and line numbers.`
      );
      console.log(`\n🤖 Search results:\n${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`\n❌ SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }

  private async explain(args: string[]): Promise<void> {
    const file = args[0];
    if (!file) {
      console.log("Error: Please provide a file to explain");
      return;
    }

    console.log(`📚 Explaining: ${file}\n`);

    try {
      const result = await Runner.run(
        this.agent,
        `Read the file ${file} and explain what it does. Break down the code structure, key functions, and any important patterns.`
      );
      console.log(`\n🤖 Explanation:\n${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`\n❌ SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = new CLIArgs(process.argv);
  const app = new CLIApp(args);

  try {
    await app.runCommand(args);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Error: ${errorMessage}`);
    process.exit(1);
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
