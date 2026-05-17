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
export {
  getRegisteredTools,
  unregisterAll,
} from './core/registration-tracker.js';

// Mock (for testing and dev)
export {
  toolRegistry,
  createMockClient,
  getMockModelContext,
  resetMockModelContext,
  type MockClientOptions,
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
  ModelContextClient,
  ToolAnnotations,
  WebMCPTool,
  ModelContext,
  ModelContextRegisterToolOptions,
} from './types/index.js';
