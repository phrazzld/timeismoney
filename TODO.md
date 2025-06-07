# CI Test Failures - Fix Tasks

This document tracks all CI test failures that need to be fixed before merging.

## Priority 1: SettingsManager Error Test Consistency

- [x] **Fix non-integration settingsManager error tests**
  - **File**: `src/__tests__/content/settingsManager.error.vitest.test.js`
  - **Issue**: Tests expect `console.error` calls but improved error handling now uses `console.warn`
  - **Action**: Update test expectations to match new graceful error behavior (like integration tests)
  - **Details**: Change expectations from `console.error` to `console.warn` and update assertions to match new fallback behavior

## Priority 1: Security Audit Test Mocking Issues

- [x] **Fix fs/promises mocking in security audit tests**

  - **File**: `src/__tests__/security/security-audit.vitest.test.js`
  - **Issue**: `access.mockResolvedValue is not a function` - mocking setup incorrect
  - **Action**: Fix mock imports and ensure proper Vitest mocking syntax
  - **Details**: The `mock('fs/promises')` syntax may not be working correctly with Vitest

- [x] **Verify security audit test coverage**
  - **Dependencies**: Fix fs/promises mocking first
  - **Action**: Ensure all security audit functions have proper test coverage
  - **Details**: Check readAuditResults, applySeverityPolicy, createCriticalVulnerabilitiesFile, main functions

## Priority 2: Performance and Observer Test Issues

- [x] **Fix DOM scanning performance test errors**

  - **File**: `src/__tests__/content/performance.vitest.test.js`
  - **Issue**: `TypeError: Cannot read properties of undefined (reading 'pop')` in domScanner.js:556
  - **Action**: Check array handling in batch processing code
  - **Details**: Issue in domScanner batch processing where array methods are called on undefined

- [x] **Fix observer stress test cleanup issues**
  - **Files**: `src/__tests__/content/observer-stress.vitest.test.js`, `src/__tests__/dom/content/observer-stress.vitest.test.js`
  - **Issue**: "Error calling MutationObserver.disconnect(): Simulated disconnect error"
  - **Action**: Improve error handling in observer cleanup code
  - **Details**: Tests simulate disconnect errors that aren't handled gracefully

## Priority 3: Debug Mode Context Issues

- [x] **Fix debug mode Chrome context errors**
  - **Files**: Multiple test files showing "Error initializing debug mode: Extension context invalidated"
  - **Issue**: Debug mode initialization fails in test environment
  - **Action**: Add proper Chrome context validation in debug mode initialization
  - **Details**: Tests should handle missing Chrome APIs gracefully in debug initialization

## Priority 4: Additional Test Failures (Investigation Needed)

- [x] **Audit remaining test failures**

  - **Action**: Run full test suite and catalog any additional failures not covered above
  - **Details**: Ensure comprehensive coverage of all CI failures
  - **COMPLETED**: ✅ Found and fixed 1 remaining test failure in security audit system
  - **Issue**: Test expected malformed vulnerability data to be handled gracefully but parser crashed on null values
  - **Fix**: Added null/undefined check in vulnerability parser to skip invalid entries gracefully
  - **Result**: All 909 tests now passing, 2 skipped (expected), 0 failures

- [x] **Fix converter/storage test inconsistencies**
  - **Action**: Check if any converter or storage tests have similar mocking issues
  - **Details**: Verify test isolation and mocking consistency
  - **COMPLETED**: ✅ Standardized mocking patterns across all converter and storage tests
  - **Issues Fixed**:
    - Import path inconsistencies for resetTestMocks
    - Duplicate beforeEach calls
    - Mixed usage of mock() vs vi.mock()
    - Chrome API mock setup inconsistencies after resetTestMocks
  - **Files Modified**: 4 test files standardized for consistent mocking patterns
  - **Result**: All 909 tests passing, proper mock isolation and consistency

## Priority 5: Test Infrastructure Improvements

- [ ] **Standardize error handling test patterns**

  - **Action**: Create consistent patterns for testing error conditions across all modules
  - **Details**: Ensure all error handling tests follow same patterns as the fixed settingsManager tests

- [ ] **Improve test mocking consistency**
  - **Action**: Standardize mocking patterns, especially for Chrome APIs and Node.js modules
  - **Details**: Create reusable mock helpers to avoid mocking inconsistencies

## Completion Criteria

All tasks must be completed and CI must pass 100% before merging the PR. Each task should:

1. ✅ Fix the specific test failure
2. ✅ Maintain existing functionality
3. ✅ Follow established test patterns
4. ✅ Not introduce new test failures
5. ✅ Pass linting and formatting checks

## Testing Strategy

For each fix:

1. Run specific test file to verify fix
2. Run full test suite to ensure no regressions
3. Run `pnpm run ci` to verify complete pipeline
4. Only mark task complete when CI passes entirely
