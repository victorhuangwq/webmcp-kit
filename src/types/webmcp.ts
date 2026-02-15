/**
 * WebMCP Spec Types
 * Based on the W3C WebMCP specification (Chrome 146 Early Preview)
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
 * Options for requestUserInteraction
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
 * The agent object passed to tool execute callbacks
 * Provides browser-mediated interaction capabilities
 */
export interface WebMCPAgent {
  /**
   * Request user interaction during tool execution.
   * Can be invoked multiple times within a single execution.
   */
  requestUserInteraction(
    options?: UserInteractionOptions
  ): Promise<UserInteractionResult>;
}

/**
 * Tool annotations for metadata
 */
export interface ToolAnnotations {
  /** Indicates the tool does not modify external state */
  readOnlyHint?: boolean;
  /** Indicates the tool may have destructive side effects */
  destructiveHint?: boolean;
  /** Human-in-the-loop confirmation recommended */
  confirmationHint?: boolean;
  /** Custom annotations */
  [key: string]: unknown;
}

/**
 * The raw tool shape expected by navigator.modelContext.registerTool()
 */
export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  execute: (input: unknown, agent: WebMCPAgent) => Promise<ToolResponse>;
  annotations?: ToolAnnotations;
}

/**
 * The navigator.modelContext API surface
 */
export interface ModelContext {
  provideContext(context: { tools: WebMCPTool[] }): void;
  clearContext(): void;
  registerTool(tool: WebMCPTool): void;
  unregisterTool(name: string): void;
}

/**
 * The navigator.modelContextTesting API surface (for agents/extensions)
 * Available when WebMCP flag is enabled in Chrome
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
