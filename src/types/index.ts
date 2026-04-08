/**
 * Core types for the Autohand Agents TypeScript SDK.
 * Tool names match CLI action names exactly.
 */

/**
 * Branded type for tool call IDs to prevent mixing with other strings.
 */
export type ToolCallId = string & { readonly __brand: 'ToolCallId' };

/**
 * Branded type for session IDs to prevent mixing with other strings.
 */
export type SessionId = string & { readonly __brand: 'SessionId' };

/**
 * Branded type for model identifiers to prevent mixing with other strings.
 */
export type ModelId = string & { readonly __brand: 'ModelId' };

/**
 * Available tools. Values match CLI action names exactly.
 */
export const TOOL_NAMES = [
  'read_file',
  'write_file',
  'edit_file',
  'apply_patch',
  'find',
  'glob',
  'search_in_files',
  'bash',
  'git_status',
  'git_diff',
  'git_log',
  'git_commit',
  'git_add',
  'git_reset',
  'git_push',
  'git_pull',
  'git_fetch',
  'git_checkout',
  'git_switch',
  'git_branch',
  'git_merge',
  'git_rebase',
  'git_stash',
  'git_apply_patch',
  'git_worktree_list',
  'git_worktree_add',
  'web_search',
  'notebook_read',
  'notebook_edit',
  'read_package_manifest',
  'add_dependency',
  'remove_dependency',
  'format_file',
  'format_directory',
  'list_formatters',
  'check_formatting',
  'lint_file',
  'lint_directory',
  'list_linters',
] as const;

export type Tool = typeof TOOL_NAMES[number];

/**
 * How the agent handles tool execution approvals.
 */
export const PERMISSION_MODES = ['yolo', 'ask', 'deny'] as const;
export type PermissionMode = typeof PERMISSION_MODES[number];

/**
 * A tool/function call requested by the LLM.
 */
export interface ToolCall {
  id: ToolCallId;
  name: Tool;
  arguments: string;  // JSON string
}

/**
 * A single message in the conversation.
 */
export const MESSAGE_ROLES = ['user', 'assistant', 'system', 'tool'] as const;
export type MessageRole = typeof MESSAGE_ROLES[number];

export interface BaseMessage {
  role: MessageRole;
  content: string;
}

export interface UserMessage extends BaseMessage {
  role: 'user';
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  tool_calls?: ToolCall[];
}

export interface SystemMessage extends BaseMessage {
  role: 'system';
}

export interface ToolMessage extends BaseMessage {
  role: 'tool';
  name?: string;
  tool_call_id?: ToolCallId;
}

export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;

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
export interface ToolResultSuccess<T = string> {
  data: T;
  error?: never;
  metadata?: Record<string, unknown>;
}

export interface ToolResultError {
  data?: never;
  error: string;
  metadata?: Record<string, unknown>;
}

export type ToolResult<T = string> = ToolResultSuccess<T> | ToolResultError;

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
export interface RunResultSuccess {
  finalOutput: string;
  session: Session;
  turns: number;
}

export interface RunResultMaxTurns {
  finalOutput: 'Max turns reached';
  session: Session;
  turns: number;
}

export type RunResult = RunResultSuccess | RunResultMaxTurns;

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
  id: SessionId;
  messages: Message[];
  workingDirectory: string;
  createdAt: Date;
}
