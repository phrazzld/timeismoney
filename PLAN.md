```markdown
# Remediation Plan – Sprint 1

## Executive Summary
This plan outlines the surgical strike needed to address critical security vulnerabilities, core logic flaws, and architectural deficiencies identified in the code review. We prioritize neutralizing immediate risks (XSS, data loss, MV3 incompatibility) and resolving fundamental logic/API issues. Subsequent steps focus on improving modularity, testability, performance, and developer tooling, ensuring a stable and maintainable extension.

## Strike List
| Seq | CR‑ID             | Title                                                   | Effort | Owner?   |
|-----|-------------------|---------------------------------------------------------|--------|----------|
| 1   | cr-02+cr-20+cr-17p1 | Fix Options XSS, Validation Logic, & Coupling           | S      | Frontend |
| 2   | cr-03+cr-18       | Fix Silent Storage Errors & Popup Close Timing          | S      | Frontend |
| 3   | cr-05+cr-25       | Simplify Converter API & Remove Dead Code               | XS     | Core     |
| 4   | cr-11             | Fix CI Branch Mismatch                                  | XS     | DevOps   |
| 5   | cr-19             | Fix Smoke Test Target (Source -> Dist)                  | XS     | DevOps   |
| 6   | cr-16             | Fix Inconsistent Module System Usage                    | XS     | Platform |
| 7   | cr-10             | Implement Controlled Logging Utility                    | S      | Core     |
| 8   | cr-07+cr-12       | Fix JSDoc Policy & Add Missing Docs                     | S      | Dev      |
| 9   | cr-04             | Fix Inconsistent Settings Propagation in DOM Scanner    | S      | Frontend |
| 10  | cr-08+cr-14       | Fix Coupling, Centralize Constants, Separate Concerns | M      | Core     |
| 11  | cr-06+cr-15p1     | Address Observer Performance Risk & Improve Testability | M      | Frontend |
| 12  | cr-09+cr-15p2     | Add Edge Case Tests (XSS, Storage, Observer)          | M      | QA/Dev   |
| 13  | cr-13             | Simplify Complex Regex Patterns                         | M      | Core     |
| 14  | cr-01+cr-23p1     | Execute Manifest V3 Migration & Harden Build Scripts    | L      | Platform |

## Detailed Remedies

### cr-02+cr-20+cr-17p1 Fix Options XSS, Validation Logic, & Coupling
- **Problem:** User input in the options form lacks sanitization (XSS risk), validation logic is weak and its results ignored, and the form handler is overly coupled.
- **Impact:** Stored XSS vulnerability, potential saving of invalid data, hard-to-maintain/test form logic.
- **Chosen Fix:** Implement robust input sanitization (escape/whitelist), strengthen validation regexes/checks, check validation return values, and extract validation logic.
- **Steps:**
  1.  In `formHandler.js`, sanitize all user inputs (`currencySymbol`, `amount`, `debounceInterval`) *before* validation/saving using HTML entity escaping or strict character whitelisting.
  2.  Strengthen validation regexes (e.g., for symbol, code) and add explicit range/length/numeric checks (`isFinite`).
  3.  Ensure `saveOptions` checks the boolean return value of `validateDebounceInterval` (and others) and returns early if `false`.
  4.  Extract validation functions (`validate*`) into a separate `src/options/validator.js` module.
- **Done‑When:** XSS vectors are neutralized, validation is strict and checked, logic is extracted, related tests pass.

### cr-03+cr-18 Fix Silent Storage Errors & Popup Close Timing
- **Problem:** Storage API errors are only logged to console, and the options popup close relies on `setTimeout`.
- **Impact:** Users unaware of settings save/load failures (data loss/confusion), potentially laggy popup close.
- **Chosen Fix:** Display user-facing errors for storage failures and close popup immediately on success.
- **Steps:**
  1.  Modify `.catch` blocks for `getSettings`/`saveSettings` calls in `formHandler.js` (and potentially `popup.js`, `background.js`) to display clear error messages in the UI (e.g., update `#status` div).
  2.  In `formHandler.js:saveOptions`, move `window.close()` to execute immediately after the `saveSettings()` promise resolves successfully, before any `setTimeout` for status message clearing.
