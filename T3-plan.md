# T3: Modify Development Load Script to Use Build Output

## Task Details
- Task ID: T3
- Title: Modify Development Load Script to Use Build Output
- Original Plan Item: cr-08
- Action: Edit `scripts/load-extension.sh`. Add a command to run the build script (`npm run build` or `bash scripts/build-extension.sh`) *before* the command that loads the extension into Chrome. Update the Chrome loading command to point to the `dist/` directory instead of `src/`.
- Depends On: [T2]
- AC Ref: Run `npm run start`. Verify that the build process runs automatically and the extension loaded in the browser is the one from the `dist/` directory.

## Problem Analysis
Currently, the development load script is loading the extension directly from the `src/` directory, which doesn't include the bundled content script or other processed files. This can lead to inconsistencies between development and production builds. By modifying the script to run the build process first and then load the extension from the `dist/` directory, we ensure that the development environment matches the production environment.

## Implementation Plan
1. Examine the current load-extension.sh script to understand its structure
2. Add a command to run the build script before loading the extension
3. Update the Chrome loading command to point to the `dist/` directory instead of `src/`
4. Ensure error handling is in place

## Testing
- Run `npm run start` to verify that:
  - The build process runs automatically
  - The extension is loaded from the `dist/` directory
  - The extension functions correctly in the browser