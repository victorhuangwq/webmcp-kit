import type { ModelContext, WebMCPTool } from '../types/index.js';
import { toolRegistry } from './tool-registry.js';

/**
 * Spec-compliant mock of navigator.modelContext
 * Used when the native API is not available
 */
class MockModelContext implements ModelContext {
  provideContext(context: { tools: WebMCPTool[] }): void {
    toolRegistry.setAll(context.tools);
  }

  clearContext(): void {
    toolRegistry.clear();
  }

  registerTool(tool: WebMCPTool): void {
    toolRegistry.register(tool);
  }

  unregisterTool(name: string): void {
    toolRegistry.unregister(name);
  }
}

// Singleton instance
let mockModelContext: MockModelContext | null = null;

/**
 * Get the mock ModelContext instance
 * Creates it lazily on first access
 */
export function getMockModelContext(): ModelContext {
  if (!mockModelContext) {
    mockModelContext = new MockModelContext();
  }
  return mockModelContext;
}

/**
 * Reset the mock for testing
 */
export function resetMockModelContext(): void {
  mockModelContext = null;
  toolRegistry.clear();
}
