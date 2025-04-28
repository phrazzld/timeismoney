# T15 Plan: Refactor Content Script to Fetch Settings Once Per Batch

## Background
Currently, the extension fetches settings for each individual text node during processing, which is inefficient especially on dynamic pages with frequent DOM mutations. This leads to unnecessary Chrome storage API calls and potential performance bottlenecks.

## Problem Analysis
The core issue is in the content script architecture where:
- Each text node conversion triggers a separate `getSettings()` call
- For batch processing (like MutationObserver callbacks), this means multiple redundant calls for the same settings
- This pattern causes performance issues on dynamic websites with frequent DOM changes

## Implementation Approach
1. Identify the main processing loop or MutationObserver callback in `src/content/domScanner.js`
2. Modify the code to fetch settings once at the beginning of each batch processing cycle
3. Pass the retrieved settings object to downstream functions like `convert`
4. Ensure proper error handling if settings can't be fetched

## Implementation Steps
1. Examine `src/content/domScanner.js` to locate the MutationObserver callback
2. Refactor the callback to fetch settings once before processing nodes
3. Modify the node processing functions to accept a settings parameter
4. Update error handling to gracefully skip processing if settings can't be retrieved
5. Test the changes to ensure they don't break existing functionality

## Expected Benefits
- Reduced number of Chrome storage API calls
- Improved performance on dynamic websites
- No functional changes to the extension's behavior