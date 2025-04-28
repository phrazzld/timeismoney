# T5: Standardize and Fix Extension Icon Paths

## Task Details
- Task ID: T5
- Title: Standardize and Fix Extension Icon Paths
- Original Plan Item: cr-01
- Action: In `src/background/background.js`, update all `chrome.action.setIcon` calls to use root-relative paths (e.g., `path: '/images/icon_38.png'`). Ensure `src/manifest.json` uses the same root-relative paths in the `icons` and `action.default_icon` fields. Delete the old, unused `background.js` file if one exists separate from the service worker script.
- Depends On: [T1, T4]
- AC Ref: Build the extension (`npm run build`) and load it (`npm run start`). Verify the extension icon appears correctly in the browser toolbar upon installation and updates dynamically if triggered by `setIcon`.

## Problem Analysis
Currently, the icon paths in the background script and manifest are inconsistent, which can lead to issues with icons not displaying correctly. The goal is to standardize all icon paths to use the root-relative format (`/images/...`) which is the proper way to reference assets in Chrome extensions.

Additionally, in T4 we removed the deprecated background.js file, so that part of the task is already completed.

## Implementation Plan
1. Examine the current icon paths in `src/background/background.js` and `src/manifest.json`
2. Update all `chrome.action.setIcon` calls in `src/background/background.js` to use root-relative paths
3. Update the `icons` and `action.default_icon` fields in `src/manifest.json` to use consistent root-relative paths
4. Build and load the extension to verify the changes work correctly

## Testing
- Run the linter to ensure code style is consistent
- Build the extension using `npm run build`
- Load the extension using `npm run start`
- Verify that the extension icon appears correctly in the browser toolbar
- Toggle the extension's disabled state to verify the icon updates correctly