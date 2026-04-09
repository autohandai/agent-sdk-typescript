/**
 * 18 Provider: Ollama - Direct Ollama provider configuration for local models.
 *
 * Demonstrates configuring the SDK to use Ollama for local model inference.
 * Ollama is free and requires no API key, just a running Ollama server.
 *
 * Usage:
 *   cd examples/18-provider-ollama
 *   bun run index.ts
 *
 * Prerequisites:
 *   ollama pull llama3.2
 *   ollama serve
 */

import { Agent, Runner, OllamaProvider, SDKError } from "@autohandai/agent-sdk";

/**
 * Main function that demonstrates Ollama provider usage
 */
async function main(): Promise<void> {
  try {
    // Verify Ollama is running by creating a provider directly
    const provider = new OllamaProvider("http://localhost:11434", "llama3.2");
    console.log("Ollama provider created successfully.");
    console.log(`Provider type: OllamaProvider`);
    console.log(`Base URL: http://localhost:11434`);

    const agent = new Agent(
      "local-assistant",
      "You are a concise, helpful assistant running on local hardware.",
      [],
      3
    );

    agent.setProvider(provider);
    agent.setModel("llama3.2");

    console.log("\nRunning with Ollama provider (llama3.2)...");
    console.log("Make sure Ollama is running: ollama serve");
    console.log("Pull a model: ollama pull llama3.2\n");

    const result = await Runner.run(
      agent,
      "What are three benefits of running AI models locally?"
    );
    console.log(result.finalOutput);
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
  }
}

main().catch((error) => {
  // Exit with error code on failure
  process.exit(1);
});