- **Done‑When:** Storage failures show user errors, popup closes promptly on success, related tests pass.

### cr-05+cr-25 Simplify Converter API & Remove Dead Code
- **Problem:** `convertToTime` has a confusing dual signature (`typeof` check), and a `.bak` file exists.
- **Impact:** Unclear API, reduced testability, duplicated logic, source code clutter.
- **Chosen Fix:** Simplify `convertToTime` to accept only `priceValue` (number) and `hourlyRate` (number), centralize rate calculation, delete backup file.
- **Steps:**
  1.  Refactor `convertToTime` signature to `(priceValue, hourlyRate)`.
  2.  Remove internal `typeof` check and rate calculation logic.
  3.  Ensure callers (e.g., `convertPriceToTimeString`) calculate `hourlyRate` *before* calling `convertToTime`. Use or refine `calculateHourlyWage` as the single source for this.
  4.  Delete `src/utils/converter.js.bak`.
- **Done‑When:** `convertToTime` has a clean single signature, rate calculation is external, `.bak` file is gone, tests pass.

### cr-11 Fix CI Branch Mismatch
- **Problem:** CI workflow triggers and README badge reference inconsistent primary branch names (`main` vs `master`).
- **Impact:** Misleading CI status, contributor confusion.
- **Chosen Fix:** Standardize on `main` branch and update configuration/docs.
- **Steps:**
  1.  Ensure the repository's default branch is `main`.
  2.  Update `.github/workflows/ci.yml` triggers (`on.push.branches`, `on.pull_request.branches`) to `[ main ]`.
  3.  Update the README badge URL to reference `branch=main`.
- **Done‑When:** CI runs on `main`, badge reflects `main`, repository default is `main`.

### cr-19 Fix Smoke Test Target (Source -> Dist)
- **Problem:** Smoke test checks `src` directory, not the built `dist` directory.
- **Impact:** CI can pass smoke test even if the build fails or produces invalid output.
- **Chosen Fix:** Update smoke test script to validate the `dist` directory structure and contents.
- **Steps:**
  1.  Modify `scripts/smoke-test.js` to check for key files and structure within the `./dist` directory (e.g., `dist/manifest.json`, `dist/background.js`).
  2.  Ensure the CI workflow executes `npm run build` *before* `npm run smoke-test`.
- **Done‑When:** Smoke test validates the contents of the `dist` directory after a build.

