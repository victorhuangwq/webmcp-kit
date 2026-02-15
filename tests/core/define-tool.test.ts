import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { defineTool } from '../../src/core/define-tool.js';
import { toolRegistry } from '../../src/mock/tool-registry.js';

describe('defineTool', () => {
  it('creates a tool with correct metadata', () => {
    const tool = defineTool({
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: z.object({
        name: z.string(),
        age: z.number(),
      }),
      execute: async ({ name, age }) => `${name} is ${age}`,
    });

    expect(tool.name).toBe('test-tool');
    expect(tool.description).toBe('A test tool');
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputSchema.type).toBe('object');
  });

  it('executes with valid input', async () => {
    const tool = defineTool({
      name: 'greeter',
      description: 'Greets a person',
      inputSchema: z.object({
        name: z.string(),
      }),
      execute: async ({ name }) => `Hello, ${name}!`,
    });

    const result = await tool.execute({ name: 'World' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Hello, World!',
    });
  });

  it('returns validation error for invalid input', async () => {
    const tool = defineTool({
      name: 'number-tool',
      description: 'Requires a number',
      inputSchema: z.object({
        count: z.number().min(1),
      }),
      execute: async ({ count }) => `Count: ${count}`,
    });

    const result = await tool.execute({ count: -5 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as { text: string }).text).toContain('Validation error');
  });

  it('auto-wraps string returns into ToolResponse', async () => {
    const tool = defineTool({
      name: 'string-returner',
      description: 'Returns a string',
      inputSchema: z.object({}),
      execute: async () => 'Just a string',
    });

    const result = await tool.execute({});

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Just a string' }],
    });
  });

  it('registers with mock modelContext', () => {
    const tool = defineTool({
      name: 'registerable',
      description: 'Can be registered',
      inputSchema: z.object({}),
      execute: async () => 'OK',
    });

    tool.register();

    const registered = toolRegistry.get('registerable');
    expect(registered).toBeDefined();
    expect(registered?.name).toBe('registerable');
  });

  it('unregisters from mock modelContext', () => {
    const tool = defineTool({
      name: 'temporary',
      description: 'Will be removed',
      inputSchema: z.object({}),
      execute: async () => 'OK',
    });

    tool.register();
    expect(toolRegistry.get('temporary')).toBeDefined();

    tool.unregister();
    expect(toolRegistry.get('temporary')).toBeUndefined();
  });

  it('provides agent to execute callback', async () => {
    const mockHandler = vi.fn().mockResolvedValue({ confirmed: true });

    const tool = defineTool({
      name: 'agent-user',
      description: 'Uses agent',
      inputSchema: z.object({}),
      execute: async (_, agent) => {
        const result = await agent.requestUserInteraction({ prompt: 'Confirm?' });
        return result.confirmed ? 'Confirmed' : 'Cancelled';
      },
    });

    const result = await tool.execute({}, {
      requestUserInteraction: mockHandler,
    });

    expect(mockHandler).toHaveBeenCalledWith({ prompt: 'Confirm?' });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: 'Confirmed',
    });
  });

  it('catches execution errors', async () => {
    const tool = defineTool({
      name: 'error-thrower',
      description: 'Throws an error',
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error('Something went wrong');
      },
    });

    const result = await tool.execute({});

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Execution error');
    expect((result.content[0] as { text: string }).text).toContain('Something went wrong');
  });

  it('converts Zod schema to JSON Schema', () => {
    const tool = defineTool({
      name: 'schema-test',
      description: 'Has a schema',
      inputSchema: z.object({
        required: z.string(),
        optional: z.number().optional(),
        withDefault: z.boolean().default(false),
      }),
      execute: async () => 'OK',
    });

    const jsonSchema = tool.inputSchema;

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toBeDefined();
    expect(jsonSchema.properties?.required).toBeDefined();
    expect(jsonSchema.properties?.optional).toBeDefined();
  });
});
