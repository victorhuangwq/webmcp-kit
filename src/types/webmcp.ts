/**
 * WebMCP Spec Types
 * Based on the W3C WebMCP specification:
 * https://webmachinelearning.github.io/webmcp/
 */

/**
 * JSON Schema type for tool inputSchema
 */
export type JSONSchema = {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  enum?: (string | number | boolean | null)[];
  const?: unknown;
  default?: unknown;
  additionalProperties?: boolean | JSONSchema;
  [key: string]: unknown;
};

/**
 * Content block types for tool responses
 */
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface ResourceContent {
  type: 'resource';
  uri: string;
  mimeType?: string;
}

export type ContentBlock = TextContent | ImageContent | ResourceContent;

/**
 * The response format returned by tool execute callbacks
 */
export interface ToolResponse {
  content: ContentBlock[];
  isError?: boolean;
}

/**
 * Options for requestUserInteraction (kit-level ergonomic surface).
 *
 * The native spec defines `requestUserInteraction(callback)` where the
 * callback returns a promise — webmcp-kit wraps that with this higher-level
 * options bag, translating to dialogs/prompts in mock mode.
 */
export interface UserInteractionOptions {
  prompt?: string;
  type?: 'confirmation' | 'input' | 'selection';
  choices?: string[];
}

/**
 * Result from requestUserInteraction
 */
export interface UserInteractionResult {
  confirmed?: boolean;
  value?: string;
  selection?: string;
}

/**
 * The client object passed to tool execute callbacks.
 * Provides browser-mediated interaction capabilities.
 *
 * Named after the spec's `ModelContextClient` interface.
 */
export interface ModelContextClient {
  /**
   * Request user interaction during tool execution.
   * Can be invoked multiple times within a single execution.
   */
  requestUserInteraction(
    options?: UserInteractionOptions
  ): Promise<UserInteractionResult>;
}

/**
 * Tool annotations for metadata, matching the spec's ToolAnnotations.
 */
export interface ToolAnnotations {
  /** Indicates the tool does not modify external state */
  readOnlyHint?: boolean;
  /** Indicates the tool may surface untrusted third-party content to the model */
  untrustedContentHint?: boolean;
}

/**
 * The raw tool shape expected by navigator.modelContext.registerTool()
 */
export interface WebMCPTool {
  name: string;
  /** Optional human-friendly title (USVString in the spec) */
  title?: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: unknown, client: ModelContextClient) => Promise<ToolResponse>;
  annotations?: ToolAnnotations;
}

/**
 * Options bag accepted by navigator.modelContext.registerTool().
 * Aborting `signal` unregisters the tool.
 */
export interface ModelContextRegisterToolOptions {
  signal?: AbortSignal;
}

/**
 * The navigator.modelContext API surface.
 *
 * Per the latest spec, `registerTool` is the only method. Tools are
 * unregistered by aborting the AbortSignal passed at registration time —
 * there is no longer a `provideContext`, `clearContext`, or `unregisterTool`.
 */
export interface ModelContext {
  registerTool(
    tool: WebMCPTool,
    options?: ModelContextRegisterToolOptions
  ): void;
}

/**
 * The navigator.modelContextTesting API surface (for agents/extensions).
 *
 * Not part of the current spec, but Chrome 146 Early Preview still exposes
 * it, and the dev panel relies on it in native mode.
 */
export interface ModelContextTesting {
  /** List all registered tools */
  listTools(): WebMCPTool[];

  /** Execute a tool by name (inputArgs should be JSON string) */
  executeTool(name: string, inputArgs: string): Promise<ToolResponse>;

  /** Register a callback for when tools change */
  registerToolsChangedCallback(callback: () => void): void;
}

/**
 * Augment the Navigator interface for TypeScript
 */
declare global {
  interface Navigator {
    modelContext?: ModelContext;
    modelContextTesting?: ModelContextTesting;
  }
}
