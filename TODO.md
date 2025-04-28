Okay, here is the task breakdown for the Remediation Plan:

---

- [x] T1: Fix Invalid Background Script Type in Manifest (Original Plan Item: cr-11)
  - Action: Edit `src/manifest.json`. Locate the `background` object and remove the line `"type": "module"`.
  - Depends On: None
  - AC Ref: Extension loads without errors (manifest, background). [Validation Checklist: Extension loads without errors (manifest, background)]

- [x] T2: Update Build Script for Options/Popup File Copying (Original Plan Item: cr-07)
  - Action: Modify `scripts/build-extension.sh`. Change the `cp` commands for `src/options/` and `src/popup/` to recursively copy all contents (e.g., `cp -R src/options/* dist/options/` and `cp -R src/popup/* dist/popup/`).
  - Depends On: None
  - AC Ref: Run `npm run build`. Verify that all expected JS files (including sub-modules) from `src/options` and `src/popup` are present in the `dist/options` and `dist/popup` directories respectively. [Validation Checklist: `npm run build` completes successfully]

- [x] T3: Modify Development Load Script to Use Build Output (Original Plan Item: cr-08)
  - Action: Edit `scripts/load-extension.sh`. Add a command to run the build script (`npm run build` or `bash scripts/build-extension.sh`) *before* the command that loads the extension into Chrome. Update the Chrome loading command to point to the `dist/` directory instead of `src/`.
  - Depends On: [T2]
  - AC Ref: Run `npm run start`. Verify that the build process runs automatically and the extension loaded in the browser is the one from the `dist/` directory. [Validation Checklist: `npm run start` loads the built extension correctly]

- [x] T4: Replace Deprecated `chrome.browserAction` with `chrome.action` (Original Plan Item: cr-02)
  - Action: Search the codebase (`*.js`, `*.test.js`, `*.setup.js`) for all instances of `chrome.browserAction` and replace them with `chrome.action`. Update Jest mocks in `jest.setup.js` to correctly stub `chrome.action` methods like `onClicked.addListener` and `setIcon`. Run `npm test` and fix any resulting test failures.
  - Depends On: [T1]
  - AC Ref: Codebase search confirms no remaining `chrome.browserAction` references. Run tests (`npm test`) and verify they pass using the updated `chrome.action` mocks. [Validation Checklist: All automated tests pass]

- [x] T5: Standardize and Fix Extension Icon Paths (Original Plan Item: cr-01)
  - Action: In `src/background/background.js`, update all `chrome.action.setIcon` calls to use root-relative paths (e.g., `path: '/images/icon_38.png'`). Ensure `src/manifest.json` uses the same root-relative paths in the `icons` and `action.default_icon` fields. Delete the old, unused `background.js` file if one exists separate from the service worker script.
  - Depends On: [T1, T4]
  - AC Ref: Build the extension (`npm run build`) and load it (`npm run start`). Verify the extension icon appears correctly in the browser toolbar upon installation and updates dynamically if triggered by `setIcon`. [Validation Checklist: Icons load and update correctly]

- [x] T6: Implement Promise Error Rejection in `storage.js` Wrappers (Original Plan Item: cr-03)
  - Action: Modify the promise wrapper functions in `src/utils/storage.js` for `chrome.storage.sync.get` and `chrome.storage.sync.set`. Inside the callback provided to the Chrome API, check for `chrome.runtime.lastError`. If it exists, call `reject(chrome.runtime.lastError)` for the promise returned by the wrapper function.
  - Depends On: [T1]
  - AC Ref: Review `storage.js` code changes. Unit tests for storage utilities should verify that errors are correctly rejected.

- [x] T7: Add `.catch` Handlers for Storage Operations Callsites (Original Plan Item: cr-03)
  - Action: Search the codebase (e.g., `content/index.js`, `options/formHandler.js`, `background/background.js`) for all calls to `getSettings()` and `saveSettings()`. Append a `.catch(error => { console.error('Storage operation failed:', error); /* Optional: Add user notification logic */ })` block to each promise chain where one is missing.
  - Depends On: [T6]
  - AC Ref: Review code changes to confirm `.catch` blocks are present on all relevant promise chains. Trigger a storage error (e.g., by exceeding quota in dev tools, or temporarily modifying `storage.js` to always reject) and verify the error is caught and logged to the console without causing an uncaught promise rejection. [Validation Checklist: No console errors during normal operation (related to uncaught promises)]

