/**
 * 27 Simple Chat App - Interactive chat interface with Autohand Code Agent SDK.
 *
 * A simple chat application that demonstrates:
 * - Interactive chat loop with an AI agent
 * - Session management and conversation history
 * - Tool usage for file operations and command execution
 * - Streaming-like responses (simulated for TypeScript SDK)
 *
 * Prerequisites:
 * - Set AUTOHAND_API_KEY environment variable
 * - Set AUTOHAND_PROVIDER environment variable (default: openrouter)
 *
 * Usage:
 *   export AUTOHAND_API_KEY=your-api-key
 *   cd examples/27-simple-chat-app
 *   bun run index.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";
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

class ChatApp {
  private agent: Agent;
  private session: Session;
  private rl: readline.Interface;

  constructor() {

    validateEnvironment();

    // Create agent with tools for file operations and command execution
    this.agent = new Agent(
      "Autohand Code Assistant",
      `You are a helpful AI coding assistant powered by Autohand Code. 
You can help users with:
- Reading and editing files
- Running commands and scripts
- Searching through codebases
- Git operations
- General programming questions

Be concise, helpful, and always explain your actions clearly.
When you use tools, report what you're doing and the results.`,
      ["read_file", "write_file", "edit_file", "bash", "glob", "search_in_files", "git_status", "git_diff"],
      10
    );

    this.agent.setProvider(
      new OpenRouterProvider(
        process.env.AUTOHAND_API_KEY!,
        "z-ai/glm-5.1"
      )
    );

    // Initialize session
    this.session = new Session({
      working_directory: process.cwd(),
    });

    // Setup readline interface for interactive input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private displayWelcome(): void {
    console.log("\n" + "=".repeat(60));
    console.log("  Autohand Code - Simple Chat App");
    console.log("=".repeat(60));
    console.log("\nAvailable commands:");
    console.log("  Type your message to chat with the agent");
    console.log("  '/clear' - Clear conversation history");
    console.log("  '/exit' - Exit the chat");
    console.log("  '/save [filename]' - Save conversation to file");
    console.log("  '/load [filename]' - Load conversation from file");
    console.log("  '/history' - Show conversation history");
    console.log("\nThe agent has access to: read_file, write_file, bash, glob, search_in_files, git");
    console.log("\n" + "=".repeat(60) + "\n");
  }

  private async handleCommand(input: string): Promise<boolean> {
    const parts = input.trim().split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "/clear":
        this.session = new Session({
          working_directory: this.session.workingDirectory,
        });
        console.log("✓ Conversation history cleared");
        return true;

      case "/exit":
        console.log("Goodbye!");
        return false;

      case "/save":
        if (args.length === 0) {
          console.log("Usage: /save [filename]");
          return true;
        }
        const savePath = path.join(process.cwd(), args[0]);
        this.session.save(savePath);
        console.log(`✓ Conversation saved to ${savePath}`);
        return true;

      case "/load":
        if (args.length === 0) {
          console.log("Usage: /load [filename]");
          return true;
        }
        const loadPath = path.join(process.cwd(), args[0]);
        try {
          this.session = Session.load(loadPath);
          console.log(`✓ Conversation loaded from ${loadPath}`);
        } catch (error) {
          console.log(`✗ Failed to load conversation: ${error}`);
        }
        return true;

      case "/history":
        console.log("\n--- Conversation History ---");
        for (const msg of this.session.messages) {
          const role = msg.role.toUpperCase();
          console.log(`[${role}] ${msg.content}`);
        }
        console.log("--- End of History ---\n");
        return true;

      default:
        console.log(`Unknown command: ${command}`);
        return true;
    }
  }

  private async processMessage(userMessage: string): Promise<void> {
    // Add user message to session
    this.session.addUserMessage(userMessage);

    console.log("\n🤖 Assistant is thinking...");

    try {
      // Run the agent with the current session context
      const result = await Runner.run(this.agent, userMessage);

      // Add assistant response to session
      this.session.addAssistantMessage(result.finalOutput);

      // Display the response
      console.log(`\n💬 ${result.finalOutput}`);
      console.log(`\n📊 Turns used: ${result.turns}`);
    } catch (error) {
      if (error instanceof SDKError) {
        const errorMessage = error.message;
        console.log(`\n❌ SDK Error: ${errorMessage}`);
        if (error.context) {
          console.log(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`\n❌ Error: ${errorMessage}`);
      }
      this.session.addAssistantMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log("\n" + "-".repeat(60));
  }

  private async chatLoop(): Promise<void> {
    this.displayWelcome();

    while (true) {
      const input = await new Promise<string>((resolve) => {
        this.rl.question("💬 You: ", resolve);
      });

      const trimmedInput = input.trim();

      // Skip empty input
      if (!trimmedInput) {
        continue;
      }

      // Handle commands
      if (trimmedInput.startsWith("/")) {
        const shouldContinue = await this.handleCommand(trimmedInput);
        if (!shouldContinue) {
          break;
        }
        continue;
      }

      // Process regular message
      await this.processMessage(trimmedInput);
    }

    this.rl.close();
  }

  async start(): Promise<void> {
    try {
      await this.chatLoop();
    } catch (error) {
      if (error instanceof SDKError) {
        console.error(`Fatal SDK Error: ${error.message}`);
        if (error.context) {
          console.error(`Context: ${JSON.stringify(error.context)}`);
        }
      } else {
        console.error("Fatal error:", error);
      }
      this.rl.close();
      process.exit(1);
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const chatApp = new ChatApp();
    await chatApp.start();
  } catch (error) {
    console.error("Error starting chat app:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
