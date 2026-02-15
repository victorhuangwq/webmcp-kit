/**
 * Encapsulated CSS for the dev panel
 * These styles are injected into a Shadow DOM to prevent conflicts
 */
export const panelStyles = `
  :host {
    --panel-bg: #1e1e2e;
    --panel-surface: #313244;
    --panel-text: #cdd6f4;
    --panel-text-muted: #a6adc8;
    --panel-border: #45475a;
    --panel-accent: #89b4fa;
    --panel-success: #a6e3a1;
    --panel-error: #f38ba8;
    --panel-warning: #f9e2af;
    --font-mono: ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .webmcp-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    font-family: var(--font-sans);
    font-size: 13px;
    color: var(--panel-text);
    z-index: 999999;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .webmcp-panel.minimized {
    width: auto;
    max-height: none;
  }

  .webmcp-panel.minimized .panel-body {
    display: none;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--panel-border);
    background: var(--panel-surface);
    cursor: grab;
    user-select: none;
  }

  .panel-title {
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-badge {
    background: var(--panel-accent);
    color: var(--panel-bg);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .panel-native {
    background: var(--panel-success);
    color: var(--panel-bg);
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .panel-controls {
    display: flex;
    gap: 4px;
  }

  .panel-btn {
    background: none;
    border: none;
    color: var(--panel-text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.15s;
  }

  .panel-btn:hover {
    background: var(--panel-border);
    color: var(--panel-text);
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;
    color: var(--panel-text-muted);
  }

  .empty-state p {
    margin-bottom: 8px;
  }

  .empty-state code {
    font-family: var(--font-mono);
    font-size: 12px;
    background: var(--panel-surface);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .tool-list {
    list-style: none;
  }

  .tool-item {
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tool-item:hover {
    border-color: var(--panel-accent);
    background: rgba(137, 180, 250, 0.05);
  }

  .tool-name {
    font-weight: 600;
    font-family: var(--font-mono);
    font-size: 13px;
    margin-bottom: 4px;
  }

  .tool-description {
    font-size: 12px;
    color: var(--panel-text-muted);
    line-height: 1.4;
  }

  .tool-tester {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tool-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--panel-border);
  }

  .back-btn {
    background: none;
    border: none;
    color: var(--panel-text-muted);
    cursor: pointer;
    padding: 4px;
    font-size: 16px;
    line-height: 1;
  }

  .back-btn:hover {
    color: var(--panel-text);
  }

  .input-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .input-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .input-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--panel-text-muted);
  }

  .input-label .required {
    color: var(--panel-error);
  }

  .input-hint {
    font-size: 11px;
    color: var(--panel-text-muted);
    font-style: italic;
  }

  .input-control {
    background: var(--panel-surface);
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    padding: 8px 10px;
    color: var(--panel-text);
    font-family: var(--font-mono);
    font-size: 13px;
    transition: border-color 0.15s;
  }

  .input-control:focus {
    outline: none;
    border-color: var(--panel-accent);
  }

  .input-control::placeholder {
    color: var(--panel-text-muted);
  }

  select.input-control {
    cursor: pointer;
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .checkbox-wrapper input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .execute-btn {
    background: var(--panel-accent);
    color: var(--panel-bg);
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .execute-btn:hover {
    opacity: 0.9;
  }

  .execute-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .result-container {
    background: var(--panel-surface);
    border-radius: 8px;
    overflow: hidden;
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid var(--panel-border);
  }

  .result-status {
    font-size: 12px;
    font-weight: 500;
  }

  .result-status.success {
    color: var(--panel-success);
  }

  .result-status.error {
    color: var(--panel-error);
  }

  .result-time {
    font-size: 11px;
    color: var(--panel-text-muted);
    font-family: var(--font-mono);
  }

  .result-content {
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 150px;
    overflow-y: auto;
    line-height: 1.5;
  }
`;