- [x] T8: Prevent Settings Overwrite on Extension Update (Original Plan Item: cr-09)
  - Action: Modify the `handleExtensionInstalled` function (or equivalent `chrome.runtime.onInstalled` listener) in `src/background/background.js`. Before potentially calling `saveSettings(defaultSettings)`, call `getSettings()`. In the `.then()` block, check if essential settings keys (e.g., `amount`, `disabled`) already exist in the retrieved settings object (check for `undefined` or use `hasOwnProperty`). Only call `saveSettings(defaultSettings)` if these keys are missing. Optionally, add specific logic based on `details.reason === 'install'` vs `'update'`.
  - Depends On: [T1, T4, T7]
  - AC Ref: Install the extension, change settings. Update the extension (e.g., reload via `npm run start`). Verify that the previously changed settings are retained and not overwritten by defaults. [Validation Checklist: Settings persist across updates]

- [x] T9: Implement Input Validation for 'Amount' in Options Form (Original Plan Item: cr-06)
  - Action: In `src/options/options.html` (or equivalent), ensure the input field for the amount uses `<input type="number" min="0" step="any">`. In `src/options/formHandler.js` (`saveOptions` function), retrieve the amount value, parse it (e.g., `parseFloat`), and validate that it's a finite, positive number (>= 0) and potentially within a reasonable maximum range.
  - Depends On: [T2, T3]
  - AC Ref: Open the options page. Verify the amount input restricts non-numeric characters (browser behavior). Enter negative numbers, leave empty, enter text via devtools manipulation: verify saving is blocked and user feedback (e.g., message near field, field outline) indicates the error. Enter valid positive numbers (0, 1, 123.45): verify these are accepted for saving. [Validation Checklist: Options page saves valid input, rejects invalid input]

- [x] T10: Implement Input Validation/Sanitization for 'Symbol/Code' in Options Form (Original Plan Item: cr-06)
  - Action: In `src/options/formHandler.js` (`saveOptions` function), retrieve the currency symbol and code values. Define and apply validation rules (e.g., using a strict regex like `^[^\<\>]{1,5}$` to allow most symbols but block HTML, checking length limits). Trim whitespace before validation.
  - Depends On: [T2, T3]
  - AC Ref: Open the options page. Enter overly long strings, strings with forbidden characters (e.g., `<script>`), or empty strings (if disallowed): verify saving is blocked and user feedback indicates the error. Enter valid examples (e.g., "$", "USD", "€"): verify these are accepted for saving. [Validation Checklist: Options page saves valid input, rejects invalid input]

- [x] T11: Ensure Options Validation Occurs Before Saving Attempt (Original Plan Item: cr-06)
  - Action: Review and refactor `src/options/formHandler.js` (`saveOptions` function). Consolidate all validation logic (from T9, T10) to execute at the beginning of the function. If any validation check fails, display appropriate user feedback (error messages) and immediately `return` to prevent the `saveSettings()` call.
  - Depends On: [T9, T10]
  - AC Ref: Code review confirms validation checks precede the `saveSettings` call. Test cases from T9/T10 should demonstrate that `saveSettings` is not invoked when validation fails (verify via console logs, breakpoints, or checking if the "saved" confirmation appears).

- [x] T12: Add Unit Tests for Options Form Input Validation (Original Plan Item: cr-06)
  - Action: Create or update test files for `src/options/formHandler.js`. Add specific test cases simulating form submission with various invalid inputs for amount, symbol, and code (empty, non-numeric, negative, large values, invalid characters, potential XSS attempts like `<script>`). Assert that the validation logic correctly identifies these inputs as invalid and prevents the `saveSettings` function (mock) from being called.
  - Depends On: [T9, T10, T11]
  - AC Ref: Run `npm test`. Verify new tests covering invalid input scenarios pass. [Validation Checklist: All automated tests pass]

