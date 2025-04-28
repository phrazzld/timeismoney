```markdown
# Remediation Plan – Sprint 1

## Executive Summary
This plan targets critical blockers undermining the extension's stability, security, and Manifest V3 compliance. We prioritize foundational fixes (manifest, API usage, build scripts) to enable stable development, followed by critical security, data integrity, and performance issues. Completing these items will restore core functionality, ensure user data safety, and establish a reliable build and development process.

## Strike List
| Seq | CR-ID | Title                                             | Effort | Owner? |
|-----|-------|---------------------------------------------------|--------|--------|
| 1   | cr-11 | Manifest: Invalid Background Script Type          | xs     | ExtDev |
| 2   | cr-01 | Service Worker & Extension Icon Path Broken       | s      | ExtDev |
| 3   | cr-02 | Inconsistent Chrome API Usage (MV2 Relics)        | s      | ExtDev |
| 4   | cr-07 | Build Script: Incomplete File Copying             | xs     | Build  |
| 5   | cr-08 | Development Load Script Bypasses Build            | s      | Build  |
| 6   | cr-10 | Manifest: Host Permissions Too Broad              | s      | ExtDev |
| 7   | cr-09 | Background: Default Settings Overwrite            | s      | ExtDev |
| 8   | cr-06 | Options Form: Missing Input Sanitization/Validation | m      | ExtDev |
| 9   | cr-03 | Uncaught Asynchronous Errors in Promises          | m      | ExtDev |
| 10  | cr-04 | Content Script: Repeated Settings Fetch Per Node    | m      | ExtDev |
| 11  | cr-05 | Mutation Observer: Potential Memory Leaks         | m      | ExtDev |
| 12  | cr-17 | Options: saveOptions Closes Window on Error       | xs     | ExtDev |
| 13  | cr-12 | Amazon Handler: Global State Violation            | s      | ExtDev |
| 14  | cr-14 | Price Parsing: Regex Patterns Not Robust          | m      | ExtDev |
| 15  | cr-15 | Mutation Observer: Debounce May Miss Mutations    | s      | ExtDev |
| 16  | cr-16 | Tests: Over-Reliance on Implementation Details    | s      | Tests  |
| 17  | cr-13 | Inconsistent JSDoc Coverage and Quality           | l      | ExtDev |

## Detailed Remedies

---

### cr-11 Manifest: Invalid Background Script Type
- **Problem:** `manifest.json` uses an invalid `"type": "module"` property for the background service worker.
- **Impact:** Prevents the background script from loading (Manifest V3 compliance failure).
- **Chosen Fix:** Remove the invalid property. Service workers use ES modules by default.
- **Steps:**
  1. Edit `src/manifest.json`.
  2. Remove the line `"type": "module"` within the `background` object.
  3. Verify the extension loads without manifest errors in Chrome Developer Tools.
- **Done-When:** Background script loads and executes without manifest errors.

---

### cr-01 Service Worker & Extension Icon Path Broken
- **Problem:** Icon paths are inconsistent between `manifest.json` and `chrome.action.setIcon` calls, and old script paths are wrong.
- **Impact:** Extension icon fails to load or update correctly, breaking core browser integration.
- **Chosen Fix:** Standardize all icon paths to be relative to the extension root (e.g., `/images/icon.png`) in both manifest and background script. Remove old script.
- **Steps:**
  1. In `src/background/background.js`, update all `chrome.action.setIcon` calls to use root-relative paths (e.g., `path: '/images/icon_38.png'`).
  2. Ensure `manifest.json` uses the same root-relative paths for `icons` and `action.default_icon`.
  3. Delete the old `background.js` file.
  4. Build the extension and verify icons load and update correctly in the browser toolbar.
- **Done-When:** Icons load correctly on install and update dynamically via `setIcon` after build.

---

### cr-02 Inconsistent Chrome API Usage (MV2 Relics)
- **Problem:** Code and test mocks reference deprecated `chrome.browserAction` instead of the required `chrome.action` for MV3.
- **Impact:** Runtime failures in the browser and inaccurate test results masking bugs.
- **Chosen Fix:** Replace all instances and mocks of `chrome.browserAction` with `chrome.action`.
- **Steps:**
  1. Search codebase for `chrome.browserAction` (in `*.js`, `*.test.js`, `*.setup.js`).
  2. Replace all occurrences with `chrome.action`.
  3. Update `jest.setup.js` mocks to correctly stub `chrome.action` (e.g., `chrome.action = { onClicked: { addListener: jest.fn() }, setIcon: jest.fn() }`).
  4. Run tests and fix any failures related to the API change.
- **Done-When:** Codebase is free of `chrome.browserAction`; tests pass using `chrome.action` mocks.

---

### cr-07 Build Script: Incomplete File Copying for Options
- **Problem:** Build script (`build-extension.sh`) only copies top-level JS files, missing necessary sub-modules in `src/options/` and `src/popup/`.
- **Impact:** Options and Popup pages are broken in the production build (`dist/`) due to missing JavaScript files.
- **Chosen Fix:** Update build script to copy entire directories or explicitly list all required files.
- **Steps:**
  1. Modify `scripts/build-extension.sh`.
  2. Change `cp src/options/*.js dist/options/` to `cp -R src/options/* dist/options/` (or list all files explicitly).
  3. Do the same for the `popup` directory.
  4. Run `npm run build` and inspect `dist/options` and `dist/popup` to confirm all JS files are present.
- **Done-When:** All necessary JS files for options and popup are present in the `dist` directory after build.

---

### cr-08 Development Load Script Bypasses Build
- **Problem:** Development script (`load-extension.sh` via `npm run start`) loads the extension from `src/`, skipping the build process.
- **Impact:** Development environment doesn't match production, hiding bundling issues, module resolution problems, and build script errors.
- **Chosen Fix:** Modify the development load script to first build the extension and then load it from the `dist/` directory.
- **Steps:**
  1. Edit `scripts/load-extension.sh`.
  2. Add a command to execute the build script (`npm run build` or `bash scripts/build-extension.sh`) before the Chrome loading command.
  3. Update the Chrome loading command to point to the `dist/` directory.
  4. Test `npm run start` ensures a build happens and loads the bundled extension.
- **Done-When:** `npm run start` reliably builds and loads the extension from `dist/`.

---

### cr-10 Manifest: Host Permissions Too Broad
- **Problem:** `manifest.json` requests `"host_permissions": ["*://*/*"]`, granting access to all websites.
- **Impact:** Violates Principle of Least Privilege, increases security attack surface, and poses a significant user privacy risk.
- **Chosen Fix:** Restrict `host_permissions` to only the necessary domains where the extension needs to function.
- **Steps:**
  1. Identify the specific domains (e.g., `"*://*.amazon.com/*"`, `"*://*.ebay.com/*"`) where price conversion is intended.
  2. Replace `"*://*/*"` in `src/manifest.json` with the specific list of required host permissions.
  3. If broad access is genuinely unavoidable, document the rationale and security implications clearly in the README or security documentation.
  4. Test the extension functions correctly on permitted sites and is blocked on others.
