import type {
  ModelContext,
  ModelContextRegisterToolOptions,
  WebMCPTool,
} from '../types/index.js';
import { toolRegistry } from './tool-registry.js';

/**
 * Spec-compliant mock of navigator.modelContext.
 *
 * Mirrors the latest WebMCP spec: only `registerTool` is exposed, and tools
 * are removed by aborting the AbortSignal passed via options.
 */
class MockModelContext implements ModelContext {
  registerTool(tool: WebMCPTool, options?: ModelContextRegisterToolOptions): void {
    const signal = options?.signal;
    if (signal?.aborted) {
      return;
    }

    toolRegistry.register(tool);

    if (signal) {
      signal.addEventListener(
        'abort',
        () => toolRegistry.unregister(tool.name),
        { once: true }
      );
    }
  }
}

let mockModelContext: MockModelContext | null = null;

/**
 * Get the mock ModelContext instance.
 * Creates it lazily on first access.
 */
export function getMockModelContext(): ModelContext {
  if (!mockModelContext) {
    mockModelContext = new MockModelContext();
  }
  return mockModelContext;
}

/**
 * Reset the mock for testing.
 */
export function resetMockModelContext(): void {
  mockModelContext = null;
  toolRegistry.clear();
}
