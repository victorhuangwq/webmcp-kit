import type { Tool } from './define-tool.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = Tool<any>;

const registeredTools = new Set<AnyTool>();

/**
 * Add a tool to the process-wide registry of kit-managed registrations.
 * Called internally by `tool.register()`.
 */
export function trackRegistration(tool: AnyTool): void {
  registeredTools.add(tool);
}

/**
 * Remove a tool from the process-wide registry.
 * Called internally when a tool's AbortSignal fires.
 */
export function untrackRegistration(tool: AnyTool): void {
  registeredTools.delete(tool);
}

/**
 * Snapshot of every tool currently registered via webmcp-kit.
 * Useful for HMR, SPA route teardown, and test cleanup.
 */
export function getRegisteredTools(): readonly AnyTool[] {
  return Array.from(registeredTools);
}

/**
 * Unregister every tool that was registered via webmcp-kit.
 *
 * Iterates a snapshot so the abort listeners can mutate the registry
 * during iteration without affecting the loop.
 */
export function unregisterAll(): void {
  for (const tool of Array.from(registeredTools)) {
    tool.unregister();
  }
}
