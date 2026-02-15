# webmcp-kit

Type-safe WebMCP tools with Zod.

## What is WebMCP?

[WebMCP](https://github.com/webmachinelearning/webmcp) is a browser API that lets websites expose tools to AI agent, developed under the WebML working group.

The API adds `navigator.modelContext`, which websites use to register tools that agents can discover and call. Think of it like making your site's functionality available to AI assistants.

Major browsers are starting to experiment with implementations.
- Chrome:
  - [WebMCP is available for early preview](https://developer.chrome.com/blog/webmcp-epp)
  - [WebMCP early preview](https://docs.google.com/document/d/1rtU1fRPS0bMqd9abMG_hc6K9OAI6soUy3Kh00toAgyk/edit?tab=t.0)

## What does webmcp-kit do?

webmcp-kit is a type-safe library that wraps the WebMCP API to make it easier to use. The raw API works, but has some rough edges:

- **No type safety** — `inputSchema` is raw JSON Schema, `execute` receives `unknown`
- **Manual JSON Schema** — Writing schemas by hand is verbose and error-prone
- **No dev tooling** — Hard to test tools without a real agent
- **Boilerplate** — Checking if `navigator.modelContext` exists, formatting responses

```typescript
import { defineTool } from 'webmcp-kit';
import { z } from 'zod';

const addToCart = defineTool({
  name: 'addToCart',
  description: 'Add a product to cart',
  inputSchema: z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  }),
  execute: async ({ productId, quantity }) => {
    // productId and quantity are typed
    return `Added ${quantity}x ${productId}`;
  },
});

addToCart.register();
```

**What you get:**

- **Zod schemas** — Define inputs once, get JSON Schema conversion and TypeScript inference
- **Declarative registration** — Call `.register()` once, the library handles `navigator.modelContext`
- **Automatic feature detection** — Works when the API exists, falls back gracefully when it doesn't
- **Built-in validation** — Inputs are validated against your schema before `execute` runs
- **Dev panel** — Test tools in the browser without needing an agent

## Install

```bash
npm install webmcp-kit zod
```

Requires Zod v4.

## Usage

### Define a Tool

```typescript
import { defineTool } from 'webmcp-kit';
import { z } from 'zod';

const searchProducts = defineTool({
  name: 'searchProducts',
  description: 'Search the product catalog',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ query, limit }) => {
    const results = await db.products.search(query, limit);
    return JSON.stringify(results);
  },
});

searchProducts.register();
```

The schema is converted to JSON Schema for the WebMCP API. Your `execute` function receives typed inputs.

### User Interaction

Tools can request confirmation or input from the user:

```typescript
const checkout = defineTool({
  name: 'checkout',
  description: 'Complete purchase',
  inputSchema: z.object({ cartId: z.string() }),
  execute: async ({ cartId }, agent) => {
    const { confirmed } = await agent.requestUserInteraction({
      prompt: 'Confirm purchase?',
      type: 'confirmation',
    });

    if (!confirmed) return 'Cancelled';

    await processOrder(cartId);
    return 'Order placed';
  },
});
```

### Response Helpers

```typescript
import { textContent, jsonContent, errorContent } from 'webmcp-kit';

// String responses are auto-wrapped, but you can be explicit:
return textContent('Done');
return jsonContent({ status: 'ok' });
return errorContent('Something went wrong');
```

### Dev Panel

Test tools without a real agent:

```typescript
import { enableDevMode } from 'webmcp-kit/devtools';

enableDevMode();
```

This injects a panel that lists your tools, generates input forms from schemas, and lets you execute them.

## API

### `defineTool(options)`

```typescript
const tool = defineTool({
  name: string,
  description: string,
  inputSchema: ZodSchema,
  execute: (input, agent) => Promise<string | ToolResponse>,
  annotations?: ToolAnnotations,
});

tool.register();   // Add to navigator.modelContext
tool.unregister(); // Remove from navigator.modelContext
tool.execute(input); // Call directly (for testing)
```

### `enableDevMode()`

```typescript
import { enableDevMode } from 'webmcp-kit/devtools';

enableDevMode();
```

## How It Works

`defineTool()` creates a tool object. When you call `.register()`:

1. It checks if `navigator.modelContext` exists
2. If yes, registers with the native API
3. If no, registers with an internal mock (so the dev panel still works)

Your code doesn't change based on environment. When browsers ship WebMCP support, the same code will use the real API.

## Examples

See [`examples/pizza-shop`](./examples/pizza-shop) for a working demo.

## License

MIT
