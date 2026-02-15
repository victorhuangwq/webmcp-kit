/**
 * Check if the native WebMCP API is available
 */
export function isWebMCPSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'modelContext' in navigator &&
    navigator.modelContext !== undefined
  );
}

/**
 * Check if the testing/agent API is available
 * This is available when navigator.modelContext exists
 */
export function isWebMCPTestingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'modelContextTesting' in navigator &&
    navigator.modelContextTesting !== undefined
  );
}

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
