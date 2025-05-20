import { vi } from 'vitest';

// Mock for the money.js library
const mockFx = vi.fn((val) => ({
  from: vi.fn(() => ({
    to: vi.fn(() => {
      // Simple direct conversion for testing by default
      return val;
    }),
  })),
}));

// Add properties needed by the CurrencyService
mockFx.rates = {};
mockFx.base = '';

// Add mockClear method for resetting between tests
mockFx.mockClear = vi.fn();

export default mockFx;
