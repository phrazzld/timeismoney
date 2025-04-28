# T13 Plan: Fix Options Window Closing Logic

## Background
Currently, when users save options, the window is set to close after displaying a success message. However, the window closing logic needs to be improved to ensure it only happens after successful saves.

## Issue
The `window.close()` call in the `saveOptions` function should:
1. Only occur after successful saves (within the `.then()` block)
2. Never occur after validation failures
3. Never occur after storage operation failures (in the `.catch()` block)

## Current Implementation
In `src/options/formHandler.js`, the `saveOptions` function:
- Properly prevents window closing after validation failures (returns early)
- However, the window.close() is within a setTimeout in the `.then()` block
- The `.catch()` block does not call `window.close()`, which is correct

## Solution
1. Keep the `window.close()` call *only* inside the `.then()` block
2. Verify validation failures correctly prevent saving and window closing
3. Verify the `.catch()` block for storage errors only shows an error and does not close the window

## Implementation Steps
1. Examine the existing code in `src/options/formHandler.js`
2. Verify window closing logic is properly contained in the `.then()` block
3. Ensure early returns from validation prevent the window from closing
4. Test all three scenarios to validate the behavior works as expected