# T2: Update Build Script for Options/Popup File Copying

## Task Details
- Task ID: T2
- Title: Update Build Script for Options/Popup File Copying
- Original Plan Item: cr-07
- Action: Modify `scripts/build-extension.sh`. Change the `cp` commands for `src/options/` and `src/popup/` to recursively copy all contents (e.g., `cp -R src/options/* dist/options/` and `cp -R src/popup/* dist/popup/`).
- Depends On: None
- AC Ref: Run `npm run build`. Verify that all expected JS files (including sub-modules) from `src/options` and `src/popup` are present in the `dist/options` and `dist/popup` directories respectively.

## Problem Analysis
The current build script appears to be copying only specific files from the options and popup directories rather than recursively copying all content. This causes issues when there are additional JS files (modules) in these directories that need to be included in the build.

## Implementation Plan
1. Examine the current build script to understand how files are being copied
2. Update the `cp` commands to use the `-R` flag for recursive copying
3. Ensure the target directories exist before copying
4. Run the build script to verify changes are working correctly
5. Check the output directories to confirm all files are copied

## Testing
- Run `npm run build` to execute the build script
- Verify that all files from `src/options/` and `src/popup/` are correctly copied to their respective directories in `dist/`