### cr-16 Fix Inconsistent Module System Usage
- **Problem:** Project mixes ES6 modules (`import`/`export`) in `src` with CommonJS (`require`) in tests/config.
- **Impact:** Tooling complexity, non-standard setup, potential conflicts.
- **Chosen Fix:** Standardize on ES6 modules and configure tooling appropriately.
- **Steps:**
  1.  Add `"type": "module"` to `package.json`.
  2.  Update Jest/Babel configuration (`jest.config.js`, `babel.config.js`) to correctly handle ES6 modules (e.g., using necessary Babel transforms or Node's experimental module support flags if needed).
  3.  Convert any remaining `require`/`module.exports` in test files or helpers to `import`/`export`.
- **Done‑When:** Project uses ES6 module syntax consistently, build and test tooling handles it correctly.

### cr-10 Implement Controlled Logging Utility
- **Problem:** Direct `console.*` usage pollutes production console and cannot be easily controlled.
- **Impact:** Debugging noise, potential info leaks, unprofessional.
- **Chosen Fix:** Implement a simple logging utility with levels and build-time control.
- **Steps:**
  1.  Create `src/utils/logger.js` wrapping `console` methods (`debug`, `info`, `warn`, `error`).
  2.  Implement log levels and a mechanism to set the minimum level (e.g., via `process.env.NODE_ENV` during build).
  3.  Replace all `console.*` calls in `src/` with appropriate `logger.*` calls.
- **Done‑When:** Central logger exists, `console.*` calls removed from source, logging level configurable by build environment.

### cr-07+cr-12 Fix JSDoc Policy & Add Missing Docs
- **Problem:** JSDoc enforcement is inconsistent (strict rule + overrides), and many public APIs lack complete documentation.
- **Impact:** Unclear standards, poor maintainability, difficult onboarding.
- **Chosen Fix:** Define a clear JSDoc policy (e.g., public only), remove overrides, and add missing documentation.
- **Steps:**
  1.  Update `.eslintrc.js`: Configure `jsdoc/require-jsdoc` with appropriate settings (e.g., `publicOnly: true`).
  2.  Remove the specific `overrides` section disabling JSDoc rules for UI components.
  3.  Add/complete comprehensive JSDoc blocks (`@param`, `@returns`, descriptions) for all exported functions/classes in key modules (`storage.js`, `converter.js`, `domScanner.js`, etc.).
- **Done‑When:** ESLint enforces a consistent JSDoc policy, overrides removed, public APIs are documented.

### cr-04 Fix Inconsistent Settings Propagation in DOM Scanner
- **Problem:** `walk` function callback expects `settings`, but `walk` itself doesn't always receive/pass them consistently.
- **Impact:** Fragile logic, potential errors or incorrect behavior depending on invocation path (initial load vs. mutation).
- **Chosen Fix:** Refactor `walk` to always accept and pass a `settings` object; update all callers.
- **Steps:**
  1.  Modify `walk` signature in `domScanner.js` to accept `settings`: `walk(node, callback, settings, options = {})`.
  2.  Ensure `walk` passes `settings` down during recursive calls and to the `callback`.
  3.  Update all callers (`processPage` in `index.js`, `processPendingNodes` in `domScanner.js`) to fetch and provide the `settings` object when invoking `walk`.
- **Done‑When:** `walk` signature is consistent, all callers provide settings, logic behaves predictably, tests pass.

### cr-08+cr-14 Fix Coupling, Centralize Constants, Separate Concerns
- **Problem:** Modules share state implicitly (e.g., `amazonPriceState`), constants are duplicated/scattered, DOM logic mixed with business logic.
- **Impact:** High coupling, brittle code, difficult testing and refactoring.
- **Chosen Fix:** Enforce explicit state passing, centralize constants, and refactor for single responsibility.
- **Steps:**
  1.  Move all shared constants (CSS classes, keys, formats) to `src/utils/constants.js`.
  2.  Refactor functions relying on shared module state (e.g., `amazonPriceState` in `domScanner`) to accept state via parameters.
  3.  Separate responsibilities: `domScanner` finds nodes; `priceFinder` identifies prices; `converter` converts; `domModifier` updates DOM. Orchestrate these steps in `index.js`.
- **Done‑When:** No implicit state sharing, constants centralized, modules have clear single responsibilities, tests refactored and passing.

### cr-06+cr-15p1 Address Observer Performance Risk & Improve Testability
- **Problem:** Aggressive `MutationObserver` on `document.body` risks performance issues; observer logic is hard to unit test.
- **Impact:** Page slowdowns/crashes on dynamic sites, difficult to verify observer behavior.
- **Chosen Fix:** Implement performance monitoring/mitigation and refactor observer setup for testability.
- **Steps:**
  1.  Add performance timing (`performance.mark`/`measure` or `logger.debug` timings) around `processPendingNodes`.
  2.  Consider adding options for user to disable/throttle observation or refine observer targets (if feasible).
  3.  Refactor observer setup (`observeDomChanges`) to allow injecting a mock `MutationObserver` instance during tests.
  4.  Ensure the callback logic can be tested by passing mock mutation records.
- **Done‑When:** Observer performance is monitored, basic mitigations are in place, observer logic is unit-testable with mocks.

### cr-09+cr-15p2 Add Edge Case Tests (XSS, Storage, Observer)
- **Problem:** Test suite lacks coverage for critical edge cases like XSS, storage errors, observer stress/cleanup, and race conditions.
- **Impact:** Undetected regressions in security, error handling, and stability.
- **Chosen Fix:** Add targeted unit and potentially integration tests for identified gaps.
- **Steps:**
  1.  Add tests for `formHandler.js` attempting XSS injections via inputs (verify sanitization works).
  2.  Add tests for `storage.js` simulating `chrome.runtime.lastError` to verify error handling.
  3.  Add tests for `domScanner.js` simulating rapid mutations (using mocked observer/timers) and verifying `stopObserver` cleans up correctly.
  4.  Review core logic for other edge cases (e.g., zero/large values in converter) and add tests.
- **Done‑When:** New tests cover XSS, storage errors, observer lifecycle/stress, and other identified edge cases; coverage improves.

### cr-13 Simplify Complex Regex Patterns
- **Problem:** Price-finding regexes are complex, dynamically constructed, hard to read/maintain/debug.
- **Impact:** High risk of errors, difficulty extending for international formats.
- **Chosen Fix:** Simplify regex construction, add extensive unit tests, and document clearly.
- **Steps:**
  1.  Refactor regex construction in `priceFinder.js`. Break down complex ORs. Consider separate patterns for common cases (prefix/suffix symbol, separators).
  2.  Add comprehensive unit tests covering various currency formats (USD, EUR, JPY, etc.), edge cases (prices in text, multiple prices), and non-matches.
  3.  Add comments explaining the logic of each significant part of the regex patterns.
- **Done‑When:** Regex logic is clearer, maintainable, and thoroughly tested against diverse formats.

### cr-01+cr-23p1 Execute Manifest V3 Migration & Harden Build Scripts
- **Problem:** Extension uses Manifest V2, has overly broad permissions, and build scripts use hardcoded paths.
- **Impact:** Extension will break when MV3 is enforced, excessive permissions pose security risk, build scripts are not portable.
- **Chosen Fix:** Fully migrate to Manifest V3, apply least-privilege permissions, make build scripts robust.
- **Steps:**
  1.  Update `manifest.json`: `manifest_version: 3`, use `background.service_worker`, replace `browser_action` with `action`, move permissions to `host_permissions`.
  2.  Scope down `host_permissions` significantly; use specific patterns or consider optional permissions / `activeTab`.
  3.  Refactor `background.js` for service worker context (top-level listeners, no persistent state, MV3 API compatibility).
  4.  Update `scripts/build-extension.sh` to use relative paths and avoid OS-specific commands where possible.
  5.  Thoroughly test extension loading and functionality in an MV3 environment.
- **Done‑When:** Extension loads and functions correctly as MV3, permissions are minimal, background script uses service worker patterns, build script is portable.

## Standards Alignment
- **Security:** Prioritized via fixes for XSS (cr-02), MV3 migration/permissions (cr-01), and addressing potential DoS (cr-06).
- **Simplicity:** Addressed by clarifying APIs (cr-05), consistent logic (cr-04), simplifying regex (cr-13), controlled logging (cr-10), and reducing coupling (cr-08).
- **Modularity & Separation of Concerns:** Enforced by extracting validation (cr-17), separating DOM/business logic (cr-08, cr-14), centralizing constants (cr-08), and standardizing modules (cr-16).
- **Testability:** Improved by simplifying APIs (cr-05), separating concerns (cr-08, cr-14), making observer testable (cr-15), and explicitly adding edge case tests (cr-09).
- **Coding Standards:** Upheld through consistent JSDoc (cr-07), logging (cr-10), module system (cr-16), and CI fixes (cr-11).
- **Error Handling:** Made robust and user-facing via storage error fixes (cr-03).

## Validation Checklist
- [ ] All automated tests (`npm test`) pass, including new edge case tests.
- [ ] Static analysis (`npm run lint`) passes with no new errors/warnings.
- [ ] Build process (`npm run build`) completes successfully.
- [ ] Smoke test (`npm run smoke-test`) passes against the `dist` directory.
- [ ] Manual testing confirms:
    - [ ] Extension loads and functions correctly in Chrome/Edge (Manifest V3).
    - [ ] Options page saves inputs securely (no XSS), validates correctly, shows storage errors.
    - [ ] Price conversion works reliably on various test pages, including dynamic content.
    - [ ] Console logs are clean in production builds (only WARN/ERROR levels visible).
- [ ] CI pipeline passes on the `main` branch, and the README badge is accurate.
```