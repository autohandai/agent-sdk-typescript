# Autohand Code Agent SDK for TypeScript

[![npm version](https://badge.fury.io/js/@autohandai%2Fagent-sdk.svg)](https://www.npmjs.com/package/@autohandai/agent-sdk)
[![License](https://img.shields.io/npm/l/@autohandai/agent-sdk)](LICENSE)
[![Node.js Version](https://img.shields.io/node/v/@autohandai/agent-sdk)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

> Build production-ready AI agents with Autohand Code using TypeScript.

The Autohand Code Agent SDK for TypeScript provides a robust, type-safe way to build AI agents that can interact with your codebase, execute tools, and perform complex tasks. Built with performance, reliability, and developer experience in mind.

## ✨ Features

- **🚀 Production-Ready**: Comprehensive error handling, timeout management, and retry logic
- **🔒 Type-Safe**: Full TypeScript support with Zod runtime validation
- **🛠️ Extensible**: Easy-to-use tool system for custom functionality
- **📊 Observability**: Structured logging and metrics for debugging and monitoring
- **⚡ Performance**: Optimized with schema caching and efficient resource management
- **🔌 Multi-Provider**: Support for OpenRouter, OpenAI, Azure, Ollama, and more
- **🧪 Well-Tested**: Comprehensive test coverage including integration tests

## 📦 Installation

```bash
npm install @autohandai/agent-sdk
```

## 🚀 Quick Start

```typescript
import { Agent, Runner, OpenRouterProvider, DefaultToolRegistry } from "@autohandai/agent-sdk";

// Create an agent with tools
const agent = new Agent(
  "Assistant",
  "You are a helpful coding assistant.",
  DefaultToolRegistry.getAll()
);

// Configure the provider with timeout and retry options
agent.setProvider(new OpenRouterProvider(
  process.env.AUTOHAND_API_KEY || "your-api-key",
  "z-ai/glm-5.1"
));

// Run the agent
const result = await Runner.runSync(agent, "Read the package.json file");
console.log(result);
```

## 📚 Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Migration Guide](MIGRATION.md)** - Guide for upgrading between versions
- **[Environment Variables](docs/ENVIRONMENT_VARIABLES.md)** - Configuration reference
- **[Examples](../examples/)** - Example applications

## ⚙️ Configuration

Autohand Code SDK supports 8 providers: **openrouter**, **ollama**, **openai**, **llamacpp**, **mlx**, **llmgateway**, **azure**, and **zai**.

### Environment Variables

```bash
# Provider selection
export AUTOHAND_PROVIDER=openrouter

# API Key for selected provider
export AUTOHAND_API_KEY=your-api-key

# Model name (provider-specific)
export AUTOHAND_MODEL=z-ai/glm-5.1

# Optional: Custom base URL
export AUTOHAND_BASE_URL=https://custom-api.example.com
```

### Provider-Specific Configuration

#### OpenRouter (Default)
```bash
export AUTOHAND_PROVIDER=openrouter
export AUTOHAND_API_KEY=sk-or-v1-...
export AUTOHAND_MODEL=z-ai/glm-5.1
```

#### OpenAI
```bash
export AUTOHAND_PROVIDER=openai
export AUTOHAND_API_KEY=sk-...
export AUTOHAND_MODEL=gpt-4
```

#### Azure OpenAI
```bash
export AUTOHAND_PROVIDER=azure
export AUTOHAND_API_KEY=your-api-key
export AUTOHAND_MODEL=gpt-4
export AUTOHAND_AZURE_RESOURCE_NAME=your-resource-name
export AUTOHAND_AZURE_DEPLOYMENT_NAME=your-deployment-name
```

#### Ollama (Local)
```bash
export AUTOHAND_PROVIDER=ollama
export AUTOHAND_MODEL=llama2
export AUTOHAND_OLLAMA_BASE_URL=http://localhost:11434
```

#### Z-AI
```bash
export AUTOHAND_PROVIDER=zai
export AUTOHAND_API_KEY=your-api-key
export AUTOHAND_MODEL=glm-5.1
```

#### LLM Gateway
```bash
export AUTOHAND_PROVIDER=llmgateway
export AUTOHAND_API_KEY=your-api-key
export AUTOHAND_MODEL=llama-3.1-8b
```

#### Llama.cpp (Local)
```bash
export AUTOHAND_PROVIDER=llamacpp
export AUTOHAND_MODEL=llama-3-8b-instruct
export AUTOHAND_LLAMACPP_BASE_URL=http://localhost:8080
```

#### MLX (Apple Silicon)
```bash
export AUTOHAND_PROVIDER=mlx
export AUTOHAND_MODEL=mlx-lm
export AUTOHAND_MLX_BASE_URL=http://localhost:8080
```

### Programmatic Configuration

```typescript
import { loadConfig, createProvider } from "@autohandai/agent-sdk";

// Load from environment
const config = loadConfig();

// Create provider manually
const provider = createProvider(config);

// Or create by name
const openRouterProvider = createProviderByName("openrouter", "your-api-key");
const ollamaProvider = createProviderByName("ollama"); // No API key needed for local
```

## 🎯 Advanced Features

### Timeout Handling

All provider requests support configurable timeouts to prevent hanging:

```typescript
import { ConsoleLogger } from "@autohandai/agent-sdk";

const logger = new ConsoleLogger();
agent.setProvider(new OpenRouterProvider("api-key", "model"));

// Run with custom timeout (default: 30s)
const result = await Runner.run(agent, "Analyze this code");
```

### Retry Logic

Transient failures are automatically retried with exponential backoff:

- **Retryable errors**: 408 (timeout), 429 (rate limit), 500+ (server errors)
- **Non-retryable errors**: 400, 401, 403, 404
- **Default**: 3 retries with exponential backoff (100ms initial, 10s max)

### Runtime Validation

All provider responses and tool parameters are validated using Zod schemas:

```typescript
// Tool parameters are validated automatically
class MyTool extends ToolDefinition {
  getParameterSchema(): z.ZodSchema {
    return z.object({
      path: z.string().min(1),
      count: z.number().min(0).max(100),
    });
  }
}
```

### Resource Cleanup

Automatic resource cleanup prevents memory leaks:

```typescript
// Resources are automatically cleaned up on completion or error
const result = await Runner.run(agent, "Process data");
// SessionManager ensures cleanup even if an error occurs
```

## 🛠️ Available Tools

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

## 🔧 Custom Tools

Create custom tools by extending `ToolDefinition` with Zod validation:

```typescript
import { ToolDefinition, ToolResult } from "@autohandai/agent-sdk";
import { z } from "zod";

class MyCustomTool extends ToolDefinition {
  getName(): string {
    return "my_custom_tool";
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

  // Override to provide custom Zod validation
  getParameterSchema(): z.ZodSchema {
    return z.object({
      param1: z.string().min(1),
      param2: z.number().optional(),
    });
  }

  protected async executeInternal(params: Record<string, unknown>): Promise<ToolResult> {
    // Your tool logic here
    return { data: "Tool executed successfully" };
  }
}
```

## 🛡️ Error Handling

The SDK provides comprehensive error handling with custom error classes:

```typescript
import { 
  TimeoutError, 
  RetryExhaustedError, 
  ValidationError, 
  ProviderError,
  isRetryableError 
} from "@autohandai/agent-sdk";

try {
  await Runner.run(agent, prompt);
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log("Request timed out");
  } else if (error instanceof RetryExhaustedError) {
    console.log("Max retries exceeded");
  } else if (error instanceof ValidationError) {
    console.log("Validation failed");
  } else if (error instanceof ProviderError) {
    console.log("Provider error");
  }
}
```

## ⚡ Performance

The SDK is optimized for production use:

- **Schema Caching**: Tool schemas are cached to avoid redundant computation
- **Resource Management**: Automatic cleanup prevents memory leaks
- **Efficient Validation**: Zod provides fast runtime validation
- **Connection Pooling**: Optimized HTTP connections

## 🧪 Testing

The SDK includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test suites include:
- Unit tests for individual components
- Integration tests with mocked providers
- Error scenario tests
- Edge case and concurrent operation tests

## 🔗 CLI Integration

This SDK works seamlessly with the [Autohand Code CLI](https://autohand.ai/code/).

## 💻 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Lint with auto-fix
npm run lint:fix
```

### Requirements

- **Node.js**: >=16.0.0
- **TypeScript**: >=5.0.0

## 📄 License

Apache 2.0 - see [LICENSE](LICENSE) for details.

## 🔗 Links

- **[Homepage](https://autohand.ai/code/)** - Autohand Code official website
- **[Repository](https://github.com/autohandai/agent-sdk-typescript)** - GitHub repository
- **[Documentation](docs/)** - Complete documentation
- **[API Reference](docs/API.md)** - Full API documentation
- **[Migration Guide](MIGRATION.md)** - Upgrade guide
- **[Environment Variables](docs/ENVIRONMENT_VARIABLES.md)** - Configuration reference
- **[Issues](https://github.com/autohandai/agent-sdk-typescript/issues)** - Bug reports and feature requests
- **[Autohand Code CLI](https://autohand.ai/code/)** - Command-line interface
- **[Python SDK](https://github.com/autohandai/agent-sdk-python)** - Python implementation
- **[Java SDK](https://github.com/autohandai/agent-sdk-java)** - Java implementation

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to the [GitHub repository](https://github.com/autohandai/agent-sdk-typescript).

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Report a Bug](https://github.com/autohandai/agent-sdk-typescript/issues/new?template=bug_report.md)
- 💡 [Request a Feature](https://github.com/autohandai/agent-sdk-typescript/issues/new?template=feature_request.md)
- 💬 [Discussions](https://github.com/autohandai/agent-sdk-typescript/discussions)

---

Built with ❤️ by [Autohand AI](https://autohand.ai/code/)

