import { vi, type Mock } from 'vitest';

interface MoneyChain {
  to: Mock<[currency: string], number>;
}

interface MoneyFrom {
  from: Mock<[currency: string], MoneyChain>;
}

interface MockFx extends Mock<[val: number], MoneyFrom> {
  rates: Record<string, number>;
  base: string;
  mockClear: Mock;
}

// Mock for the money.js library
const mockFx = vi.fn<[val: number], MoneyFrom>((val) => ({
  from: vi.fn(() => ({
    to: vi.fn(() => {
      // Simple direct conversion for testing by default
      return val;
    }),
  })),
})) as MockFx;

// Add properties needed by the CurrencyService
mockFx.rates = {};
mockFx.base = '';

// Add mockClear method for resetting between tests
mockFx.mockClear = vi.fn();

export default mockFx;
