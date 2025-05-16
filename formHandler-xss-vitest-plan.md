# Plan for Updating formHandler.xss.integration.test.js to Use Vitest Mocking Patterns

## Task

Update `formHandler.xss.integration.test.js` to use Vitest mocking patterns instead of Jest.

## Current Status

The file `formHandler.xss.integration.test.js` currently uses Jest for all its mocking patterns, including:

1. Jest spies: `jest.spyOn()`
2. Jest mock implementations: `mockImplementation()`
3. Jest mock return values: `mockReturnValue()`
4. Jest mock functions: `jest.fn()`
5. Jest utility functions: `jest.clearAllMocks()`
6. Jest module mocking: `jest.spyOn(require('../../options/validator.js')...`

## Implementation Approach

1. **Create new file**: Create `formHandler.xss.integration.vitest.test.js` following the same pattern as previous migrations

2. **Update imports**:

   - Add Vitest imports from the centralized `vitest-imports.js` helper
   - Import `setupTestDom` and `resetTestMocks` from the Vitest setup file

3. **Replace Jest mocks with Vitest equivalents**:

   - Replace `jest.spyOn()` with `vi.spyOn()`
   - Replace `jest.fn()` with `vi.fn()`
   - Replace `jest.clearAllMocks()` with `vi.clearAllMocks()`
   - Update mock implementations to use Vitest's API

4. **Update module mocking**:

   - The test uses dynamic imports via `require()`
   - Change to proper ES module imports with Vitest mocking

5. **Fix DOM setup**:

   - Replace manual document.body creation with `setupTestDom()`
   - Ensure test cleanup is properly handled

6. **Handle test assertions**:
   - Make sure all assertions work with Vitest's `expect`
   - Update mock assertions to follow Vitest patterns

## Specific Changes Needed

1. **Import updates**:

```javascript
import { describe, test, expect, beforeEach, vi, afterEach } from '../../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';
```

2. **Replace Jest mocking**:

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
window.close = jest.fn();
// After
window.close = vi.fn();

// Before
jest.clearAllMocks();
// After
vi.clearAllMocks();
```

3. **Fix module mocking**:

```javascript
// Before
jest.spyOn(require('../../options/validator.js'), 'validateCurrencySymbol').mockReturnValue(true);
// After
import * as validator from '../../../options/validator.js';
// Then in the test
vi.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
```

4. **Mock verification updates**:

```javascript
// Before
expect(storage.saveSettings.mock.calls.length).toBeGreaterThan(0);
// After
expect(storage.saveSettings).toHaveBeenCalled();
// And
const settings = storage.saveSettings.mock.calls[0][0];
// Can remain the same as Vitest maintains this structure
```

## Implementation Steps

1. Create the new file `formHandler.xss.integration.vitest.test.js`
2. Update imports and mocking patterns as outlined above
3. Ensure DOM setup is handled with `setupTestDom()`
4. Run the tests to validate they work correctly
5. Update the TODO.md file to mark the task as complete
6. Commit the changes

## Testing Strategy

1. Run the tests with Vitest to ensure they pass
2. Verify all XSS payloads are still correctly tested
3. Ensure there are no lint errors
4. Check that no Jest references remain in the file
