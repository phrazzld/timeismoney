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

- [x] **Standardize error handling test patterns**

  - **Action**: Create consistent patterns for testing error conditions across all modules
  - **Details**: Ensure all error handling tests follow same patterns as the fixed settingsManager tests
  - **COMPLETED**: ✅ Investigated and verified all error handling tests already follow consistent patterns
  - **Patterns Established**:
    - Graceful degradation errors (settingsManager): `console.warn` with "TimeIsMoney:" prefix
    - User-facing errors (popup, formHandler): `console.error` with "TimeIsMoney:" prefix
    - Non-critical system errors: Appropriate warning level logging
  - **Result**: All 71 error-related tests passing, patterns consistent across unit/integration/regular tests

- [x] **Improve test mocking consistency**
  - **Action**: Standardize mocking patterns, especially for Chrome APIs and Node.js modules
  - **Details**: Create reusable mock helpers to avoid mocking inconsistencies
  - **COMPLETED**: ✅ Implemented comprehensive standardized mocking infrastructure
  - **Deliverables**:
    - `src/__tests__/mocks/module-mocks.js` - Reusable mock factories for common modules
    - `src/__tests__/mocks/chrome-api.mock.js` - Enhanced Chrome API helpers and scenarios
    - `src/__tests__/setup/vitest-imports.js` - Centralized imports with mock utilities
    - `src/__tests__/mocks/MOCKING_GUIDE.md` - Comprehensive documentation and patterns
  - **Features**:
    - Standardized Chrome API setup with configurable scenarios
    - Reusable mock factories for storage, logger, money.js, fs/promises, validator
    - Mock scenarios for common error conditions (network, quota, validation failures)
    - Centralized import patterns to reduce inconsistencies
    - Helper functions for logger spies and i18n setup
  - **Benefits**:
    - Consistent mocking patterns across all 909 tests
    - Reduced code duplication in test setup
    - Easier test maintenance and debugging
    - Clear developer guidelines for writing new tests
  - **Result**: All tests passing, improved developer experience, maintainable test infrastructure

## Priority 6: Critical Code Review Issues (BLOCKING)

- [x] **Fix Performance API array access vulnerability**

  - **File**: `src/content/domScanner.js:556-558, 590-592`
  - **Issue**: Calling `.pop()` on potentially empty arrays from `performance.getEntriesByName()` causes TypeError when accessing properties on `undefined`
  - **Impact**: Complete DOM scanner failure, extension stops working
  - **Action**: Check array length before calling `.pop()` and add null safety
  - **Details**: Replace direct `.pop()` calls with safe array access patterns
  - **COMPLETED**: ✅ Verified both vulnerable locations already have safe array access patterns implemented
  - **Implementation**:
    - Line 567: `const elementMeasure = elementMeasures && elementMeasures.length > 0 ? elementMeasures.pop() : null;`
    - Line 602: `const textMeasure = textMeasures && textMeasures.length > 0 ? textMeasures.pop() : null;`
  - **Verification**: All performance tests and full CI pipeline (909 tests) pass successfully

- [x] **Fix promise timeout memory leak in storage utility**

  - **File**: `src/utils/storage.js:23-34`
  - **Issue**: Timeout not cleared on early promise rejection, causing unhandled promise rejections
  - **Impact**: Console noise and potential memory leaks
  - **Action**: Always clear timeout in both success and error paths
  - **Details**: Add `clearTimeout(timeoutId)` at start of chrome.storage.sync.get callback
  - **COMPLETED**: ✅ Fixed timeout memory leak by clearing timeout in catch block
  - **Implementation**:
    - Moved `timeoutId` declaration to Promise scope for catch block access
    - Added `clearTimeout(timeoutId)` in catch block (line 47)
    - Added test case for Chrome storage API throwing before callback execution
  - **Verification**: All 909 tests pass, including new test for timeout leak scenario

- [ ] **Fix settings cache staleness after storage errors**
  - **File**: `src/content/settingsManager.js:47-80`
  - **Issue**: Failed storage reads return stale cached settings indefinitely without invalidation
  - **Impact**: User settings changes not reflected, extension appears "stuck"
  - **Action**: Implement consecutive failure tracking and cache invalidation strategy
  - **Details**: After 3+ consecutive failures, invalidate cache and surface warning to user

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
