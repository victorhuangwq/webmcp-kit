import { z } from 'zod';
import type { JSONSchema } from '../types/index.js';

/**
 * Convert a Zod schema to JSON Schema using Zod v4's native conversion
 */
export function zodToJsonSchema<T extends z.ZodTypeAny>(schema: T): JSONSchema {
  // Zod v4 has z.toJSONSchema() as a function on the z namespace
  return z.toJSONSchema(schema) as JSONSchema;
}
