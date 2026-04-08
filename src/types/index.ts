/**
 * Core types for the Autohand Agents TypeScript SDK.
 * Tool names match CLI action names exactly.
 */

/**
 * Available tools. Values match CLI action names exactly.
 */
export enum Tool {
  // Filesystem
  READ_FILE = "read_file",
  WRITE_FILE = "write_file",
  EDIT_FILE = "edit_file",
  APPLY_PATCH = "apply_patch",
  FIND = "find",
  GLOB = "glob",
  SEARCH_IN_FILES = "search_in_files",
  
  // Command
  BASH = "bash",
  
  // Git
  GIT_STATUS = "git_status",
  GIT_DIFF = "git_diff",
  GIT_LOG = "git_log",
  GIT_COMMIT = "git_commit",
  GIT_ADD = "git_add",
  GIT_RESET = "git_reset",
  GIT_PUSH = "git_push",
  GIT_PULL = "git_pull",
  GIT_FETCH = "git_fetch",
  GIT_CHECKOUT = "git_checkout",
  GIT_SWITCH = "git_switch",
  GIT_BRANCH = "git_branch",
  GIT_MERGE = "git_merge",
  GIT_REBASE = "git_rebase",
  GIT_STASH = "git_stash",
  GIT_APPLY_PATCH = "git_apply_patch",
  GIT_WORKTREE_LIST = "git_worktree_list",
  GIT_WORKTREE_ADD = "git_worktree_add",
  
  // Web
  WEB_SEARCH = "web_search",
  
  // Notebook
  NOTEBOOK_READ = "notebook_read",
  NOTEBOOK_EDIT = "notebook_edit",
  
  // Dependencies
  READ_PACKAGE_MANIFEST = "read_package_manifest",
  ADD_DEPENDENCY = "add_dependency",
  REMOVE_DEPENDENCY = "remove_dependency",
  
  // Formatters
  FORMAT_FILE = "format_file",
  FORMAT_DIRECTORY = "format_directory",
  LIST_FORMATTERS = "list_formatters",
  CHECK_FORMATTING = "check_formatting",
  
  // Linters
  LINT_FILE = "lint_file",
  LINT_DIRECTORY = "lint_directory",
  LIST_LINTERS = "list_linters",
}

/**
 * How the agent handles tool execution approvals.
 */
export enum PermissionMode {
  YOLO = "yolo",  // Auto-approve all
  ASK = "ask",    // Prompt before each action
  DENY = "deny",  // Block all tool use
}

/**
 * A tool/function call requested by the LLM.
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: string;  // JSON string
}

/**
 * A single message in the conversation.
 */
export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

/**
 * Schema for a tool, used to describe it to the LLM.
 */
export interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Result from executing a tool.
 */
export interface ToolResult {
  data?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options controlling agent behavior.
 */
export interface AgentOptions {
  allowedTools: Tool[];
  model?: string;
  maxTurns?: number;
  timeoutSeconds?: number;
  permissions?: string;
}

/**
 * Result from a complete agent run.
 */
export interface RunResult {
  finalOutput: string;
  session?: Session;
  turns: number;
}

/**
 * Response from an LLM provider. Normalized across all providers.
 */
export interface ChatResponse {
  id: string;
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: string;
  usage?: Record<string, number>;
  raw?: unknown;
}

/**
 * A session representing a conversation between user, agent, and tools.
 */
export interface Session {
  id: string;
  messages: Message[];
  workingDirectory: string;
  createdAt: Date;
}
