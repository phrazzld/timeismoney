# T036: Add storage error simulation tests for storage.js

## Overview
This ticket requires expanding test coverage for storage.js to include more comprehensive error simulation tests, especially focusing on how storage errors are surfaced to the UI.

## Current State Analysis
- `storage.js` provides 3 main functions: `getSettings()`, `saveSettings()`, and `onSettingsChanged()`
- Basic error tests exist in `storage.test.js` that test rejection of promises when Chrome storage APIs fail
- `formHandler.js` includes error handling for storage operations with UI feedback, but these UI interactions aren't tested
- `onSettingsChanged()` function isn't tested at all

## Implementation Plan

### 1. Enhance Current Storage Utility Tests
- Add tests for a wider variety of error types
- Test edge cases like empty settings, malformed settings, etc.
- Add tests for `onSettingsChanged()` which is currently untested

### 2. Add UI Integration Tests for Storage Errors
- Create tests that verify storage errors are correctly displayed in the UI
- Test both load and save error scenarios
- Verify error messages are displayed correctly
- Verify error message timeout/clearing works

### 3. Test Error Handling in Other Components
- Test error handling in any other components that interact with storage.js
- Verify error propagation works correctly

## Verification Process
1. All tests should pass
2. Tests should fail if error handling is broken
3. Tests should cover a wide variety of error scenarios

## Implementation Details

### Types of Errors to Simulate
1. Network disconnection errors
2. Permission errors
3. Quota exceeded errors
4. Synchronization conflicts
5. Format/parsing errors

### Test Structure
- Use Jest's mocking capabilities to simulate Chrome API behavior
- Set `chrome.runtime.lastError` to simulate different error types
- Mock DOM elements to verify UI updates
- Test error message display and timeout behavior

### Implementation Coverage
1. Storage utility tests (storage.test.js)
2. UI error display tests (formHandler.error.test.js)
3. Other components that rely on storage.js