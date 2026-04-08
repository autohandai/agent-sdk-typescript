/**
 * Simple example of using the Autohand Code Agent SDK
 */

import { Agent, Runner, Tool, OpenRouterProvider } from "../src/index";

async function main() {
  // Create an agent
  const agent = new Agent(
    "Assistant",
    "You are a helpful coding assistant.",
    [Tool.READ_FILE, Tool.WRITE_FILE, Tool.BASH]
  );

  // Set up the provider
  agent.setProvider(
    new OpenRouterProvider(
      process.env.AUTOHAND_API_KEY || "your-api-key",
      "anthropic/claude-3-opus"
    )
  );

  // Run the agent
  const result = await Runner.runSync(agent, "Say hello!");
  console.log(result);
}

main().catch(console.error);
