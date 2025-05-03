# Mocking Strategy Analysis

This document analyzes the current mocking usage in the test suite and outlines a strategy for centralizing mocks according to the new testing philosophy. The goal is to eliminate mocks for internal modules while creating standardized, reusable mocks for external dependencies.

## Internal Modules Currently Mocked (to be removed)

1. **`utils/logger.js`**:

   - Used in `converter.edge.test.js` / `converter.edge.unit.test.js`
   - Mocks the logging interface: `error`, `warn`, `info`, `debug`
   - Should be replaced with actual module

2. **`utils/storage.js`**:

   - Used in `observer-callback.test.js` / `observer-callback.dom.test.js`
   - Used in `observer-stress.test.js` / `observer-stress.dom.test.js`
   - Mocks `getSettings`
   - Also mocked via spyOn in various formHandler tests
   - Should be replaced with actual module

3. **`options/validator.js`**:
   - Mocked via spyOn in multiple formHandler tests
   - Functions mocked: `validateCurrencySymbol`, `validateCurrencyCode`, `validateAmount`, `validateDebounceInterval`
   - Should be replaced with actual module

## External Dependencies Requiring Mocks

### 1. Chrome Extension API

#### `chrome.storage`

- **Methods**:
  - `sync.get()`
  - `sync.set()`
  - `onChanged.addListener()`
- **Used in**:
  - `storage.test.js` / `storage.unit.test.js`
  - `storage.error.test.js` / `storage.error.unit.test.js`
  - `performance.test.js` / `performance.dom.test.js`

#### `chrome.runtime`

- **Methods**:
  - `lastError` (property)
  - `getManifest()`
- **Used in**:
  - `storage.test.js` / `storage.unit.test.js`
  - `storage.error.test.js` / `storage.error.unit.test.js`
  - `settingsManager.error.test.js` / `settingsManager.error.integration.test.js`

#### `chrome.i18n`

- **Methods**:
  - `getMessage()`
- **Used in**:
  - Various formHandler tests
  - `popup.error.test.js` / `popup.error.integration.test.js`

### 2. Browser APIs

#### `window`

- **Methods**:
  - `close()`
- **Used in**:
  - Various formHandler tests

#### `document`

- **Methods**:
  - `getElementById()`
  - `addEventListener()`
- **Used in**:
  - Various formHandler tests
  - `settingsManager.error.test.js` / `settingsManager.error.integration.test.js`

#### `performance` API

- **Methods**:
  - `mark()`
  - `measure()`
  - `getEntriesByName()`
  - `clearMarks()`
  - `clearMeasures()`
- **Used in**:
  - `observer-callback.test.js` / `observer-callback.dom.test.js`
  - `observer-stress.test.js` / `observer-stress.dom.test.js`

## Mock Function Patterns

- **Simple function mock**: `jest.fn()` - Used for callback verification
- **Implemented mock**: `jest.fn().mockImplementation(() => {})` - Used for returning values
- **Return value mock**: `jest.fn().mockReturnValue()` / `mockResolvedValue()` / `mockRejectedValue()`
- **Spy with implementation**: `jest.spyOn().mockImplementation()`
- **Full module mock**: `jest.mock('module', () => ({ ... }))`

## Centralized Mocking Plan

1. Create the following mock files in `src/__tests__/mocks/`:

   - **`chrome-api.mock.js`**: Comprehensive mock for Chrome extension APIs

     - `chrome.storage.sync`
     - `chrome.runtime`
     - `chrome.i18n`

   - **`browser-api.mock.js`**: Mocks for standard browser APIs
     - `window` methods
     - `document` methods
     - `performance` API

2. Implement thorough JSDoc for all mock functions to ensure proper API contract

3. Create a central setup file that registers these mocks for test environments

## Migration Strategy

1. Gradually replace internal module mocks with actual implementations
2. Replace inline external mocks with imports from the centralized mock files
3. Update tests to use the new Vitest syntax (`vi` instead of `jest`)
4. Ensure test isolation by proper setup/teardown of mocks
