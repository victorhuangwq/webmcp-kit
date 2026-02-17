---
name: webmcp
description: Build and manage WebMCP tools using webmcp-kit. Use for: (1) Adding new WebMCP tools to a website, (2) Editing or modifying existing webmcp-kit tools, (3) Debugging tools that aren't working, (4) Testing WebMCP tools, (5) Best practices for AI-agent-accessible websites. Triggers include "add webmcp tool", "edit my webmcp tool", "my tool isn't working", "test webmcp", "make site work with AI agents".
---

# WebMCP Tools with webmcp-kit

## Adding New Tools

### 1. Explore First

Check `package.json` for framework and existing dependencies. Look for existing tools in common locations:
- `src/mcp-tools.ts`, `src/lib/mcp-tools.ts`, `src/mcp/*.ts`

### 2. Define the Tool

```typescript
import { defineTool, jsonContent } from 'webmcp-kit';
import { z } from 'zod';

export const myTool = defineTool({
  name: 'toolName',  // camelCase, specific (searchProducts not search)
  description: 'What it does - agents use this to decide when to call it',
  inputSchema: z.object({
    query: z.string().describe('Always add .describe()'),
    limit: z.number().min(1).max(50).default(10).describe('Use .default() for optional'),
  }),
  execute: async (input, agent) => {
    const result = await doSomething(input);
    return jsonContent(result);  // or just return string
  },
});

myTool.register();
```

### 3. For Destructive Actions

```typescript
const deleteTool = defineTool({
  // ...
  annotations: { destructiveHint: true },  // or confirmationHint: true
  execute: async (input, agent) => {
    const { confirmed } = await agent.requestUserInteraction({
      prompt: 'Are you sure?',
      type: 'confirmation',
    });
    if (!confirmed) return 'Cancelled';
    // proceed...
  },
});
```

### 4. Setup (New Projects Only)

```bash
npm install webmcp-kit zod
```

Register in app entry and enable dev mode:
```typescript
import { myTool } from './mcp-tools';
import { enableDevMode } from 'webmcp-kit/devtools';

myTool.register();
enableDevMode();  // Shows test panel in browser
```

## Editing Existing Tools

1. Find tools: search for `defineTool(` in the codebase
2. Tools are registered with `.register()` - find where this is called
3. Modify the tool definition, then test with dev panel

Common edits:
- **Change input schema**: Update the `inputSchema` Zod object
- **Add validation**: Use `.min()`, `.max()`, `.regex()` on schema fields
- **Change behavior**: Modify the `execute` function
- **Add confirmation**: Add `annotations` and `agent.requestUserInteraction()`

## Debugging

### Tool Not Appearing in Dev Panel

- Check `.register()` is called
- Check dev panel is enabled: `enableDevMode()` in browser entry
- Check console for `[webmcp-kit]` messages

### Validation Errors

Error format: `Validation error: fieldName: message`

- Missing `.describe()` won't cause errors but hurts agent understanding
- Check Zod schema matches expected input types
- Use `.optional()` or `.default()` for non-required fields

### Execute Errors

Error format: `Execution error: message`

- Check the `execute` function for runtime errors
- Test the underlying logic independently
- Add try/catch within execute for better error messages

### Console Debug Messages

When native WebMCP isn't available, you'll see:
```
[webmcp-kit] Using mock modelContext for tool "toolName". Native WebMCP not available.
```
This is normal - the dev panel still works.

## Testing

### Dev Panel (Browser)

1. `enableDevMode()` injects panel at bottom-right
2. Select tool, fill inputs, click Execute
3. Results appear in panel

### Direct Execution (Code/Tests)

```typescript
const result = await myTool.execute({ query: 'test', limit: 5 });
// result is a ToolResponse with content array
```

### Schema Inspection

```typescript
console.log(myTool.inputSchema);  // JSON Schema
console.log(myTool.schema);       // Original Zod schema
```

## Schema Patterns

```typescript
z.string()                           // Required string
z.string().optional()                // Optional
z.string().default('value')          // Default value
z.number().min(1).max(100)           // Bounded number
z.enum(['a', 'b', 'c'])              // Fixed options
z.array(z.string())                  // Array of strings
z.object({}).describe('Empty input') // No inputs needed
```
