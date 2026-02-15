import { beforeEach } from 'vitest';
import { resetMockModelContext } from '../src/mock/model-context.js';

beforeEach(() => {
  // Reset mock state between tests
  resetMockModelContext();
});
