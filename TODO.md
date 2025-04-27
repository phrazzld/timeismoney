# TODO List

- [ ] T001: Resolve ES6 module loading issue in content scripts (Original Task)
  - Action: Implement the plan outlined in `CONSULTANT-PLAN.md` using a bundler (esbuild) to handle modular content scripts for Manifest V3 compatibility. This involves installing esbuild, configuring bundling, reverting code workarounds, updating the manifest, and modifying the build script. See sub-tasks T002-T009.
  - Depends On: None
  - AC Ref: None

- [x] T002: Install esbuild dependency
  - Action: Add `esbuild` as a development dependency to the project. Run `npm install --save-dev esbuild` or `yarn add --dev esbuild`. Verify that `esbuild` is listed under `devDependencies` in `package.json`.
  - Depends On: None
  - AC Ref: None

- [x] T003: Add esbuild script to package.json
  - Action: Edit the `package.json` file. Add a script under the `"scripts"` section named `"build:content"` with the command: `"esbuild src/content/index.js --bundle --outfile=dist/content/content.bundle.js --format=iife --sourcemap --target=chrome90"`. Adjust source (`src/content/index.js`) and output (`dist/content/content.bundle.js`) paths if your project structure differs.
  - Depends On: T002
  - AC Ref: None

- [x] T004: Restore ES6 imports in content/index.js
  - Action: Edit the `src/content/index.js` file. Remove any global variable assignments used as a workaround (e.g., `const getSettings = window.timeIsMoneyGetSettings;`). Restore or add standard ES6 `import` statements at the top of the file for all required modules, such as `import { getSettings } from '../utils/storage.js';`, `import { initSettings } from './settingsManager.js';`, etc., matching the original modular structure intended. Ensure the rest of the file uses the imported functions/variables directly.
  - Depends On: None
  - AC Ref: None

- [x] T005: Remove content-loader.js workaround file
  - Action: Delete the file `src/content-loader.js`. Search the codebase for any remaining `window.timeIsMoney...` assignments related to this workaround and remove them.
  - Depends On: T004
  - AC Ref: None

- [x] T006: Update manifest.json content_scripts entry
  - Action: Edit the `src/manifest.json` file. Locate the `content_scripts` array. Change the `js` property within the relevant content script definition from `["content-loader.js"]` (or similar) to `["content/content.bundle.js"]` (matching the output file defined in T003).
  - Depends On: T003, T005
  - AC Ref: None

- [x] T007: Update manifest.json web_accessible_resources
  - Action: Edit the `src/manifest.json` file. Review the `web_accessible_resources` section. Remove entries listing individual source files like `"utils/*.js"` and `"content/*.js"` *unless* these specific source files are confirmed to be required for other extension functionality (e.g., injection via `scripting.executeScript` from background/popup). The bundled content script does not require its source modules to be web accessible.
  - Depends On: T006
  - AC Ref: None

- [x] T008: Integrate bundling into build-extension.sh script
  - Action: Modify the `scripts/build-extension.sh` (or equivalent build script).
    1. Add a command to execute the bundling step (e.g., `npm run build:content`) *before* any steps that copy files to the `dist` directory or create the final zip archive.
    2. Remove any lines that copy the old `src/content-loader.js` file to `dist/`.
    3. Remove any lines that copy individual `src/content/*.js` files to `dist/content/` (as they are now bundled).
    4. Verify the script correctly places the generated `dist/content/content.bundle.js` and its sourcemap (`dist/content/content.bundle.js.map`) into the final build output directory (`dist`).
    5. Ensure any necessary `src/utils/*.js` files used by *other* parts of the extension (background, popup, options) are still copied correctly if needed.
  - Depends On: T003, T005
  - AC Ref: None

- [ ] T009: Verify fix and mark original task complete
  - Action: Execute the updated build process (e.g., `npm run build` or `bash ./scripts/build-extension.sh`). Load the unpacked extension from the `dist` directory into Chrome. Test the extension on relevant websites, checking for:
    1. Absence of errors related to module loading or `window.timeIsMoney...` in the DevTools console for the content script context.
    2. Correct functionality of the extension (e.g., price conversions).
    Once verified, mark the original task T001 as complete: `[x] T001: Resolve ES6 module loading issue in content scripts (Original Task)`.
  - Depends On: T004, T007, T008
  - AC Ref: None