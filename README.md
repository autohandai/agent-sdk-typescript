# Autohand Code Agent SDK for TypeScript

Build AI agents with Autohand Code using TypeScript.

## Installation

```bash
npm install @autohandai/agent-sdk
```

## Quick Start

```typescript
import { Agent, Runner, Tool, OpenRouterProvider } from "@autohandai/agent-sdk";

// Create an agent
const agent = new Agent(
  "Assistant",
  "You are a helpful coding assistant.",
  [Tool.READ_FILE, Tool.WRITE_FILE, Tool.BASH]
);

// Set up the provider
agent.setProvider(new OpenRouterProvider(
  process.env.AUTOHAND_API_KEY || "your-api-key",
  "z-ai/glm-5.1"
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
export AUTOHAND_MODEL=z-ai/glm-5.1
```

Or configure programmatically:

```typescript
import { loadConfig } from "@autohandai/agent-sdk";

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
- `GIT_RESET` - Reset current HEAD
- `GIT_PUSH` - Push to remote
- `GIT_PULL` - Pull from remote
- `GIT_FETCH` - Fetch from remote
- `GIT_CHECKOUT` - Switch branches or restore files
- `GIT_BRANCH` - List, create, or delete branches
- `GIT_MERGE` - Join development histories
- `GIT_REBASE` - Reapply commits on top of another base
- `GIT_STASH` - Stash changes in working directory

### Web
- `WEB_SEARCH` - Search the web (requires API configuration)

### Notebook
- `NOTEBOOK_READ` - Read Jupyter notebooks
- `NOTEBOOK_EDIT` - Edit Jupyter notebook cells

### Dependencies
- `READ_PACKAGE_MANIFEST` - Read package manifests (package.json, requirements.txt, etc.)
- `ADD_DEPENDENCY` - Add dependencies (requires package manager CLI)
- `REMOVE_DEPENDENCY` - Remove dependencies (requires package manager CLI)

### Formatters
- `FORMAT_FILE` - Format a file using a code formatter (requires formatter CLI)
- `FORMAT_DIRECTORY` - Format all files in a directory (requires formatter CLI)
- `LIST_FORMATTERS` - List available code formatters
- `CHECK_FORMATTING` - Check if a file is properly formatted (requires formatter CLI)

### Linters
- `LINT_FILE` - Lint a file using a code linter (requires linter CLI)
- `LINT_DIRECTORY` - Lint all files in a directory (requires linter CLI)
- `LIST_LINTERS` - List available code linters

## Custom Tools

Create custom tools by extending `ToolDefinition`:

```typescript
import { ToolDefinition, Tool, ToolResult } from "@autohandai/agent-sdk";

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