- **Done-When:** Manifest uses minimal required host permissions; permission prompts reflect reduced scope.

---

### cr-09 Background: Default Settings Overwrite on Install/Update
- **Problem:** Default settings are unconditionally saved via `saveSettings` during `chrome.runtime.onInstalled`, overwriting existing user settings on every update.
- **Impact:** User customizations are lost on update, leading to data loss and poor user experience.
- **Chosen Fix:** Check for existing settings before saving defaults during `onInstalled`.
- **Steps:**
  1. Modify `handleExtensionInstalled` in `src/background/background.js`.
  2. Before calling `saveSettings(defaultSettings)`, call `getSettings()`.
  3. Check if essential settings keys (e.g., `amount`, `disabled`) exist in the retrieved settings.
  4. Only call `saveSettings(defaultSettings)` if essential settings are missing or undefined.
  5. Add specific checks for `details.reason === 'install'` vs `'update'` if different behavior is desired (e.g., only opening options page on initial install).
- **Done-When:** User settings persist across extension updates.

---

### cr-06 Options Form: Missing Input Sanitization/Validation & XSS Risk
- **Problem:** User input for currency symbol, code, and amount is saved without proper sanitization or validation.
- **Impact:** Potential XSS if symbols/codes are rendered elsewhere; runtime errors from invalid 'amount' input (non-numeric, negative, etc.); corrupted settings.
- **Chosen Fix:** Implement strict input validation (type, range, format) and sanitization before saving settings.
- **Steps:**
  1. **Amount:** Use `<input type="number" min="0" step="any">`. In `saveOptions`, parse input, verify it's a finite, positive number within reasonable bounds. Reject invalid input with user feedback.
  2. **Symbol/Code:** Define allowed characters/formats using a strict regex or whitelist. Reject invalid input. Escape these values if ever rendered directly in HTML.
  3. Ensure validation happens *before* calling `saveSettings`.
  4. Add tests for various invalid inputs (empty, non-numeric, negative, large values, script injection attempts).
