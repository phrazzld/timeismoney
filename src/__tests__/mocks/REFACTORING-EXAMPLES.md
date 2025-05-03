# Test Refactoring Examples

This document provides examples of how to refactor tests according to our new mocking strategy, which involves:

1. **No Mocking of Internal Modules** - Use actual implementation
2. **Centralized External Mocks** - Import from dedicated mock files
3. **Vitest Syntax** - Replace Jest APIs with Vitest equivalents

## Example 1: Unit Test (converter.edge.refactored.unit.test.js)

This example demonstrates removing internal module mocks (logger.js).

### Key Changes:

- Removed jest.mock for internal logger module
- Using the actual logger implementation
- Updated test assertions to match expected behavior
- Added explanatory comments about the change

```js
/**
 * Edge case tests for converter.js
 * Specifically focused on extreme values, unusual inputs, and boundary conditions
 */

import {
  normalizePrice,
  calculateHourlyWage,
  // ... other imports
} from '../../../utils/converter';

// NOTE: We no longer mock logger.js - using the actual implementation
// The logger will be used directly when imported by the converter module

describe('Edge cases: normalizePrice', () => {
  // Test cases
});
```

## Example 2: Unit Test with External API (storage.refactored.unit.test.js)

This example shows using centralized mocks for Chrome Extension APIs.

### Key Changes:

- Import mocks from centralized files
- Set up and tear down mocks in beforeEach/afterEach hooks
- Use vi.fn() instead of jest.fn()
- Configure mocks with specific test behaviors

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSettings, saveSettings } from '../../../utils/storage';
import { setupChromeMocks, resetAllMocks } from '../../mocks/setup-mocks';
import chromeMock from '../../mocks/chrome-api.mock';

describe('Storage Utilities', () => {
  beforeEach(() => {
    setupChromeMocks();
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockItems);
        return Promise.resolve(mockItems);
      });

      const result = await getSettings();
      expect(result).toEqual(mockItems);
      expect(chromeMock.storage.sync.get).toHaveBeenCalled();
    });
  });
});
```

## Example 3: DOM Test (observer-callback.refactored.dom.test.js)

This example demonstrates testing DOM interactions without mocking internal modules.

### Key Changes:

- Import the actual storage module instead of mocking
- Use setupBrowserMocks() to set up document/window/performance mocks
- Use vi.useFakeTimers() instead of jest.useFakeTimers()
- Use vi.spyOn() rather than jest.spyOn()

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  processMutations,
  processPendingNodes,
  createDomScannerState,
} from '../../../content/domScanner.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';
import { getSettings } from '../../../utils/storage.js'; // Directly import
import { setupBrowserMocks, resetAllMocks } from '../../mocks/setup-mocks';
import browserMock from '../../mocks/browser-api.mock';

describe('Observer callback logic', () => {
  beforeEach(() => {
    setupBrowserMocks();
    resetTestMocks();
    setupTestDom();
  });

  afterEach(() => {
    resetAllMocks();
    vi.restoreAllMocks();
  });

  // Test cases
});
```

## Example 4: Integration Test (formHandler.refactored.integration.test.js)

This example demonstrates testing a component with both browser and Chrome APIs without mocking internal validator.js.

### Key Changes:

- Import actual validator implementation
- Use setupAllMocks() to set up all external mocks
- Use vi.spyOn() for specific test conditions
- Proper mock cleanup with vi.resetModules() and vi.restoreAllMocks()

```js
import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import {
  saveOptions,
  sanitizeTextInput,
  // ... other imports
} from '../../../options/formHandler';

// Direct import of validator - no mocking internal modules
import {
  validateCurrencySymbol,
  validateCurrencyCode,
  // ... other imports
} from '../../../options/validator';

import { setupAllMocks, resetAllMocks } from '../../mocks/setup-mocks';
import chromeMock from '../../mocks/chrome-api.mock';
import browserMock from '../../mocks/browser-api.mock';

describe('Options Form Validation', () => {
  beforeAll(() => {
    setupAllMocks();
    chromeMock.i18n.getMessage.mockImplementation((key) => key);
  });

  // Test cases
});
```

## Common Patterns

### Setup and Teardown

```js
// Before each test
beforeEach(() => {
  setupChromeMocks(); // For Chrome API tests
  // OR
  setupBrowserMocks(); // For DOM tests
  // OR
  setupAllMocks(); // For tests requiring both
});

// After each test
afterEach(() => {
  resetAllMocks();
  vi.restoreAllMocks();
});
```

### Timer Mocking

```js
// Set up fake timers
beforeEach(() => {
  vi.useFakeTimers();
});

// Clean up fake timers
afterEach(() => {
  vi.useRealTimers();
});

// Use in tests
it('handles async operations', async () => {
  // Run code that uses timers
  someAsyncOperation();

  // Advance timers
  vi.runAllTimers();

  // Flush promises
  await vi.runAllTimersAsync();
});
```

### Mock Implementation

```js
// For Chrome Storage API
chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
  callback({ key: 'value' });
  return Promise.resolve({ key: 'value' });
});

// For DOM elements
browserMock.document.getElementById.mockImplementation((id) => {
  if (id === 'element-id') return { value: 'test-value' };
  return { value: '' };
});
```

## Conclusion

Following these patterns will ensure consistent test structure and maintainability. Remember:

1. **Never mock internal modules** - import and use the actual implementation
2. **Use centralized external mocks** - import from `/mocks` directory
3. **Set up and tear down properly** - use the setup utilities and cleanup after each test
4. **Use Vitest syntax** - vi.fn(), vi.spyOn(), vi.mock() instead of Jest equivalents
