# Simple Chat App - Autohand Code Agent SDK

A simple interactive chat application demonstrating the Autohand Code Agent SDK for TypeScript.

## Features

- **Interactive Chat Loop**: Type messages and get AI responses in real-time
- **Session Management**: Save and load conversation history
- **Tool Integration**: Agent has access to file operations, command execution, git operations, and more
- **Command System**: Built-in commands for session management
- **Multi-turn Conversations**: Maintains conversation context across turns

## Prerequisites

- Node.js 18+
- Bun or npm
- Autohand Code API key (set via `AUTOHAND_API_KEY` environment variable)

## Installation

```bash
cd examples/27-simple-chat-app
bun install
```

## Usage

1. Set your API key:
```bash
export AUTOHAND_API_KEY=your-api-key-here
export AUTOHAND_PROVIDER=openrouter
```

2. Run the chat app:
```bash
bun run index.ts
```

## Commands

While in the chat, you can use these commands:

- `/clear` - Clear conversation history
- `/exit` - Exit the chat
- `/save [filename]` - Save conversation to file
- `/load [filename]` - Load conversation from file
- `/history` - Show conversation history

## Example Session

```
============================================================
  Autohand Code - Simple Chat App
============================================================

Available commands:
  Type your message to chat with the agent
  '/clear' - Clear conversation history
  '/exit' - Exit the chat
  '/save [filename]' - Save conversation to file
  '/load [filename]' - Load conversation from file
  '/history' - Show conversation history

The agent has access to: read_file, write_file, bash, glob, search_in_files, git

============================================================

💬 You: What files are in the current directory?

🤖 Assistant is thinking...

💬 I'll search for files in the current directory.

📊 Turns used: 2

------------------------------------------------------------
```

## How It Works

1. **Agent Setup**: Creates an agent with tools for file operations, command execution, and git operations
2. **Session Management**: Uses the Session class to maintain conversation history
3. **Interactive Loop**: Uses readline for interactive command-line input
4. **Tool Execution**: Agent can use tools like `read_file`, `write_file`, `bash`, etc. to perform actions
5. **Persistence**: Conversations can be saved to JSON files and loaded later

## Key Code Patterns

```typescript
// Create agent with tools
const agent = new Agent(
  "Autohand Code Assistant",
  "You are a helpful AI coding assistant...",
  ["read_file", "write_file", "bash", "glob", "search_in_files"],
  10
);

// Set provider
agent.setProvider(new OpenRouterProvider(apiKey, model));

// Create session
const session = new Session({
  working_directory: process.cwd(),
});

// Run agent
const result = await Runner.run(agent, userMessage);

// Manage conversation history
session.addUserMessage(userMessage);
session.addAssistantMessage(result.finalOutput);

// Save/load session
session.save(path);
const loaded = Session.load(path);
```

## Comparison with Claude Agent SDK

This example demonstrates similar patterns to Claude Agent SDK demos:

| Claude SDK Pattern | Autohand Code Equivalent |
|-------------------|------------------------|
| `query()` | `Runner.run()` |
| Session persistence | `Session.save()` / `Session.load()` |
| Tool registration | Agent constructor with tool names |
| Custom tools | `ToolDefinition` subclass |
| Streaming | Not yet supported (planned) |

## License

See the main Autohand Code license for details.