- **Done-When:** Invalid or malicious input is rejected; only valid, sanitized data is saved.

---

### cr-03 Uncaught Asynchronous Errors in Promises
- **Problem:** Promises returned by `chrome.storage` calls (`getSettings`, `saveSettings`) lack `.catch()` handlers.
- **Impact:** Storage API failures (quota exceeded, transient errors) occur silently, leading to inconsistent state, corrupted data, or crashes.
- **Chosen Fix:** Add `.catch()` blocks to all `chrome.storage` promise chains and ensure `storage.js` rejects on `chrome.runtime.lastError`.
- **Steps:**
  1. Modify `src/utils/storage.js`: In the promise wrappers for `chrome.storage.sync.get` and `chrome.storage.sync.set`, check `chrome.runtime.lastError` after the callback and `reject(chrome.runtime.lastError)` if it exists.
  2. Add `.catch(error => { console.error('Storage operation failed:', error); /* Handle appropriately, e.g., notify user */ })` to all call sites of `getSettings()` and `saveSettings()` (e.g., in `content/index.js`, `options/formHandler.js`).
- **Done-When:** All storage operations handle potential errors gracefully; errors are logged or reported.

---

### cr-04 Content Script: Repeated Settings Fetch Per Node
- **Problem:** The `convert` function calls `getSettings()` for every text node processed if settings aren't preloaded.
- **Impact:** Massive performance degradation (thousands of async calls), potential `chrome.storage` quota exhaustion, unpredictable behavior.
- **Chosen Fix:** Fetch settings once per processing cycle (e.g., per mutation observer batch) and pass the settings object down.
- **Steps:**
  1. Refactor the main processing loop (`processPage` or observer callback in `domScanner.js`).
  2. Call `getSettings()` *once* at the beginning of the cycle.
  3. If settings are successfully retrieved, pass the `settings` object as an argument to `convert` and other functions needing them.
  4. If settings fetch fails or settings are unavailable, skip the conversion process for that cycle.
- **Done-When:** `getSettings` is called only once per scan/update batch; performance significantly improved on dynamic pages.

---

### cr-05 Mutation Observer: Potential Memory Leaks and Unbounded Set Growth
- **Problem:** `pendingNodes` and `pendingTextNodes` Sets in `domScanner.js` can grow indefinitely on pages with continuous DOM mutations.
- **Impact:** Excessive memory consumption leading to content script/tab crashes (DoS vulnerability).
- **Chosen Fix:** Implement size limits on the Sets and ensure reliable cleanup.
- **Steps:**
  1. Define a maximum size constant (e.g., `MAX_PENDING_NODES = 1000`).
  2. In the `MutationObserver` callback, before adding to the sets, check their current size.
  3. If `Set.size >= MAX_PENDING_NODES`, either:
     *   Trigger an immediate synchronous processing of the current batch (`processPendingNodes()`) and clear the sets.
     *   Or, discard the oldest nodes to make room (less ideal).
  4. Ensure the sets are explicitly cleared (`pendingNodes.clear()`) in the `processPendingNodes` function after processing and in unload handlers (`window.addEventListener('unload', ...)`).
  5. Test on infinite scroll pages or pages with frequent DOM updates.
