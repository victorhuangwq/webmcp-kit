import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { defineTool } from '../../src/core/define-tool.js';
import {
  getRegisteredTools,
  unregisterAll,
} from '../../src/core/registration-tracker.js';
import { toolRegistry } from '../../src/mock/tool-registry.js';

describe('registration tracker', () => {
  beforeEach(() => {
    unregisterAll();
    toolRegistry.clear();
  });

  it('reflects registered tools in getRegisteredTools()', () => {
    const a = defineTool({
      name: 'a',
      description: 'a',
      inputSchema: z.object({}),
      execute: async () => 'OK',
    });
    const b = defineTool({
      name: 'b',
      description: 'b',
      inputSchema: z.object({}),
      execute: async () => 'OK',
    });

    expect(getRegisteredTools()).toHaveLength(0);

    a.register();
    expect(getRegisteredTools().map((t) => t.name)).toEqual(['a']);

    b.register();
    expect(getRegisteredTools().map((t) => t.name).sort()).toEqual(['a', 'b']);

    a.unregister();
    expect(getRegisteredTools().map((t) => t.name)).toEqual(['b']);
  });

  it('unregisterAll() clears every kit-registered tool', () => {
    const tools = ['x', 'y', 'z'].map((name) =>
      defineTool({
        name,
        description: name,
        inputSchema: z.object({}),
        execute: async () => 'OK',
      })
    );

    for (const t of tools) t.register();

    expect(getRegisteredTools()).toHaveLength(3);
    expect(toolRegistry.getAll()).toHaveLength(3);

    unregisterAll();

    expect(getRegisteredTools()).toHaveLength(0);
    expect(toolRegistry.getAll()).toHaveLength(0);
  });

  it('re-registering after unregisterAll() works', () => {
    const tool = defineTool({
      name: 'phoenix',
      description: 'rises again',
      inputSchema: z.object({}),
      execute: async () => 'OK',
    });

    tool.register();
    unregisterAll();
    expect(getRegisteredTools()).toHaveLength(0);

    tool.register();
    expect(getRegisteredTools().map((t) => t.name)).toEqual(['phoenix']);
    expect(toolRegistry.get('phoenix')).toBeDefined();
  });
});
