import type { z } from 'zod';
import type {
  JSONSchema,
  ModelContextClient,
  WebMCPTool,
  ToolResponse,
  ToolAnnotations,
} from '../types/index.js';
import { zodToJsonSchema } from './schema-converter.js';
import { wrapResponse, errorContent } from './response-helpers.js';
import { isWebMCPSupported } from '../utils/feature-detect.js';
import { getMockModelContext } from '../mock/model-context.js';
import { createMockClient } from '../mock/client.js';
import {
  trackRegistration,
  untrackRegistration,
} from './registration-tracker.js';

/**
 * Tool definition input - what you pass to defineTool()
 */
export interface ToolDefinition<TSchema extends z.ZodTypeAny> {
  /** Unique identifier for the tool */
  name: string;

  /** Optional human-friendly title */
  title?: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** Zod schema defining the input parameters */
  inputSchema: TSchema;

  /**
   * The implementation function.
   * Receives validated input and a client for user interaction.
   * Can return a string (auto-wrapped) or a full ToolResponse.
   */
  execute: (
    input: z.infer<TSchema>,
    client: ModelContextClient
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

  /** Optional tool title */
  readonly title?: string;

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
   *
   * Idempotent: calling on an already-registered tool is a no-op.
   * The kit owns an internal AbortController per registration; call
   * `unregister()` to abort it.
   */
  register(): void;

  /**
   * Unregister this tool by aborting its internal AbortSignal.
   * Safe to call when not registered (no-op).
   */
  unregister(): void;

  /**
   * Execute the tool directly (for testing).
   * Validates input before calling the execute callback.
   */
  execute(input: z.infer<TSchema>, client?: ModelContextClient): Promise<ToolResponse>;

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
 *   execute: async ({ productId, quantity }, client) => {
 *     // client.requestUserInteraction() is available here
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
  const {
    name,
    title,
    description,
    inputSchema: zodSchema,
    execute,
    annotations,
  } = definition;

  const jsonSchema = zodToJsonSchema(zodSchema);

  const wrappedExecute = async (
    input: unknown,
    client: ModelContextClient
  ): Promise<ToolResponse> => {
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
      const result = await execute(parseResult.data, client);
      return wrapResponse(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return errorContent(`Execution error: ${message}`);
    }
  };

  const toWebMCPTool = (): WebMCPTool => ({
    name,
    ...(title !== undefined && { title }),
    description,
    inputSchema: jsonSchema,
    execute: wrappedExecute,
    ...(annotations && { annotations }),
  });

  // Per-tool AbortController, recreated on every successful register().
  let controller: AbortController | null = null;

  const tool: Tool<TSchema> = {
    name,
    title,
    description,
    schema: zodSchema,
    inputSchema: jsonSchema,
    annotations,

    register() {
      if (controller) {
        // Already registered — idempotent.
        return;
      }

      const localController = new AbortController();
      controller = localController;

      localController.signal.addEventListener(
        'abort',
        () => {
          if (controller === localController) {
            controller = null;
          }
          untrackRegistration(tool);
        },
        { once: true }
      );

      const webmcpTool = toWebMCPTool();
      const options = { signal: localController.signal };

      if (isWebMCPSupported()) {
        navigator.modelContext!.registerTool(webmcpTool, options);
      } else {
        getMockModelContext().registerTool(webmcpTool, options);
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.debug(
            `[webmcp-kit] Using mock modelContext for tool "${name}". ` +
              'Native WebMCP not available.'
          );
        }
      }

      trackRegistration(tool);
    },

    unregister() {
      controller?.abort();
    },

    async execute(input, client) {
      const effectiveClient = client ?? createMockClient();
      return wrappedExecute(input, effectiveClient);
    },

    toWebMCPTool,
  };

  return tool;
}
