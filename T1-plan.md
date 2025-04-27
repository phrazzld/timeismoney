# T1: Fix Invalid Background Script Type in Manifest

## Task Details
- Task ID: T1
- Title: Fix Invalid Background Script Type in Manifest
- Original Plan Item: cr-11
- Action: Edit `src/manifest.json`. Locate the `background` object and remove the line `"type": "module"`.
- Depends On: None
- AC Ref: Extension loads without errors (manifest, background).

## Problem Analysis
In Manifest V3, the `type: "module"` property is not supported for background scripts defined as service workers. This is causing the extension to fail to load properly.

## Implementation Plan
1. Edit `src/manifest.json`
2. Remove the line `"type": "module"` from the `background` object
3. Run linter to check for any formatting issues
4. Test the extension loads properly

## Testing
- Run `npm run lint` to ensure the manifest is valid
- Build the extension and load it to confirm it loads without errors