import type { WebMCPTool } from '../types/index.js';

export type ToolRegistryListener = (tools: WebMCPTool[]) => void;

/**
 * Observable registry for WebMCP tools
 * Used by the mock modelContext and dev panel
 */
class ToolRegistry {
  private tools = new Map<string, WebMCPTool>();
  private listeners = new Set<ToolRegistryListener>();

  /**
   * Register a tool
   */
  register(tool: WebMCPTool): void {
    this.tools.set(tool.name, tool);
    this.notify();
  }

  /**
   * Unregister a tool by name
   */
  unregister(name: string): void {
    this.tools.delete(name);
    this.notify();
  }

  /**
   * Replace all tools
   */
  setAll(tools: WebMCPTool[]): void {
    this.tools.clear();
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
    this.notify();
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.notify();
  }

  /**
   * Get a tool by name
   */
  get(name: string): WebMCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAll(): WebMCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Subscribe to tool registry changes
   * Returns unsubscribe function
   */
  subscribe(listener: ToolRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notify(): void {
    const tools = this.getAll();
    for (const listener of this.listeners) {
      listener(tools);
    }
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