- **Done-When:** Memory usage remains stable under heavy DOM mutation load; sets do not grow indefinitely.

---

### cr-17 Options: saveOptions Closes Window Even on Validation Error
- **Problem:** The options window `window.close()` call occurs within the `.then()` of `saveSettings`, but validation might fail before saving, or saving might fail, leaving the window open incorrectly or closing when it shouldn't.
- **Impact:** Confusing user experience – window stays open after failed validation or save, or closes unexpectedly.
- **Chosen Fix:** Ensure `window.close()` is called *only* after both validation and the save operation succeed.
- **Steps:**
  1. In `src/options/formHandler.js` (`saveOptions`):
  2. Perform all input validation first. If validation fails, show an error message and `return` (do not proceed to save or close).
  3. If validation passes, call `saveSettings()`.
  4. Place `window.close()` *inside* the `.then()` block of the `saveSettings()` promise.
  5. Ensure the `.catch()` block for `saveSettings()` shows an error but does *not* call `window.close()`.
- **Done-When:** Options window closes reliably only upon successful validation and saving; stays open on any error.

---

### cr-12 Amazon Handler: Global State Violation
- **Problem:** `src/content/amazonHandler.js` uses a module-level global variable (`priceState`) to manage state during DOM traversal.
- **Impact:** Creates hidden dependencies, makes the module difficult to test reliably, and prone to errors if execution interleaves unexpectedly.
- **Chosen Fix:** Refactor to eliminate the module-level state, passing state explicitly between function calls or managing it within the scope of the main walk function.
- **Steps:**
  1. Remove the global `priceState` variable.
  2. Modify the `walk` function (or equivalent) to initialize and manage state locally within its scope.
  3. Pass necessary state/context as arguments to helper functions called during the traversal.
  4. Update unit tests to provide context/state for isolated function tests.
- **Done-When:** `amazonHandler.js` is stateless at the module level; functions operate predictably based on inputs.

---

### cr-14 Price Parsing: Regex Patterns Not Robust for Locales
- **Problem:** Price parsing regex in `src/content/priceFinder.js` assumes specific Western currency formats (decimal/thousands separators, symbol position).
- **Impact:** Fails to correctly parse prices on websites using different international formats (e.g., `1.234,56` EUR, `¥1234` JPY).
- **Chosen Fix:** Replace simplistic regex with a more robust, locale-aware parsing method. Use `Intl.NumberFormat` or a dedicated library if possible.
- **Steps:**
  1. Research and select a robust parsing strategy:
     *   Option A: Use `Intl.NumberFormat.parse` (if available/suitable) or related `Intl` APIs.
     *   Option B: Adopt a lightweight, well-tested currency parsing library.
     *   Option C (Fallback): Enhance regexes significantly to handle common variations (different separators, optional decimals, symbol positions).
  2. Implement the chosen strategy in `priceFinder.js`, replacing the existing regex logic.
  3. Add test cases covering various currency formats (USD, EUR, GBP, JPY, etc.).
- **Done-When:** Price parsing correctly handles multiple common international currency formats.

---

### cr-15 Mutation Observer: Debounce May Miss Rapid/Complex Mutations
- **Problem:** The fixed 200ms debounce in `domScanner.js` might be too long (causing delays) or too short (causing excessive processing or missing nodes added/removed quickly).
- **Impact:** Noticeable lag in conversions on highly dynamic pages, or potentially missed conversions if DOM changes occur within the debounce window.
- **Chosen Fix:** Test thoroughly on dynamic sites. Consider making the debounce interval configurable or exploring adaptive strategies.
- **Steps:**
  1. Benchmark performance on known dynamic sites (infinite scroll, live feeds).
  2. If issues persist:
     *   Option A: Add a "Debounce Interval (ms)" setting to the options page, allowing users to tune it. Read this value from settings in `domScanner.js`.
     *   Option B: Explore adaptive debouncing or throttling based on mutation frequency.
  3. Validate the chosen solution improves responsiveness/reliability on problematic sites.
