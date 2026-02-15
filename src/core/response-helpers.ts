import type { ToolResponse } from '../types/index.js';

/**
 * Create a text content response
 */
export function textContent(text: string): ToolResponse {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Create a JSON content response
 * Stringifies the object with proper formatting
 */
export function jsonContent(obj: unknown): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(obj, null, 2),
      },
    ],
  };
}

/**
 * Create an error response
 */
export function errorContent(message: string): ToolResponse {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

/**
 * Wrap a string or object into a ToolResponse
 * - String -> textContent
 * - Object with content array -> pass through
 * - Other object -> jsonContent
 */
export function wrapResponse(result: unknown): ToolResponse {
  if (typeof result === 'string') {
    return textContent(result);
  }

  if (
    result !== null &&
    typeof result === 'object' &&
    'content' in result &&
    Array.isArray((result as ToolResponse).content)
  ) {
    return result as ToolResponse;
  }

  return jsonContent(result);
}
