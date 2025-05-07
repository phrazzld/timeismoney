# Jest to Vitest Migration PR

## Description

<!--
Provide a clear description of the changes in this PR, focusing on:
1. Which test files were migrated
2. Any challenging aspects of the migration
3. Any patterns or solutions worth noting for future migrations
-->

Related Issue: <!-- Add issue number if applicable -->

## Test Migration Details

<!-- Summary of what was changed in the migration -->

## Vitest Migration Checklist

Please check all items that apply to this PR:

### File Structure and Organization

- [ ] Test files are renamed to use the `.vitest.test.js` extension
- [ ] Files are located in the correct test category (unit, integration, dom)
- [ ] Original test files are not modified (new files created instead)

### Import Patterns

- [ ] All test functions are imported from `vitest-imports.js` helper
  ```javascript
  import { describe, test, expect, vi, beforeEach } from '../../../setup/vitest-imports.js';
  ```
- [ ] `resetTestMocks` is imported from `vitest.setup.js`
  ```javascript
  import { resetTestMocks } from '../../../../vitest.setup.js';
  ```
- [ ] No direct imports from `vitest` package
- [ ] Module imports use `.js` extension for local files

### Mocking Patterns

- [ ] `jest.fn()` replaced with `vi.fn()`
- [ ] `jest.mock()` replaced with `vi.mock()`
- [ ] `jest.spyOn()` replaced with `vi.spyOn()`
- [ ] `jest.clearAllMocks()` replaced with `resetTestMocks()`
- [ ] Chrome API mocks are properly initialized
- [ ] `chrome.runtime.lastError` is properly cleaned up after tests that use it

### Test Lifecycle

- [ ] `resetTestMocks()` is called in `beforeEach()` hooks
- [ ] `setupTestDom()` is used when testing DOM elements
- [ ] Proper cleanup in `afterEach()` hooks where needed

### Asynchronous Testing

- [ ] `process.nextTick` replaced with `vi.waitFor()`
- [ ] Proper async/await patterns used for promises
- [ ] Timer mocks updated to use Vitest equivalents

### Performance Considerations

- [ ] Test uses `mockPerformance` API correctly if needed
- [ ] No unnecessary setup or teardown operations
- [ ] Tests remain isolated and don't interfere with each other

## General PR Checklist

- [ ] I have run the tests locally and they pass
- [ ] I have run ESLint and fixed any issues
- [ ] There are no console.log statements or debugging leftovers
- [ ] Tests maintain or improve the existing code coverage
- [ ] I have updated relevant documentation if necessary

## Test Results

<!-- Add test output or screenshots showing the tests passing -->

## Additional Notes

<!-- Any other information that would be helpful to reviewers -->

## References

- [Vitest Migration Guide](JEST-VITEST-MIGRATION.md)
- [Vitest Test Patterns](VITEST-PATTERNS.md)
