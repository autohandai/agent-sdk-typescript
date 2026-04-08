# Autohand Code Agent SDK for TypeScript

Build AI agents with Autohand Code using TypeScript.

## Installation

```bash
npm install autohand-agents
```

## Quick Start

```typescript
import { Agent, Runner, Tool, OpenRouterProvider } from "autohand-agents";

// Create an agent
const agent = new Agent(
  "Assistant",
  "You are a helpful coding assistant.",
  [Tool.READ_FILE, Tool.WRITE_FILE, Tool.BASH]
);

// Set up the provider
agent.setProvider(new OpenRouterProvider(
  process.env.AUTOHAND_API_KEY || "your-api-key",
  "anthropic/claude-3-opus"
));

// Run the agent
const result = await Runner.runSync(agent, "Read the package.json file");
console.log(result);
```

## Configuration

Configure the SDK using environment variables:

```bash
export AUTOHAND_PROVIDER=openrouter
export AUTOHAND_API_KEY=your-api-key
export AUTOHAND_MODEL=anthropic/claude-3-opus
```

Or configure programmatically:

```typescript
import { loadConfig } from "autohand-agents";

const config = loadConfig();
// config.provider, config.apiKey, config.model
```

## Available Tools

### Filesystem
- `READ_FILE` - Read file contents
- `WRITE_FILE` - Write content to a file
- `EDIT_FILE` - Apply find-and-replace edits
- `APPLY_PATCH` - Apply unified diff patches
- `FIND` - Find files by name pattern
- `GLOB` - Find files matching glob pattern
- `SEARCH_IN_FILES` - Search for text in files

### Command
- `BASH` - Execute shell commands

### Git
- `GIT_STATUS` - Show git status
- `GIT_DIFF` - Show git diff
- `GIT_LOG` - Show git log
- `GIT_COMMIT` - Commit changes
- `GIT_ADD` - Stage files
- And more git operations...

### Web
- `WEB_SEARCH` - Search the web

### Notebook
- `NOTEBOOK_READ` - Read Jupyter notebooks
- `NOTEBOOK_EDIT` - Edit Jupyter notebooks

### Dependencies
- `READ_PACKAGE_MANIFEST` - Read package manifests
- `ADD_DEPENDENCY` - Add dependencies
- `REMOVE_DEPENDENCY` - Remove dependencies

### Formatters & Linters
- `FORMAT_FILE`, `FORMAT_DIRECTORY` - Format code
- `LINT_FILE`, `LINT_DIRECTORY` - Lint code
- `LIST_FORMATTERS`, `LIST_LINTERS` - List available tools

## Custom Tools

Create custom tools by extending `ToolDefinition`:

```typescript
import { ToolDefinition, Tool, ToolResult } from "autohand-agents";

class MyCustomTool extends ToolDefinition {
  getName(): Tool {
    return Tool.READ_FILE; // or a custom tool enum value
  }

  getDescription(): string {
    return "My custom tool description";
  }

  getParameters(): Record<string, unknown> {
    return {
      type: "object",
      properties: {
        param1: { type: "string", description: "Parameter 1" },
      },
      required: ["param1"],
    };
  }

  async execute(params: Record<string, unknown>): Promise<ToolResult> {
    // Your tool logic here
    return { data: "Tool executed successfully" };
  }
}
```

## CLI Integration

This SDK works seamlessly with the [Autohand Code CLI](https://github.com/autohandai/code-cli).

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint
```

## License

Apache 2.0

## Links

- [Autohand Code CLI](https://github.com/autohandai/code-cli)
- [Python SDK](https://github.com/autohandai/agent-sdk-python)
- [Java SDK](https://github.com/autohandai/agent-sdk-java)
