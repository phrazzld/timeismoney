# T6: Implement Promise Error Rejection in `storage.js` Wrappers

## Task Details
- Task ID: T6
- Title: Implement Promise Error Rejection in `storage.js` Wrappers
- Original Plan Item: cr-03
- Action: Modify the promise wrapper functions in `src/utils/storage.js` for `chrome.storage.sync.get` and `chrome.storage.sync.set`. Inside the callback provided to the Chrome API, check for `chrome.runtime.lastError`. If it exists, call `reject(chrome.runtime.lastError)` for the promise returned by the wrapper function.
- Depends On: [T1]
- AC Ref: Review `storage.js` code changes. Unit tests for storage utilities should verify that errors are correctly rejected.

## Problem Analysis
Currently, the Promise wrappers for Chrome storage API in `storage.js` do not properly handle errors. If Chrome storage operations fail, these errors are silently ignored, which can lead to bugs that are difficult to diagnose. This task aims to properly propagate any Chrome storage errors to the caller by rejecting the Promise with the appropriate error.

## Implementation Plan
1. Examine the current implementation of the storage wrapper functions in `src/utils/storage.js`
2. Modify the `getSettings` and `saveSettings` functions to check for `chrome.runtime.lastError` in their callbacks
3. Add proper error rejection when `chrome.runtime.lastError` is present
4. Update or add unit tests to verify the error handling functionality
5. Run tests to ensure the changes work correctly

## Testing
- Write unit tests that simulate Chrome storage errors to verify they are properly rejected
- Run the existing test suite to ensure other functionality is not broken
- Run the linter to ensure code style is maintained