- [ ] T13: Fix Options Window Closing Logic (Original Plan Item: cr-17)
  - Action: Modify `src/options/formHandler.js` (`saveOptions` function). Ensure `window.close()` is called *only* within the `.then()` block of a successful `saveSettings()` call (after validation in T11 has passed). Ensure the `.catch()` block for `saveSettings()` displays an error but does *not* call `window.close()`. Ensure validation failures also prevent `window.close()`.
  - Depends On: [T7, T11]
  - AC Ref: Test saving valid options: verify the window closes after saving. Test saving with invalid input (triggering validation errors): verify the window stays open and shows an error. Test saving under conditions that cause `saveSettings` to fail (if mockable/testable): verify the window stays open and shows a storage error. [Validation Checklist: Options page ... closes correctly]

- [ ] T14: Restrict Broad Host Permissions in Manifest (Original Plan Item: cr-10)
  - Action: Identify the specific domains the extension *needs* to operate on (e.g., `"*://*.amazon.com/*"`, `"*://*.ebay.com/*"`). Edit `src/manifest.json` and replace `"host_permissions": ["*://*/*"]` with the specific list of required domain patterns. If broad access is genuinely unavoidable after review, add a comment in the manifest justifying it.
  - Depends On: [T1]
  - AC Ref: Load the updated extension. Verify the permissions warning during installation requests access only to the specified sites. Test the extension on a permitted site (verify it works) and a non-permitted site (verify it does not activate or throw errors related to permissions). [Validation Checklist: Host permission prompt requests minimal scope]

- [ ] T15: Refactor Content Script to Fetch Settings Once Per Batch (Original Plan Item: cr-04)
  - Action: Locate the main processing loop or MutationObserver callback in `src/content/domScanner.js` (or equivalent). Call `getSettings()` *once* at the beginning of this cycle/batch processing logic. In the `.then()` block, pass the retrieved `settings` object as an argument to downstream functions like `convert`. In the `.catch()` block (or if settings are unavailable), ensure the conversion process for that batch is skipped gracefully.
  - Depends On: [T7]
  - AC Ref: Use browser developer tools (Performance tab, console logging of storage calls) to verify that `getSettings` (or the underlying `chrome.storage.get`) is called significantly less often (ideally once per mutation batch or processing cycle) during page interaction on dynamic sites. Observe improved responsiveness. [Validation Checklist: Performance acceptable on dynamic pages]

- [ ] T16: Implement Size Limit and Cleanup for Mutation Observer Sets (Original Plan Item: cr-05)
  - Action: In `src/content/domScanner.js`, define a constant (e.g., `MAX_PENDING_NODES = 1000`). In the `MutationObserver` callback, before adding nodes to `pendingNodes`/`pendingTextNodes`, check if `Set.size` exceeds the limit. If so, consider logging a warning or potentially triggering immediate processing (`processPendingNodes()`) and clearing the sets *before* adding the new nodes (evaluate trade-offs). Ensure `processPendingNodes` reliably clears the sets after processing. Add a `window.addEventListener('unload', ...)` handler to clear the sets when the page unloads.
  - Depends On: [T15]
  - AC Ref: Test on pages with very frequent DOM mutations (e.g., infinite scroll, live feeds). Use the browser's memory profiler to monitor the content script's memory usage over time. Verify that memory usage remains relatively stable and does not grow indefinitely. Check console for warnings if implemented.

- [ ] T17: Refactor Amazon Handler to Remove Global State (Original Plan Item: cr-12)
  - Action: Edit `src/content/amazonHandler.js`. Remove the module-level global variable (`priceState`). Modify the main `walk` function (or equivalent entry point) to initialize and manage any necessary state locally within its scope (e.g., in an object passed recursively). Pass required state/context explicitly as arguments to any helper functions called during DOM traversal. Update associated unit tests to provide necessary context/state when testing functions in isolation.
  - Depends On: [T1]
  - AC Ref: Code review confirms the module-level state variable is removed and state is passed via parameters or managed locally. Run existing tests for `amazonHandler.js` and verify they still pass after refactoring.

- [ ] T18: Implement Robust Price Parsing for Locales (Original Plan Item: cr-14)
  - Action: Research and select a robust parsing strategy (Option A: `Intl` APIs if suitable, Option B: Library, Option C: Enhanced Regex). Implement the chosen strategy in `src/content/priceFinder.js`, replacing the existing regex logic. Add or update unit tests with examples of various international currency formats (e.g., `1.234,56 €`, `$1,234.56`, `¥1234`, `£12.34`, `1 234,56 kr`).
  - Depends On: [T1]
  - AC Ref: Run unit tests and verify they pass for diverse currency formats. Manually test on websites known to use different formats (e.g., amazon.de, amazon.co.uk, amazon.jp) and verify prices are parsed and converted correctly. [Validation Checklist: Price conversion works on target sites (check multiple locales)]

