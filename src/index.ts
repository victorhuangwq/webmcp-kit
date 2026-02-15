// Core
export {
  defineTool,
  type ToolDefinition,
  type Tool,
} from './core/define-tool.js';
export { zodToJsonSchema } from './core/schema-converter.js';
export {
  textContent,
  jsonContent,
  errorContent,
} from './core/response-helpers.js';

// Mock (for testing and dev)
export {
  toolRegistry,
  createMockAgent,
  getMockModelContext,
  resetMockModelContext,
  type MockAgentOptions,
  type ToolRegistryListener,
} from './mock/index.js';

// Utils
export { isWebMCPSupported, isBrowser } from './utils/index.js';

// Types
export type {
  JSONSchema,
  TextContent,
  ImageContent,
  ResourceContent,
  ContentBlock,
  ToolResponse,
  UserInteractionOptions,
  UserInteractionResult,
  WebMCPAgent,
  ToolAnnotations,
  WebMCPTool,
  ModelContext,
} from './types/index.js';