- **Done-When:** Conversion performance and reliability are acceptable on a range of dynamic websites.

---

### cr-16 Tests: Over-Reliance on Implementation Details
- **Problem:** Tests in `dom-conversion.test.js` and `performance.test.js` directly query DOM elements based on internal class names (`.price`, `.tim-converted-price`) and structure.
- **Impact:** Tests are brittle and break easily on minor UI or implementation refactors, even if the user-facing functionality remains correct.
- **Chosen Fix:** Refactor tests to focus on observable outcomes (final rendered text) rather than internal DOM structure or specific class names.
- **Steps:**
  1. Identify test assertions relying on specific CSS classes or deep DOM queries.
  2. Modify tests to:
     *   Set up the initial DOM state.
     *   Trigger the content script's processing.
     *   Assert the final, user-visible text content of relevant elements, possibly using more general selectors or text-based queries.
  3. Remove assertions tightly coupled to implementation details like specific wrapper elements or class names added during conversion.
- **Done-When:** Tests verify the correct final text output without depending on internal DOM structure or class names.

---

### cr-13 Inconsistent JSDoc Coverage and Quality
- **Problem:** JSDoc comments are missing or incomplete for many functions, especially helpers, and quality varies.
- **Impact:** Codebase is harder to understand, maintain, and onboard new developers; hinders automated documentation generation.
- **Chosen Fix:** Add comprehensive JSDoc comments (@param, @returns, description) to all functions and enforce coverage.
- **Steps:**
  1. Systematically review all JS files in `src/`.
  2. Add clear JSDoc blocks for every function, explaining purpose, parameters, return values, and any side effects. Include module-level documentation where appropriate.
  3. Configure ESLint with a JSDoc plugin (`eslint-plugin-jsdoc`) to enforce presence and basic correctness of comments.
  4. Run `eslint --fix` or manually address all JSDoc linting errors.
- **Done-When:** All functions have complete JSDoc comments; JSDoc linting passes without errors.

## Standards Alignment
- **Simplicity:** Fixes target removing ambiguity (API usage, paths), duplication (build steps), and unnecessary complexity (global state).
- **Modularity:** Isolating state (cr-12), ensuring components handle errors internally (cr-03), and reducing coupling (cr-04, cr-16).
- **Testability:** Correcting API mocks (cr-02), removing global state (cr-12), and making tests less brittle (cr-16). Aligning dev/prod environments (cr-08).
- **Coding Standards:** Enforcing consistency (paths, APIs), improving documentation (cr-13), ensuring robustness (error handling, validation).
- **Security:** Explicitly addressing XSS (cr-06) and reducing attack surface (cr-10). Ensuring data integrity (cr-09). Mitigating DoS (cr-05).

## Validation Checklist
- [ ] All automated tests (unit, integration if any) pass.
- [ ] Static analysis (ESLint, Prettier) passes with no new warnings/errors.
- [ ] `npm run build` completes successfully.
- [ ] `npm run start` loads the built extension correctly.
- [ ] Manual Testing:
    - [ ] Extension loads without errors (manifest, background).
    - [ ] Icons load and update correctly.
    - [ ] Host permission prompt requests minimal scope.
    - [ ] Settings persist across updates (`npm run start` multiple times).
    - [ ] Options page saves valid input, rejects invalid input, closes correctly.
    - [ ] Price conversion works on target sites (check multiple locales if cr-14 implemented).
    - [ ] Performance acceptable on dynamic pages (e.g., infinite scroll).
    - [ ] No console errors during normal operation.
- [ ] Code review sign-off on all implemented fixes.
```