- [ ] T19: Refactor Brittle Tests Relying on Implementation Details (Original Plan Item: cr-16)
  - Action: Review tests in `dom-conversion.test.js` and `performance.test.js`. Identify assertions that query specific internal CSS classes (e.g., `.tim-converted-price`) or rely heavily on the exact DOM structure created during conversion (e.g., specific wrapper divs). Modify these tests to assert on the final, user-visible text content of the relevant elements instead, using more general selectors (e.g., targeting the original element) or text matching where possible.
  - Depends On: [T4]
  - AC Ref: Run `npm test`. Verify the refactored tests pass. Code review confirms tests focus on observable outcomes rather than internal structure/classes. Future minor refactors of conversion logic/styling should not break these tests unnecessarily. [Validation Checklist: All automated tests pass]

- [ ] T20: Add/Improve JSDoc for Background and Utility Scripts (Original Plan Item: cr-13)
  - Action: Review JS files in `src/background/` and `src/utils/`. Add or complete JSDoc blocks (`/** ... */`) for all functions, detailing purpose, `@param {type} name - Description`, `@returns {type} - Description`, and any side effects or `@throws`. Ensure module-level descriptions are present where appropriate.
  - Depends On: None
  - AC Ref: Code review confirms comprehensive JSDoc coverage for the specified directories. JSDoc generates without errors/warnings for these files (if tool used).

- [ ] T21: Add/Improve JSDoc for Content Scripts (Original Plan Item: cr-13)
  - Action: Review JS files in `src/content/` (including handlers like `amazonHandler.js`), `src/content/domScanner.js`, and `src/content/priceFinder.js`. Add or complete JSDoc blocks for all functions as described in T20.
  - Depends On: None
  - AC Ref: Code review confirms comprehensive JSDoc coverage for the specified files/directories. JSDoc generates without errors/warnings for these files.

- [ ] T22: Add/Improve JSDoc for UI Scripts (Options/Popup) (Original Plan Item: cr-13)
  - Action: Review JS files in `src/options/` and `src/popup/`. Add or complete JSDoc blocks for all functions as described in T20.
  - Depends On: None
  - AC Ref: Code review confirms comprehensive JSDoc coverage for the specified directories. JSDoc generates without errors/warnings for these files.

- [ ] T23: Configure and Enforce JSDoc Linting (Original Plan Item: cr-13)
  - Action: Install `eslint-plugin-jsdoc` (`npm install --save-dev eslint-plugin-jsdoc`). Configure ESLint rules (`.eslintrc.js` or similar) to require JSDoc comments (e.g., using `plugin:jsdoc/recommended` or specific rules like `jsdoc/require-jsdoc`, `jsdoc/require-param-description`, `jsdoc/require-returns-description`). Run `eslint . --fix` or manually address all reported JSDoc linting errors/warnings across the codebase.
  - Depends On: [T20, T21, T22]
  - AC Ref: ESLint configuration includes JSDoc rules. Running `npm run lint` (or equivalent ESLint command) passes without any JSDoc-related errors. [Validation Checklist: Static analysis (ESLint, Prettier) passes]

- [ ] T24: Investigate and Potentially Tune Mutation Observer Debounce (Original Plan Item: cr-15)
  - Action: Benchmark conversion performance and reliability on known highly dynamic websites (e.g., infinite scroll feeds, sites with frequent XHR updates). If significant lag or missed conversions are observed and attributable to the fixed debounce: implement Option A (add a "Debounce Interval (ms)" setting to the options page, read this value from settings in `domScanner.js`) or research Option B (adaptive debounce/throttle - potentially defer if complex). Validate that the chosen solution improves performance/reliability on the problematic sites without degrading performance on static pages.
  - Depends On: [T16]
  - AC Ref: Conversion performance and reliability are deemed acceptable on a range of tested dynamic websites based on benchmarks. If changes were made (e.g., configurable debounce), verify the setting works and improves the situation on problematic sites. [Validation Checklist: Performance acceptable on dynamic pages]