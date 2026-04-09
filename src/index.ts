/**
 * Autohand Code Agent SDK for TypeScript
 */

// Types
export * from "./types/index";
export * from "./types/provider";

// Core classes
export { Agent } from "./agent";
export { Runner } from "./runner";
export { loadConfig, config } from "./config";

// Providers
export { OpenRouterProvider } from "./providers/openrouter";
export { OllamaProvider } from "./providers/ollama";
export { OpenAIProvider, type OpenAIConfig } from "./providers/openai";
export { AzureProvider, type AzureConfig } from "./providers/azure";
export { ZaiProvider, type ZaiConfig } from "./providers/zai";
export { LLMGatewayProvider, type LLMGatewayConfig } from "./providers/llmgateway";
export { LlamaCppProvider, type LlamaCppConfig } from "./providers/llamacpp";
export { MLXProvider, type MLXConfig } from "./providers/mlx";
export { createProvider, createProviderByName } from "./providers/factory";

// Tools
export { ToolDefinition } from "./tools/base";
export { ToolRegistry, DefaultToolRegistry } from "./tools/registry";

// Validation
export { 
  SafeParser, 
  RuntimeValidator,
  ToolCallSchema,
  AgentConfigSchema,
  PermissionModeSchema,
  SessionConfigSchema,
  type ToolCallInput,
  type AgentConfigInput,
  type SessionConfigInput
} from "./validation/schemas";

// Utilities
export { createBrand, createConstAssertion, createId, type BrandedString, isBranded } from "./utils/branding";
export type { Disposable } from "./utils/disposable";
export { CompositeDisposable } from "./utils/disposable";
export { SessionManager } from "./utils/session";

// Filesystem tools
export { ReadFileTool } from "./tools/filesystem/read";
export { WriteFileTool } from "./tools/filesystem/write";
export { EditFileTool } from "./tools/filesystem/edit";
export {
  ApplyPatchTool,
  FindTool,
  GlobTool,
  SearchInFilesTool,
} from "./tools/filesystem/extended";

// Command tools
export { BashTool } from "./tools/bash";

// Git tools
export {
  GitStatusTool,
  GitDiffTool,
  GitLogTool,
  GitCommitTool,
  GitAddTool,
  GitResetTool,
  GitPushTool,
  GitPullTool,
  GitFetchTool,
  GitCheckoutTool,
  GitBranchTool,
  GitMergeTool,
  GitRebaseTool,
  GitStashTool,
} from "./tools/git";

// Web tools
export { WebSearchTool } from "./tools/web";

// Notebook tools
export { NotebookReadTool, NotebookEditTool } from "./tools/notebook";

// Dependency tools
export {
  ReadPackageManifestTool,
  AddDependencyTool,
  RemoveDependencyTool,
} from "./tools/dependencies";

// Formatter tools
export {
  FormatFileTool,
  FormatDirectoryTool,
  ListFormattersTool,
  CheckFormattingTool,
} from "./tools/formatters";

// Linter tools
export {
  LintFileTool,
  LintDirectoryTool,
  ListLintersTool,
} from "./tools/linters";
