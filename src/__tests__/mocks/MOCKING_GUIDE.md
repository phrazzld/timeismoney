# Standardized Mocking Guide

This guide explains the standardized mocking patterns to use across all test files for consistency and maintainability.

## Quick Reference

### Recommended Import Pattern

```javascript
// Use this import pattern for ALL test files
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  resetTestMocks,
  setupTestDom,
  mockConfigs,
  createStorageMock,
  setupLoggerSpies,
  setupChromeApi,
} from '../setup/vitest-imports.js';
```

### Basic Test Structure

```javascript
import {
  describe,
  it,
  expect,
  beforeEach,
  resetTestMocks,
  setupChromeApi,
  setupLoggerSpies,
} from '../setup/vitest-imports.js';
import * as logger from '../../utils/logger.js';

describe('My Component', () => {
  beforeEach(() => {
    resetTestMocks();
    setupChromeApi({
      storageData: { amount: '15.00' },
      i18nMessages: { saveSuccess: 'Saved!' },
    });
    setupLoggerSpies(logger);
  });

  it('should work correctly', () => {
    // Test implementation
  });
});
```

## Module Mocking Patterns

### 1. Top-level Module Mocking (Preferred for External Dependencies)

```javascript
// For external libraries and stable interfaces
import { vi } from 'vitest';
import { mockConfigs } from '../setup/vitest-imports.js';

vi.mock('money', mockConfigs.money);
vi.mock('fs/promises', mockConfigs.fsPromises);

// Then import normally
import fx from 'money';
import { readFile } from 'fs/promises';
```

### 2. Spy-based Mocking (Preferred for Internal Modules)

```javascript
// For internal modules where you need partial mocking
import { beforeEach } from '../setup/vitest-imports.js';
import { setupLoggerSpies } from '../setup/vitest-imports.js';
import * as logger from '../../utils/logger.js';
import * as storage from '../../utils/storage.js';

describe('My Test', () => {
  beforeEach(() => {
    // Standard logger spies
    setupLoggerSpies(logger);

    // Custom storage spies
    vi.spyOn(storage, 'getSettings').mockResolvedValue({ amount: '10.00' });
    vi.spyOn(storage, 'saveSettings').mockResolvedValue();
  });
});
```

### 3. Factory-based Mocking (For Complex Scenarios)

```javascript
import { mockScenarios, createStorageMock } from '../setup/vitest-imports.js';

describe('Error Handling', () => {
  it('should handle storage errors', () => {
    // Use predefined error scenario
    const storageMock = mockScenarios.storageError();
    vi.mocked(getSettings).mockImplementation(storageMock.getSettings);

    // Test error handling
  });

  it('should handle quota exceeded', () => {
    const storageMock = mockScenarios.quotaExceeded();
    // Use the mock...
  });
});
```

## Chrome API Mocking

Chrome API is available globally, but you can configure it for specific test scenarios:

### Standard Chrome API Setup

```javascript
import { setupChromeApi } from '../setup/vitest-imports.js';

beforeEach(() => {
  setupChromeApi({
    storageData: {
      amount: '15.00',
      frequency: 'hourly',
      currencySymbol: '$',
    },
    i18nMessages: {
      saveError: 'Custom error message',
    },
    manifest: {
      version: '2.0.0',
    },
  });
});
```

### Chrome API Error Scenarios

```javascript
import { chromeScenarios } from '../setup/vitest-imports.js';

describe('Chrome Storage Errors', () => {
  it('should handle network errors', () => {
    chromeScenarios.storageError('network');
    // Test network error handling
  });

  it('should handle quota exceeded', () => {
    chromeScenarios.storageError('quota');
    // Test quota error handling
  });

  it('should handle context invalidation', () => {
    chromeScenarios.contextInvalidated();
    // Test context invalidation handling
  });
});
```

## Performance API Mocking

Performance API is automatically mocked globally. No additional setup needed:

```javascript
// Performance API is available and mocked automatically
describe('Performance Tests', () => {
  it('should measure performance', () => {
    performance.mark('start');
    // Do work...
    performance.mark('end');
    performance.measure('work', 'start', 'end');

    const measures = performance.getEntriesByName('work');
    expect(measures).toHaveLength(1);
  });
});
```

## Common Anti-Patterns to Avoid

### ❌ Don't: Manual Chrome API Setup

```javascript
// Avoid this
beforeEach(() => {
  global.chrome = {
    storage: {
      sync: {
        get: vi.fn((keys, callback) => callback({})),
        set: vi.fn((items, callback) => callback()),
      },
    },
  };
});
```

### ❌ Don't: Direct Vitest Imports Mixed with Centralized Imports

```javascript
// Avoid this mixing pattern
import { vi } from 'vitest';
import { describe, it, expect } from '../setup/vitest-imports.js';
```

### ❌ Don't: Manual Mock Cleanup

```javascript
// Avoid manual cleanup - use resetTestMocks() instead
afterEach(() => {
  vi.resetAllMocks();
  vi.clearAllMocks();
  chrome.storage.sync.get.mockClear();
});
```

### ❌ Don't: Duplicate Mock Definitions

```javascript
// Avoid recreating common mocks
const mockStorage = {
  getSettings: vi.fn(() => Promise.resolve({})),
  saveSettings: vi.fn(() => Promise.resolve()),
};
```

## Migration Examples

### Before: Inconsistent Pattern

```javascript
// Old pattern
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from '../setup/vitest-imports.js';

vi.mock('../../utils/storage.js', () => ({
  getSettings: vi.fn(() => Promise.resolve({})),
  saveSettings: vi.fn(() => Promise.resolve()),
}));

describe('Test', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.chrome = {
      /* manual setup */
    };
  });
});
```

### After: Standardized Pattern

```javascript
// New pattern
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  resetTestMocks,
  mockConfigs,
  setupChromeApi,
} from '../setup/vitest-imports.js';

vi.mock('../../utils/storage.js', mockConfigs.storage);

describe('Test', () => {
  beforeEach(() => {
    resetTestMocks();
    setupChromeApi({
      storageData: { amount: '10.00' },
    });
  });
});
```

## Benefits of Standardized Mocking

1. **Consistency**: All tests use the same patterns and setup
2. **Maintainability**: Changes to mock behavior only need to be made in one place
3. **Readability**: Tests focus on business logic rather than mock setup
4. **Reliability**: Standardized mocks reduce test flakiness
5. **Developer Experience**: Clear patterns make it easier to write new tests

## Getting Help

If you need to create a new mock pattern or have questions about existing patterns:

1. Check existing mock factories in `src/__tests__/mocks/module-mocks.js`
2. Look for similar test patterns in the codebase
3. Add new patterns to the mock factories if they'll be reused
4. Update this guide when adding new patterns
