import type { WebMCPTool, ToolResponse, JSONSchema } from '../types/index.js';
import { toolRegistry } from '../mock/tool-registry.js';
import { createMockAgent } from '../mock/agent.js';

interface PanelState {
  selectedTool: WebMCPTool | null;
  isMinimized: boolean;
  lastResult: { response: ToolResponse; time: number } | null;
  isExecuting: boolean;
}

/**
 * Create the dev panel DOM structure
 * Built with vanilla JS for zero dependencies
 */
export function createPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'webmcp-panel';

  // State
  const state: PanelState = {
    selectedTool: null,
    isMinimized: false,
    lastResult: null,
    isExecuting: false,
  };

  // Initial render
  render();

  // Subscribe to tool registry changes
  toolRegistry.subscribe(() => {
    // If selected tool was removed, deselect it
    if (state.selectedTool && !toolRegistry.get(state.selectedTool.name)) {
      state.selectedTool = null;
      state.lastResult = null;
    }
    render();
  });

  function render(): void {
    const tools = toolRegistry.getAll();

    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">
          <span>WebMCP DevTools</span>
          <span class="panel-badge">${tools.length}</span>
        </div>
        <div class="panel-controls">
          <button class="panel-btn" data-action="minimize" title="${state.isMinimized ? 'Expand' : 'Minimize'}">
            ${state.isMinimized ? '□' : '−'}
          </button>
        </div>
      </div>
      ${!state.isMinimized ? `
        <div class="panel-body">
          ${tools.length === 0 ? renderEmptyState() : ''}
          ${tools.length > 0 && !state.selectedTool ? renderToolList(tools) : ''}
          ${state.selectedTool ? renderToolTester(state.selectedTool) : ''}
        </div>
      ` : ''}
    `;

    panel.classList.toggle('minimized', state.isMinimized);
    attachEventListeners();
  }

  function renderEmptyState(): string {
    return `
      <div class="empty-state">
        <p>No tools registered</p>
        <p><code>defineTool({...}).register()</code></p>
      </div>
    `;
  }

  function renderToolList(tools: WebMCPTool[]): string {
    return `
      <ul class="tool-list">
        ${tools.map(tool => `
          <li class="tool-item" data-tool="${escapeAttr(tool.name)}">
            <div class="tool-name">${escapeHtml(tool.name)}</div>
            <div class="tool-description">${escapeHtml(tool.description)}</div>
          </li>
        `).join('')}
      </ul>
    `;
  }

  function renderToolTester(tool: WebMCPTool): string {
    const schema = tool.inputSchema;
    const properties = (schema.properties ?? {}) as Record<string, JSONSchema>;
    const required = (schema.required ?? []) as string[];

    return `
      <div class="tool-tester">
        <div class="tool-header">
          <button class="back-btn" data-action="back" title="Back to list">←</button>
          <div class="tool-name">${escapeHtml(tool.name)}</div>
        </div>
        <form class="input-form" data-action="execute">
          ${Object.entries(properties).map(([key, propSchema]) =>
            renderInputField(key, propSchema, required.includes(key))
          ).join('')}
          <button type="submit" class="execute-btn" ${state.isExecuting ? 'disabled' : ''}>
            ${state.isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </form>
        ${state.lastResult ? renderResult(state.lastResult) : ''}
      </div>
    `;
  }

  function renderInputField(name: string, schema: JSONSchema, isRequired: boolean): string {
    const description = schema.description;

    return `
      <div class="input-field">
        <label class="input-label">
          ${escapeHtml(name)}${isRequired ? '<span class="required"> *</span>' : ''}
        </label>
        ${description ? `<span class="input-hint">${escapeHtml(description)}</span>` : ''}
        ${renderInputControl(name, schema)}
      </div>
    `;
  }

  function renderInputControl(name: string, schema: JSONSchema): string {
    const type = schema.type;
    const defaultVal = schema.default !== undefined ? String(schema.default) : '';

    // Handle enum
    if (schema.enum && Array.isArray(schema.enum)) {
      return `
        <select class="input-control" name="${escapeAttr(name)}">
          <option value="">Select...</option>
          ${schema.enum.map(v => `
            <option value="${escapeAttr(String(v))}">${escapeHtml(String(v))}</option>
          `).join('')}
        </select>
      `;
    }

    // Handle boolean
    if (type === 'boolean') {
      return `
        <div class="checkbox-wrapper">
          <input type="checkbox" name="${escapeAttr(name)}" id="field-${escapeAttr(name)}" />
          <label for="field-${escapeAttr(name)}">Enabled</label>
        </div>
      `;
    }

    // Handle number
    if (type === 'number' || type === 'integer') {
      return `
        <input
          type="number"
          name="${escapeAttr(name)}"
          class="input-control"
          placeholder="Enter ${type}"
          value="${escapeAttr(defaultVal)}"
          ${type === 'integer' ? 'step="1"' : ''}
        />
      `;
    }

    // Handle array (as JSON)
    if (type === 'array') {
      return `
        <input
          type="text"
          name="${escapeAttr(name)}"
          class="input-control"
          placeholder='["item1", "item2"]'
          data-type="array"
        />
      `;
    }

    // Handle object (as JSON)
    if (type === 'object' && !schema.properties) {
      return `
        <input
          type="text"
          name="${escapeAttr(name)}"
          class="input-control"
          placeholder='{"key": "value"}'
          data-type="object"
        />
      `;
    }

    // Default: string
    return `
      <input
        type="text"
        name="${escapeAttr(name)}"
        class="input-control"
        placeholder="Enter value"
        value="${escapeAttr(defaultVal)}"
      />
    `;
  }

  function renderResult(result: { response: ToolResponse; time: number }): string {
    const isError = result.response.isError;
    const content = result.response.content
      .map(c => {
        if (c.type === 'text') return c.text;
        return JSON.stringify(c);
      })
      .join('\n');

    return `
      <div class="result-container">
        <div class="result-header">
          <span class="result-status ${isError ? 'error' : 'success'}">
            ${isError ? '✗ Error' : '✓ Success'}
          </span>
          <span class="result-time">${result.time}ms</span>
        </div>
        <pre class="result-content">${escapeHtml(content)}</pre>
      </div>
    `;
  }

  function attachEventListeners(): void {
    // Tool selection
    panel.querySelectorAll<HTMLElement>('[data-tool]').forEach(el => {
      el.addEventListener('click', () => {
        const toolName = el.dataset.tool;
        if (toolName) {
          state.selectedTool = toolRegistry.get(toolName) ?? null;
          state.lastResult = null;
          render();
        }
      });
    });

    // Back button
    panel.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      state.selectedTool = null;
      state.lastResult = null;
      render();
    });

    // Minimize toggle
    panel.querySelector('[data-action="minimize"]')?.addEventListener('click', () => {
      state.isMinimized = !state.isMinimized;
      render();
    });

    // Execute form
    const form = panel.querySelector<HTMLFormElement>('form[data-action="execute"]');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.selectedTool || state.isExecuting) return;

      const formData = new FormData(form);
      const input: Record<string, unknown> = {};
      const schema = state.selectedTool.inputSchema;
      const properties = (schema.properties ?? {}) as Record<string, JSONSchema>;

      for (const [key, value] of formData.entries()) {
        const propSchema = properties[key];
        const inputEl = form.querySelector<HTMLInputElement>(`[name="${key}"]`);
        const dataType = inputEl?.dataset.type;

        // Parse based on type
        if (propSchema?.type === 'number' || propSchema?.type === 'integer') {
          input[key] = value === '' ? undefined : Number(value);
        } else if (propSchema?.type === 'boolean') {
          input[key] = inputEl?.checked ?? false;
        } else if (dataType === 'array' || dataType === 'object') {
          try {
            input[key] = value ? JSON.parse(value as string) : undefined;
          } catch {
            input[key] = value;
          }
        } else {
          input[key] = value === '' ? undefined : value;
        }
      }

      // Handle checkboxes (unchecked ones don't appear in formData)
      for (const [key, propSchema] of Object.entries(properties)) {
        if (propSchema.type === 'boolean' && !(key in input)) {
          const checkbox = form.querySelector<HTMLInputElement>(`[name="${key}"]`);
          input[key] = checkbox?.checked ?? false;
        }
      }

      // Clean undefined values
      for (const key of Object.keys(input)) {
        if (input[key] === undefined) {
          delete input[key];
        }
      }

      state.isExecuting = true;
      render();

      const startTime = performance.now();
      try {
        const agent = createMockAgent();
        const response = await state.selectedTool.execute(input, agent);
        state.lastResult = {
          response,
          time: Math.round(performance.now() - startTime),
        };
      } catch (error) {
        state.lastResult = {
          response: {
            content: [{ type: 'text', text: String(error) }],
            isError: true,
          },
          time: Math.round(performance.now() - startTime),
        };
      }

      state.isExecuting = false;
      render();
    });
  }

  return panel;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;');
}
