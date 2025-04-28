# T16 Plan: Implement Size Limit and Cleanup for Mutation Observer Sets

## Background
Currently, the Mutation Observer tracks DOM changes in pendingNodes and pendingTextNodes Sets without a size limit. On pages with very frequent DOM mutations (e.g., infinite scroll, live feeds), this could lead to excessive memory usage if nodes accumulate faster than they can be processed.

## Problem Analysis
- The MutationObserver callback in `src/content/domScanner.js` adds nodes to `pendingNodes` and `pendingTextNodes` Sets
- There is no limit to how large these Sets can grow
- While the Sets are cleared after processing, there's a risk of memory leaks on pages with rapid DOM changes
- We need to implement safeguards to prevent unbounded growth of these collections

## Implementation Approach
1. Define a constant for maximum pending nodes (e.g., `MAX_PENDING_NODES = 1000`)
2. In the MutationObserver callback, check if Set sizes exceed this limit
3. If limit is exceeded, trigger immediate processing and clear the sets before adding new nodes
4. Add cleanup on page unload to ensure all resources are properly released
5. Ensure `processPendingNodes` reliably clears the sets after processing

## Detailed Steps
1. Add a `MAX_PENDING_NODES` constant at the top of the file
2. Modify the MutationObserver callback to check Set sizes before adding new nodes
3. If either Set exceeds the limit:
   - Log a warning to the console (for debugging)
   - Trigger immediate processing (`processPendingNodes()`)
   - Allow new nodes to be added after processing
4. Add `unload` event handler to clear Sets when page is unloaded
5. Verify that `processPendingNodes` reliably clears the Sets in both success and error cases

## Testing
- Run the existing test suite to verify we haven't broken anything
- Add tests to verify the size limit mechanism works as expected
- Manual testing will be important for this feature, especially on pages with frequent DOM changes