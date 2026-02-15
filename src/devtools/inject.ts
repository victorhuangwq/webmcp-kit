import { panelStyles } from './styles.js';
import { createPanel } from './panel.js';
import { isBrowser } from '../utils/feature-detect.js';

let panelContainer: HTMLElement | null = null;

export interface DevPanelOptions {
  /** Initial position */
  position?: { bottom?: number; right?: number };
}

/**
 * Inject the dev panel into the page
 * Uses Shadow DOM for style encapsulation
 */
export function injectDevPanel(options?: DevPanelOptions): () => void {
  if (!isBrowser()) {
    console.warn('[webmcp-kit] Dev panel can only be injected in browser environment');
    return () => {};
  }

  if (panelContainer) {
    console.warn('[webmcp-kit] Dev panel already injected');
    return () => removeDevPanel();
  }

  // Create container element
  panelContainer = document.createElement('div');
  panelContainer.id = 'webmcp-devtools';

  // Attach shadow DOM for style encapsulation
  const shadow = panelContainer.attachShadow({ mode: 'open' });

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = panelStyles;
  shadow.appendChild(styleEl);

  // Create and mount panel
  const panel = createPanel();

  // Apply custom position if provided
  if (options?.position) {
    if (options.position.bottom !== undefined) {
      panel.style.bottom = `${options.position.bottom}px`;
    }
    if (options.position.right !== undefined) {
      panel.style.right = `${options.position.right}px`;
    }
  }

  shadow.appendChild(panel);

  // Add to document
  document.body.appendChild(panelContainer);

  console.debug('[webmcp-kit] Dev panel injected');

  return () => removeDevPanel();
}

/**
 * Remove the dev panel from the page
 */
export function removeDevPanel(): void {
  if (panelContainer && panelContainer.parentNode) {
    panelContainer.parentNode.removeChild(panelContainer);
    panelContainer = null;
    console.debug('[webmcp-kit] Dev panel removed');
  }
}

/**
 * Enable dev mode - injects the dev panel
 * Safe to call in any environment (no-op in Node.js or if already injected)
 */
export function enableDevMode(options?: DevPanelOptions): void {
  if (!isBrowser()) {
    return;
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectDevPanel(options);
    });
  } else {
    injectDevPanel(options);
  }
}
