# Autohand Code Agent SDK - API Reference

Complete API reference for the Autohand Code Agent SDK for TypeScript.

## Table of Contents

- [Core Classes](#core-classes)
  - [Agent](#agent)
  - [Runner](#runner)
- [Providers](#providers)
  - [Provider Interface](#provider-interface)
  - [Provider Options](#provider-options)
  - [OpenRouterProvider](#openrouterprovider)
  - [OpenAIProvider](#openaiprovider)
  - [AzureProvider](#azureprovider)
  - [OllamaProvider](#ollamaprovider)
  - [ZaiProvider](#zaiprovider)
  - [LLMGatewayProvider](#llmgatewayprovider)
  - [LlamaCppProvider](#llamacppprovider)
  - [MLXProvider](#mlxprovider)
- [Tools](#tools)
  - [ToolDefinition](#tooldefinition)
  - [ToolRegistry](#toolregistry)
  - [DefaultToolRegistry](#defaulttoolregistry)
- [Configuration](#configuration)
  - [loadConfig](#loadconfig)
  - [Config Interface](#config-interface)
- [Error Handling](#error-handling)
  - [SDKError](#sdkerror)
  - [TimeoutError](#timeouterror)
  - [RetryExhaustedError](#retryexhaustederror)
  - [ValidationError](#validationerror)
  - [ProviderError](#providererror)
  - [ToolExecutionError](#toolexecutionerror)
- [Utilities](#utilities)
  - [SessionManager](#sessionmanager)
  - [Disposable](#disposable)
  - [Logger](#logger)
  - [ConsoleLogger](#consolelogger)
  - [NoOpLogger](#nooplogger)
- [Validation](#validation)
  - [SafeParser](#safeparser)
  - [RuntimeValidator](#runtimevalidator)

---

## Core Classes

### Agent

Represents an AI agent that can execute tasks using tools and LLM providers.

```typescript
class Agent {
  constructor(
    name: string,
    instructions: string,
    tools: readonly Tool[] = [],
    maxTurns: number = 10
  )
  
  get name(): string
  get instructions(): string
  get tools(): readonly Tool[]
  get maxTurns(): number
  get model(): ModelId | undefined
  get provider(): Provider | undefined
  
  setProvider(provider: Provider): void
  setModel(model: ModelId): void
  getConfig(): AgentConfig
}
```

#### Constructor Parameters

- `name` (string): The agent's name
- `instructions` (string): The agent's instructions/system prompt
- `tools` (readonly Tool[], optional): Array of tools available to the agent (default: empty array)
- `maxTurns` (number, optional): Maximum number of turns the agent can take (default: 10)

#### Example

```typescript
import { Agent, OpenRouterProvider, DefaultToolRegistry } from "@autohandai/agent-sdk";

const agent = new Agent(
  "Assistant",
  "You are a helpful coding assistant.",
  DefaultToolRegistry.getAll()
);
agent.setProvider(new OpenRouterProvider("api-key", "gpt-4"));
```

---

### Runner

Executes agents and manages the agent execution loop.

```typescript
class Runner {
  static async runSync(agent: Agent, prompt: string): Promise<string>
  static async run(agent: Agent, prompt: string): Promise<RunResult>
}
```

#### Methods

##### runSync

Runs an agent synchronously with the given prompt. Throws an error if the agent exceeds max turns without reaching a conclusion.

**Parameters:**
- `agent` (Agent): The agent to run
- `prompt` (string): The user prompt to start the conversation

**Returns:** Promise<string> - The final output from the agent

**Throws:** `AgentExecutionError` when agent configuration is invalid or max turns exceeded

##### run

Runs an agent with the given prompt and returns the full result including session information and turn count.

**Parameters:**
- `agent` (Agent): The agent to run
- `prompt` (string): The user prompt to start the conversation

**Returns:** Promise<RunResult> - The complete run result including session and turn count

**Throws:** 
- `AgentExecutionError` when agent configuration is invalid
- `ToolExecutionError` when tool execution fails
- `ProviderError` when provider communication fails

#### Example

```typescript
import { Runner, Agent } from "@autohandai/agent-sdk";

const agent = new Agent("Assistant", "You are helpful.", tools);

// Simple sync execution
const result = await Runner.runSync(agent, "Read the file");
console.log(result);

// Full result with session info
const fullResult = await Runner.run(agent, "Analyze the code");
console.log(`Turns: ${fullResult.turns}`);
console.log(`Output: ${fullResult.finalOutput}`);
```

---

## Providers

### Provider Interface

Abstract base for all LLM providers.

```typescript
interface Provider {
  modelName(model: string): string
  chat(
    messages: Message[],
    model: string,
    tools?: ToolSchema[],
    options?: ProviderOptions
  ): Promise<ChatResponse>
}
```

### Provider Options

Configuration options for provider requests.

```typescript
interface ProviderOptions {
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries?: number
  /** Logger instance for debugging (default: NoOpLogger) */
  logger?: Logger
  /** Maximum tokens in response (provider-specific) */
  maxTokens?: number
  /** Sampling temperature (provider-specific) */
  temperature?: number
}
```

### OpenRouterProvider

Provider for OpenRouter API.

```typescript
class OpenRouterProvider implements Provider {
  constructor(
    apiKey: string,
    defaultModel = "z-ai/glm-5.1",
    baseUrl = "https://openrouter.ai/api/v1"
  )
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### OpenAIProvider

Provider for OpenAI API.

```typescript
class OpenAIProvider implements Provider {
  constructor(config: OpenAIConfig, defaultModel: string = "gpt-4")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### AzureProvider

Provider for Azure OpenAI API.

```typescript
class AzureProvider implements Provider {
  constructor(config: AzureConfig)
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### OllamaProvider

Provider for Ollama (local LLM).

```typescript
class OllamaProvider implements Provider {
  constructor(baseUrl: string = "http://localhost:11434", model: string = "llama2")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### ZaiProvider

Provider for Z-AI API.

```typescript
class ZaiProvider implements Provider {
  constructor(apiKey: string, defaultModel = "glm-5.1")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### LLMGatewayProvider

Provider for LLM Gateway API.

```typescript
class LLMGatewayProvider implements Provider {
  constructor(apiKey: string, defaultModel = "llama-3.1-8b")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### LlamaCppProvider

Provider for Llama.cpp (local LLM).

```typescript
class LlamaCppProvider implements Provider {
  constructor(baseUrl: string = "http://localhost:8080", model: string = "llama-3-8b-instruct")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

### MLXProvider

Provider for MLX (Apple Silicon).

```typescript
class MLXProvider implements Provider {
  constructor(baseUrl: string = "http://localhost:8080", model: string = "mlx-lm")
  
  modelName(model: string): string
  chat(messages, model, tools?, options?): Promise<ChatResponse>
}
```

---

## Tools

### ToolDefinition

Abstract base class for tool definitions. Uses Zod for runtime parameter validation.

```typescript
abstract class ToolDefinition implements Disposable {
  abstract getName(): string
  abstract getDescription(): string
  abstract getParameters(): Record<string, unknown>
  
  getParameterSchema(): z.ZodSchema<Record<string, unknown>>
  async execute(params: Record<string, unknown>): Promise<ToolResult<string>>
  protected abstract executeInternal(params: Record<string, unknown>): Promise<ToolResult<string>>
  dispose(): void
}
```

### ToolRegistry

Registry for managing tool definitions and execution.

```typescript
class ToolRegistry {
  register(tool: ToolDefinition): void
  async execute(toolCall: ToolCall): Promise<ToolResult>
  getTools(): Map<string, ToolDefinition>
}
```

### DefaultToolRegistry

Default tool registry with common tools registered.

```typescript
class DefaultToolRegistry extends ToolRegistry {
  constructor()
  getAll(): Tool[]
}
```

---

## Configuration

### loadConfig

Loads configuration from environment variables.

```typescript
function loadConfig(): Config
```

**Environment Variables:**
- `AUTOHAND_PROVIDER`: Provider name (default: "openrouter")
- `AUTOHAND_API_KEY`: API key for the provider
- `AUTOHAND_MODEL`: Model name
- `AUTOHAND_BASE_URL`: Custom base URL
- Provider-specific variables (e.g., `AUTOHAND_OLLAMA_BASE_URL`, `AUTOHAND_AZURE_RESOURCE_NAME`)

**Returns:** Configuration object loaded from environment

### Config Interface

Complete configuration object for the SDK.

```typescript
interface Config {
  provider: 'openrouter' | 'ollama' | 'openai' | 'llamacpp' | 'mlx' | 'llmgateway' | 'azure' | 'zai'
  openrouter?: OpenRouterConfig
  ollama?: OllamaConfig
  openai?: OpenAIConfig
  azure?: AzureConfig
  zai?: ZaiConfig
  llmgateway?: LLMGatewayConfig
  llamacpp?: LlamaCppConfig
  mlx?: MLXConfig
  // Legacy support
  apiKey?: string
  model?: string
  baseUrl?: string
}
```

---

## Error Handling

### SDKError

Base error class for all SDK errors.

```typescript
abstract class SDKError extends Error {
  constructor(
    message: string,
    code: string,
    context?: Record<string, unknown>,
    cause?: Error
  )
  
  getDetails(): string
}
```

### TimeoutError

Error thrown when an operation times out.

```typescript
class TimeoutError extends SDKError {
  code = 'TIMEOUT'
  
  constructor(
    message: string,
    timeoutMs: number,
    context?: Record<string, unknown>,
    cause?: Error
  )
}
```

### RetryExhaustedError

Error thrown when retry attempts are exhausted.

```typescript
class RetryExhaustedError extends SDKError {
  code = 'RETRY_EXHAUSTED'
  
  constructor(
    message: string,
    attempts: number,
    lastError: Error,
    context?: Record<string, unknown>
  )
}
```

### ValidationError

Error thrown when runtime validation fails.

```typescript
class ValidationError extends SDKError {
  code = 'VALIDATION'
  
  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  )
}
```

### ProviderError

Error thrown when provider communication fails.

```typescript
class ProviderError extends SDKError {
  code = 'PROVIDER_ERROR'
  
  constructor(
    message: string,
    providerName: string,
    context?: Record<string, unknown>,
    cause?: Error
  )
}
```

### ToolExecutionError

Error thrown when tool execution fails.

```typescript
class ToolExecutionError extends SDKError {
  code = 'TOOL_EXECUTION'
  
  constructor(
    message: string,
    toolName: string,
    context?: Record<string, unknown>,
    cause?: Error
  )
}
```

---

## Utilities

### SessionManager

Manages resources for a single agent execution session.

```typescript
class SessionManager implements Disposable {
  getSignal(): AbortSignal
  addDisposable(disposable: Disposable): void
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout
  clearTimeout(timer: NodeJS.Timeout): void
  abort(): void
  isAborted(): boolean
  dispose(): void
}
```

### Disposable

Interface for resource cleanup.

```typescript
interface Disposable {
  dispose(): void
}
```

### Logger

Interface for structured logging throughout the SDK.

```typescript
interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
}
```

### ConsoleLogger

Console-based logger implementation.

```typescript
class ConsoleLogger implements Logger {
  constructor(prefix: string = 'AutohandSDK', level: LogLevel = LogLevel.INFO)
  
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
}
```

### NoOpLogger

No-op logger implementation for production use.

```typescript
class NoOpLogger implements Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
}
```

---

## Validation

### SafeParser

Type-safe parsing with discriminated unions.

```typescript
class SafeParser {
  static parseToolCall(data: unknown)
  static parseAgentConfig(data: unknown)
  static parsePermissionMode(data: unknown)
  static parseSessionConfig(data: unknown)
}
```

### RuntimeValidator

Runtime validation utilities.

```typescript
class RuntimeValidator {
  static validateToolCall(toolCall: unknown): asserts toolCall is z.infer<typeof ToolCallSchema>
  static validateAgentConfig(config: unknown): asserts config is z.infer<typeof AgentConfigSchema>
  static validatePermissionMode(mode: unknown): asserts mode is PermissionMode
  static validateSessionConfig(config: unknown): asserts config is z.infer<typeof SessionConfigSchema>
}
```

---

## Type Definitions

### Message

```typescript
type Message = SystemMessage | UserMessage | AssistantMessage | ToolMessage
```

### ToolCall

```typescript
interface ToolCall {
  id: string
  name: Tool
  arguments: string
}
```

### ToolResult

```typescript
interface ToolResult<T = string> {
  data?: T
  error?: string
}
```

### RunResult

```typescript
type RunResult = RunResultSuccess | RunResultMaxTurns

interface RunResultSuccess {
  finalOutput: string
  session: Session
  turns: number
}

interface RunResultMaxTurns {
  finalOutput: 'Max turns reached'
  session: Session
  turns: number
}
```

---

## See Also

- [README](../README.md) - Getting started guide
- [Migration Guide](../MIGRATION.md) - Migration guide for breaking changes
- [Examples](../examples/) - Example applications
