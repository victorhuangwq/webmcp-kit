import type { z } from 'zod';
import type {
  JSONSchema,
  WebMCPAgent,
  WebMCPTool,
  ToolResponse,
  ToolAnnotations,
} from '../types/index.js';
import { zodToJsonSchema } from './schema-converter.js';
import { wrapResponse, errorContent } from './response-helpers.js';
import { isWebMCPSupported } from '../utils/feature-detect.js';
import { getMockModelContext } from '../mock/model-context.js';
import { createMockAgent } from '../mock/agent.js';

/**
 * Tool definition input - what you pass to defineTool()
 */
export interface ToolDefinition<TSchema extends z.ZodTypeAny> {
  /** Unique identifier for the tool */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** Zod schema defining the input parameters */
  inputSchema: TSchema;

  /**
   * The implementation function.
   * Receives validated input and an agent for user interaction.
   * Can return a string (auto-wrapped) or a full ToolResponse.
   */
  execute: (
    input: z.infer<TSchema>,
    agent: WebMCPAgent
  ) => Promise<string | ToolResponse>;

  /** Optional tool annotations/metadata */
  annotations?: ToolAnnotations;
}

/**
 * Tool instance - what defineTool() returns
 */
export interface Tool<TSchema extends z.ZodTypeAny> {
  /** The tool name */
  readonly name: string;

  /** The tool description */
  readonly description: string;

  /** The original Zod schema */
  readonly schema: TSchema;

  /** The converted JSON Schema */
  readonly inputSchema: JSONSchema;

  /** Tool annotations if provided */
  readonly annotations?: ToolAnnotations;

  /**
   * Register this tool with navigator.modelContext.
   * Falls back to mock in dev mode.
   */
  register(): void;

  /**
   * Unregister this tool from navigator.modelContext.
   */
  unregister(): void;

  /**
   * Execute the tool directly (for testing).
   * Validates input before calling the execute callback.
   */
  execute(input: z.infer<TSchema>, agent?: WebMCPAgent): Promise<ToolResponse>;

  /**
   * Get the raw WebMCP tool shape for direct use.
   */
  toWebMCPTool(): WebMCPTool;
}

/**
 * Define a type-safe WebMCP tool.
 *
 * @example
 * ```typescript
 * import { defineTool } from 'webmcp-kit';
 * import { z } from 'zod';
 *
 * const addToCart = defineTool({
 *   name: 'add-to-cart',
 *   description: 'Add a product to the shopping cart',
 *   inputSchema: z.object({
 *     productId: z.string().describe('The product ID'),
 *     quantity: z.number().min(1).describe('Number of items'),
 *   }),
 *   execute: async ({ productId, quantity }, agent) => {
 *     // agent.requestUserInteraction() is available here
 *     await cart.add(productId, quantity);
 *     return `Added ${quantity}x ${productId} to cart`;
 *   },
 * });
 *
 * addToCart.register();
 * ```
 */
export function defineTool<TSchema extends z.ZodTypeAny>(
  definition: ToolDefinition<TSchema>
): Tool<TSchema> {
  const { name, description, inputSchema: zodSchema, execute, annotations } = definition;

  // Convert Zod schema to JSON Schema at definition time
  const jsonSchema = zodToJsonSchema(zodSchema);

  /**
   * Wrap the execute callback to:
   * 1. Validate input against the Zod schema
   * 2. Auto-wrap string/object returns into ToolResponse format
   * 3. Catch errors and return error responses
   */
  const wrappedExecute = async (
    input: unknown,
    agent: WebMCPAgent
  ): Promise<ToolResponse> => {
    // Validate input using Zod
    const parseResult = zodSchema.safeParse(input);

    if (!parseResult.success) {
      // Zod v4 uses .issues instead of .errors
      const issues = (parseResult.error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues ?? [];
      const errorMessage = issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      return errorContent(`Validation error: ${errorMessage || parseResult.error.message}`);
    }

    try {
      const result = await execute(parseResult.data, agent);
      return wrapResponse(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return errorContent(`Execution error: ${message}`);
    }
  };

  /**
   * Build the raw WebMCP tool shape
   */
  const toWebMCPTool = (): WebMCPTool => ({
    name,
    description,
    inputSchema: jsonSchema,
    execute: wrappedExecute,
    ...(annotations && { annotations }),
  });

  /**
   * Get the appropriate ModelContext (native or mock)
   */
  const getContext = () => {
    if (isWebMCPSupported()) {
      return navigator.modelContext!;
    }

    // Log helpful message in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      console.debug(
        `[webmcp-kit] Using mock modelContext for tool "${name}". ` +
          'Native WebMCP not available.'
      );
    }

    return getMockModelContext();
  };

  return {
    name,
    description,
    schema: zodSchema,
    inputSchema: jsonSchema,
    annotations,

    register() {
      getContext().registerTool(toWebMCPTool());
    },

    unregister() {
      getContext().unregisterTool(name);
    },

    async execute(input, agent) {
      // Create default mock agent if not provided
      const effectiveAgent = agent ?? createMockAgent();
      return wrappedExecute(input, effectiveAgent);
    },

    toWebMCPTool,
  };
}
