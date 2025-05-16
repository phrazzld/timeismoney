# Plan for Fixing popup.error.integration.test.js

## Task ID

Fix `popup.error.integration.test.js` by replacing Jest global references

## Current Status

The file `popup.error.integration.test.js` currently uses Jest globals and functions for testing and mocking. The specific Jest references that need to be replaced:

1. `jest.spyOn()` - Used for mocking console.error and storage functions
2. `jest.fn()` - Used for mocking chrome.i18n.getMessage
3. `jest.clearAllMocks()` - Used to reset mocks before each test
4. `await new Promise(process.nextTick)` - Used for waiting on asynchronous operations
5. Global references like `describe`, `it`, `beforeEach`, `expect` - Not explicitly imported

## Implementation Approach

This is a simple task that involves:

1. Create a new test file `popup.error.integration.vitest.test.js` following the project's migration pattern
2. Update imports to use the vitest-imports.js helper
3. Replace Jest functions with their Vitest equivalents
4. Add setupTestDom and resetTestMocks from the Vitest setup
5. Update async handling to use Vitest's methods
6. Verify all tests pass

## Specific Changes Needed

1. **Import Updates**:

```javascript
import { describe, it, expect, beforeEach, vi, afterEach } from '../../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';
import * as storage from '../../../utils/storage.js';
import { restoreOptions, handleEnableToggle } from '../../../popup/popup.js';
```

2. **Replace Jest Mocking**:

```javascript
// Before
jest.spyOn(console, 'error').mockImplementation(() => {});
// After
vi.spyOn(console, 'error').mockImplementation(() => {});

// Before
chrome.i18n.getMessage = jest.fn((key) => { ... });
// After
chrome.i18n.getMessage = vi.fn((key) => { ... });

// Before
jest.clearAllMocks();
// After
vi.clearAllMocks();

// Before
jest.spyOn(storage, 'getSettings').mockImplementation(() => {
  return Promise.reject(new Error('Storage error'));
});
// After
vi.spyOn(storage, 'getSettings').mockImplementation(() => {
  return Promise.reject(new Error('Storage error'));
});
```

3. **Update Async Handling**:

```javascript
// Before
await new Promise(process.nextTick);
// After
await vi.waitFor(() => {
  // Assert the condition that should be true after async operation
  expect(document.getElementById('status').textContent).toBe(
    'Failed to load your settings. Please try again.'
  );
});
// OR if this works fine, we can also use:
await flushPromises();
// where flushPromises() is a helper from vitest.setup.js or vitest-imports.js
```

4. **Fixed DOM Setup**:

```javascript
// Before
document.body.innerHTML = '...';
// After
setupTestDom();
document.body.innerHTML = '...';
```

## Implementation Steps

1. Create the new file `popup.error.integration.vitest.test.js`
2. Update imports and DOM setup
3. Replace Jest mocks with Vitest equivalents
4. Update async handling if needed
5. Run tests to verify functionality
6. Update the TODO.md file
7. Commit the changes

## Testing Strategy

1. Run the Vitest tests to ensure they pass
2. Verify error messages are displayed correctly
3. Verify mocks are working as expected
4. Check for any lint errors
