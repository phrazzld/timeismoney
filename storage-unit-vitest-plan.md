# Migration Plan for storage.unit.test.js

## Current State

The file `/Users/phaedrus/Development/timeismoney/src/__tests__/unit/utils/storage.unit.test.js` uses Jest testing APIs and patterns, including:

1. Jest mocking with `jest.clearAllMocks()`
2. Chrome API mock implementations with Jest-specific implementation patterns
3. Standard Jest expectations and assertions

## Migration Requirements

1. Create a new file `storage.unit.vitest.test.js` following the Vitest patterns
2. Replace Jest references with Vitest equivalents
3. Make sure Chrome API mocks work properly with Vitest
4. Ensure proper test isolation with resetTestMocks

## Migration Steps

1. **Create New Test File**

   - Create `/Users/phaedrus/Development/timeismoney/src/__tests__/unit/utils/storage.unit.vitest.test.js`
   - Copy the content from the original file

2. **Update Imports**

   - Add proper Vitest imports:
     ```javascript
     import { describe, it, expect, vi, beforeEach } from '../../../setup/vitest-imports.js';
     import { resetTestMocks } from '../../../../vitest.setup.js';
     import { getSettings, saveSettings } from '../../../utils/storage.js';
     ```

3. **Replace Jest References**

   - Replace `jest.clearAllMocks()` with `resetTestMocks()`
   - Update any mocking implementations to use Vitest patterns
   - Make sure all expectations work properly with Vitest

4. **Chrome API Mocks**

   - Keep the same Chrome API mocking patterns since they're already compatible with Vitest
   - Ensure `chrome.runtime.lastError` is properly cleaned up

5. **Test Assertions**
   - Review all assertions for compatibility with Vitest
   - Make sure async/await patterns work correctly

## Expected Result

The migrated file will be fully compatible with Vitest, while maintaining the same test coverage and behavior as the original Jest file.
