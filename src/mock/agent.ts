import type {
  WebMCPAgent,
  UserInteractionOptions,
  UserInteractionResult,
} from '../types/index.js';
import { isBrowser } from '../utils/feature-detect.js';

export interface MockAgentOptions {
  /** Custom handler for requestUserInteraction calls */
  onUserInteraction?: (
    options: UserInteractionOptions
  ) => Promise<UserInteractionResult>;
}

/**
 * Create a mock agent for dev/testing scenarios
 * Uses browser dialogs by default, or custom handler if provided
 */
export function createMockAgent(options?: MockAgentOptions): WebMCPAgent {
  return {
    async requestUserInteraction(
      interactionOptions?: UserInteractionOptions
    ): Promise<UserInteractionResult> {
      // Use custom handler if provided
      if (options?.onUserInteraction) {
        return options.onUserInteraction(interactionOptions ?? {});
      }

      // In Node.js environment, auto-confirm for testing
      if (!isBrowser()) {
        return { confirmed: true };
      }

      const type = interactionOptions?.type ?? 'confirmation';
      const prompt = interactionOptions?.prompt ?? 'Confirm action?';

      switch (type) {
        case 'confirmation': {
          const confirmed = window.confirm(prompt);
          return { confirmed };
        }

        case 'input': {
          const value = window.prompt(prompt);
          return {
            value: value ?? undefined,
            confirmed: value !== null,
          };
        }

        case 'selection': {
          const choices = interactionOptions?.choices ?? [];
          const choiceList = choices
            .map((c, i) => `${i + 1}. ${c}`)
            .join('\n');
          const input = window.prompt(`${prompt}\n\n${choiceList}\n\nEnter number:`);

          if (input === null) {
            return { confirmed: false };
          }

          const index = parseInt(input, 10) - 1;
          if (index >= 0 && index < choices.length) {
            return {
              selection: choices[index],
              confirmed: true,
            };
          }

          return { confirmed: false };
        }

        default:
          return { confirmed: true };
      }
    },
  };
}
