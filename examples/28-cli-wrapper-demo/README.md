# CLI Wrapper Demo - Autohand Code Agent SDK

A command-line interface wrapper for the Autohand Code Agent SDK for TypeScript, demonstrating how to use the SDK from the command line with various operations.

## Features

- **Command-line Interface**: Easy-to-use CLI with multiple commands
- **Multiple Operations**: Chat, analyze, fix, search, and explain code
- **Flexible Configuration**: Support for different providers and models
- **Session Management**: Maintains conversation context across commands
- **Tool Integration**: Full access to file operations, command execution, and more

## Prerequisites

- Node.js 18+
- Bun or npm
- Autohand Code API key (set via `AUTOHAND_API_KEY` environment variable)

## Installation

```bash
cd examples/28-cli-wrapper-demo
bun install
```

## Usage

1. Set your API key:
```bash
export AUTOHAND_API_KEY=your-api-key-here
export AUTOHAND_PROVIDER=openrouter
```

2. Run the CLI:
```bash
bun run index.ts [command] [arguments] [options]
```

## Commands

### chat
Chat with the AI agent.

```bash
bun run index.ts chat "Explain closures in TypeScript"
```

### analyze
Analyze a directory or file for issues.

```bash
bun run index.ts analyze ./src
bun run index.ts analyze ./src/agent.ts
```

### fix
Fix issues in a file.

```bash
bun run index.ts fix ./src/agent.ts
```

### search
Search for code patterns in a directory.

```bash
bun run index.ts search "Agent" ./src
bun run index.ts search "function" ./src --tools search_in_files,glob
```

### explain
Explain code in a file.

```bash
bun run index.ts explain ./src/runner.ts
```

## Options

- `--model <name>` - Model to use (default: z-ai/glm-5.1)
- `--provider <name>` - Provider to use (default: openrouter)
- `--max-turns <number>` - Maximum agent turns (default: 10)
- `--tools <list>` - Comma-separated tool list
- `--working-dir <path>` - Working directory

### Examples with Options

```bash
# Use a different model
bun run index.ts chat "Hello" --model gpt-4o

# Specify custom tools
bun run index.ts analyze ./src --tools read_file,write_file,bash

# Set maximum turns
bun run index.ts fix ./src/agent.ts --max-turns 5

# Use a specific working directory
bun run index.ts search "Agent" ./src --working-dir /path/to/project
```

## Environment Variables

- `AUTOHAND_PROVIDER` - Provider to use (default: openrouter)
- `AUTOHAND_API_KEY` - API key for the provider
- `AUTOHAND_MODEL` - Model to use

## Help

```bash
bun run index.ts --help
```

## Example Session

```bash
$ export AUTOHAND_API_KEY=your-key-here
$ bun run index.ts chat "What is a closure?"

💬 Chat: What is a closure?

🤖 Response:
A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned. This allows functions to "remember" the environment in which they were created.

📊 Turns used: 1

$ bun run index.ts analyze ./src

🔍 Analyzing: ./src

🤖 Analysis:
The src directory contains the main SDK implementation with modules for agents, runners, providers, and tools. The code follows a clean architecture with proper separation of concerns.

📊 Turns used: 3
```

## How It Works

1. **CLI Argument Parsing**: Parses command-line arguments and options
2. **Agent Setup**: Creates an agent with specified tools and configuration
3. **Provider Configuration**: Sets up the appropriate provider (OpenRouter, OpenAI, etc.)
4. **Session Management**: Maintains conversation context
5. **Command Execution**: Runs the appropriate operation (chat, analyze, fix, etc.)
6. **Result Display**: Shows the agent's response and statistics

## Key Code Patterns

```typescript
// Parse CLI arguments
const args = new CLIArgs(process.argv);

// Create agent with tools
const agent = new Agent(
  "Autohand Code CLI",
  "You are a helpful AI coding assistant...",
  tools,
  maxTurns
);

// Set provider
agent.setProvider(new OpenRouterProvider(apiKey, model));

// Run agent
const result = await Runner.run(agent, prompt);

// Display results
console.log(result.finalOutput);
console.log(`Turns used: ${result.turns}`);
```

## Comparison with Claude Agent SDK

This CLI wrapper demonstrates similar patterns to Claude Agent SDK CLI tools:

| Claude SDK Pattern | Autohand Code Equivalent |
|-------------------|------------------------|
| CLI-based agent interaction | CLI wrapper with commands |
| Tool-based file operations | Same tool architecture |
| Session persistence | Session class |
| Provider configuration | Provider classes |

## Extending the CLI

To add new commands:

1. Add the command to the `CLIArgs` parser
2. Add a new method to the `CLIApp` class
3. Add the command to the `runCommand` switch statement
4. Update the help text

Example:

```typescript
private async customCommand(args: string[]): Promise<void> {
  const file = args[0];
  const result = await Runner.run(
    this.agent,
    `Perform custom operation on ${file}`
  );
  console.log(result.finalOutput);
}
```

## License

See the main Autohand Code license for details.
