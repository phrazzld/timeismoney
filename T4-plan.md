# T4: Replace Deprecated `chrome.browserAction` with `chrome.action`

## Task Details
- Task ID: T4
- Title: Replace Deprecated `chrome.browserAction` with `chrome.action`
- Original Plan Item: cr-02
- Action: Search the codebase (`*.js`, `*.test.js`, `*.setup.js`) for all instances of `chrome.browserAction` and replace them with `chrome.action`. Update Jest mocks in `jest.setup.js` to correctly stub `chrome.action` methods like `onClicked.addListener` and `setIcon`. Run `npm test` and fix any resulting test failures.
- Depends On: [T1]
- AC Ref: Codebase search confirms no remaining `chrome.browserAction` references. Run tests (`npm test`) and verify they pass using the updated `chrome.action` mocks.

## Problem Analysis
Chrome Extensions using Manifest V3 need to use `chrome.action` instead of the deprecated `chrome.browserAction` API. This task requires identifying all instances of `chrome.browserAction` in the codebase and replacing them with the equivalent `chrome.action` methods. Additionally, any mocks in the test suite that stub `chrome.browserAction` need to be updated to mock `chrome.action` instead.

## Implementation Plan
1. Search the entire codebase for `chrome.browserAction` references
2. Replace each reference with the equivalent `chrome.action` method
3. Update the Jest mocks in `jest.setup.js` to correctly stub `chrome.action` methods
4. Run tests to verify the changes work correctly
5. Fix any test failures that may result from the changes

## Testing
- Run `npm test` to verify that all tests pass with the updated API references
- Run the linter (`npm run lint`) to ensure no code style issues
- Build and load the extension to verify it works correctly with the new API