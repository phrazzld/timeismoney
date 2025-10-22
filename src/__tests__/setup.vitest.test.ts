/**
 * Basic test to verify Vitest setup is working
 */

import { describe, test, expect } from './setup/vitest-imports.js';

describe('Vitest Setup', () => {
  test('Vitest is correctly configured', () => {
    expect(1 + 1).toBe(2);
  });
});
