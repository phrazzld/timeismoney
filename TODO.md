# TODO

## Options Page / formHandler.js
- [x] **T001 · Feature · P0: sanitize user inputs before validation and saving**
    - **Context:** cr-02+cr-20+cr-17p1, Step 1
    - **Action:**
        1. Update `formHandler.js` to sanitize all user inputs (`currencySymbol`, `amount`, `debounceInterval`) before validation/saving.
        2. Use HTML entity escaping or strict character whitelisting.
    - **Done‑when:**
        1. Inputs are sanitized and cannot inject scripts or markup.
        2. Related tests pass (see T035).
    - **Verification:**
        1. Attempt common XSS payloads in the options form; ensure output is escaped.
        2. Automated tests pass for input sanitization.
    - **Depends‑on:** none

- [x] **T002 · Feature · P1: strengthen input validation logic**
    - **Context:** cr-02+cr-20+cr-17p1, Step 2
    - **Action:**
        1. Update validation regexes and add explicit range/length/numeric checks (`isFinite`) in `formHandler.js` (or later `validator.js`).
        2. Ensure only valid values for all fields (`currencySymbol`, `amount`, `debounceInterval`).
    - **Done‑when:**
        1. Invalid inputs are rejected with appropriate UI feedback.
        2. Tests for invalid/edge-case inputs pass.
    - **Verification:**
        1. Manual: Try invalid symbols/codes/amounts in the options form; confirm rejection.
    - **Depends‑on:** T001

- [x] **T003 · Feature · P1: check validation function results before saving options**
    - **Context:** cr-02+cr-20+cr-17p1, Step 3
    - **Action:**
        1. Ensure `saveOptions` in `formHandler.js` checks return values from all `validate*` functions.
        2. Return early and prevent save if any validation fails.
    - **Done‑when:**
        1. Form does not save invalid data.
        2. Tests verify early return on failed validation.
    - **Verification:**
        1. Manual: Enter invalid data and confirm settings are not saved.
    - **Depends‑on:** T002

- [x] **T004 · Refactor · P2: extract validation functions to separate module**
    - **Context:** cr-02+cr-20+cr-17p1, Step 4
    - **Action:**
        1. Create `src/options/validator.js`.
        2. Move all validation logic from `formHandler.js` to `src/options/validator.js`.
        3. Update imports and references in `formHandler.js`.
    - **Done‑when:**
        1. Validation functions reside in `validator.js` and are imported in `formHandler.js`.
        2. Tests pass.
    - **Depends‑on:** T003

- [x] **T005 · Feature · P1: display user-facing errors for storage failures**
    - **Context:** cr-03+cr-18, Step 1
    - **Action:**
        1. Modify `.catch` blocks for `getSettings`/`saveSettings` in `formHandler.js`, `popup.js`, `background.js` (where applicable) to update the UI (`#status` or similar) with clear error messages.
    - **Done‑when:**
        1. Storage errors are visible to users in the options page or relevant UI.
        2. Related tests pass (see T036).
    - **Verification:**
        1. Manual: Simulate storage failure (e.g., via devtools), confirm error is shown in the UI.
    - **Depends‑on:** none

- [x] **T006 · Bugfix · P1: close popup immediately after successful save**
    - **Context:** cr-03+cr-18, Step 2
    - **Action:**
        1. Move `window.close()` in `formHandler.js:saveOptions` to execute immediately after successful `saveSettings()` resolution, before any `setTimeout`.
    - **Done‑when:**
        1. Popup closes promptly after save, not delayed by `setTimeout`.
        2. Tests confirm correct behavior.
    - **Verification:**
        1. Manual: Save settings, observe immediate popup close.
    - **Depends‑on:** T005

## Core / converter.js
- [x] **T007 · Refactor · P2: refactor converttotime to single signature**
    - **Context:** cr-05+cr-25, Step 1
    - **Action:**
        1. Change `convertToTime` in `converter.js` to accept only `(priceValue, hourlyRate)`.
    - **Done‑when:**
        1. No dual signatures or `typeof` checks remain.
        2. Tests updated and pass.
    - **Depends‑on:** none

- [ ] **T008 · Refactor · P2: remove internal rate calculation from converttotime**
    - **Context:** cr-05+cr-25, Step 2
    - **Action:**
        1. Delete internal rate calculation logic from `convertToTime`.
    - **Done‑when:**
        1. Rate calculation logic exists only outside `convertToTime`.
        2. Tests pass.
    - **Depends‑on:** T007

- [ ] **T009 · Refactor · P2: update all callers to compute hourly rate externally**
    - **Context:** cr-05+cr-25, Step 3
    - **Action:**
        1. Refactor all callers (e.g., `convertPriceToTimeString`) to use `calculateHourlyWage` before calling `convertToTime`.
    - **Done‑when:**
        1. All calls to `convertToTime` pass in an explicit hourly rate.
        2. Tests pass for all affected call sites.
    - **Depends‑on:** T008

- [x] **T010 · Chore · P3: delete converter.js.bak file**
    - **Context:** cr-05+cr-25, Step 4
    - **Action:**
        1. Remove `src/utils/converter.js.bak` from the repository.
    - **Done‑when:**
        1. File is deleted and not present in the repo.
    - **Depends‑on:** none

## DevOps / CI & Smoke Test
- [ ] **T011 · Chore · P2: ensure repository default branch is master**
    - **Context:** cr-11, Step 1
    - **Action:**
        1. Verify and set the repository default branch to `master` in the Git hosting platform settings.
    - **Done‑when:**
        1. Default branch is `master`.
    - **Depends‑on:** none

- [ ] **T012 · Chore · P2: update CI workflow triggers to master branch**
    - **Context:** cr-11, Step 2
    - **Action:**
        1. Change `.github/workflows/ci.yml` triggers to reference `master` branch for `push` and `pull_request`.
    - **Done‑when:**
        1. CI only runs for `master`.
    - **Depends‑on:** T011

- [ ] **T013 · Chore · P2: update README badge to master branch**
    - **Context:** cr-11, Step 3
    - **Action:**
        1. Update README CI badge URL to reference `branch=master`.
    - **Done‑when:**
        1. Badge shows status for `master` branch.
    - **Depends‑on:** T012

- [ ] **T014 · Chore · P1: update smoke test to target dist directory**
    - **Context:** cr-19, Step 1
    - **Action:**
        1. Update `scripts/smoke-test.js` to check for required files/structure in `./dist` directory.
    - **Done‑when:**
        1. Smoke test validates `dist/` after build.
    - **Verification:**
        1. Run `npm run build` then `npm run smoke-test`, confirm success/failure as appropriate.
    - **Depends‑on:** T045 # Depends on the build script being stable

- [ ] **T015 · Chore · P1: ensure CI runs build before smoke test**
    - **Context:** cr-19, Step 2
    - **Action:**
        1. Edit CI workflow (`.github/workflows/ci.yml`) so `npm run build` executes before `npm run smoke-test`.
    - **Done‑when:**
        1. Smoke test always runs on a freshly built `dist/`.
    - **Depends‑on:** T014

## Platform / Module System
- [x] **T016 · Refactor · P1: add type module to package.json**
    - **Context:** cr-16, Step 1
    - **Action:**
        1. Add `"type": "module"` to the root `package.json`.
    - **Done‑when:**
        1. Node treats JS files as ES6 modules by default.
    - **Depends‑on:** none

- [x] **T017 · Refactor · P1: update Jest and Babel configs for ES6 modules**
    - **Context:** cr-16, Step 2
    - **Action:**
        1. Update `jest.config.js` and `babel.config.js` to correctly handle ES6 modules (e.g., using necessary Babel transforms or Node flags).
    - **Done‑when:**
        1. Build and test tooling correctly processes ES6 module syntax.
        2. Tests run successfully.
    - **Depends‑on:** T016

- [x] **T018 · Refactor · P1: convert tests and helpers to import/export syntax**
    - **Context:** cr-16, Step 3
    - **Action:**
        1. Replace all `require`/`module.exports` in test files and helper scripts with ES6 `import`/`export`.
    - **Done‑when:**
        1. No CommonJS syntax remains in tests/helpers.
        2. Tests pass.
    - **Depends‑on:** T017

## Core / Logging
- [ ] **T019 · Feature · P2: implement centralized logger utility**
    - **Context:** cr-10, Step 1
    - **Action:**
        1. Create `src/utils/logger.js` wrapping `console.debug/info/warn/error`.
    - **Done‑when:**
        1. Logger module exists and exports logging methods.
    - **Depends‑on:** none

- [ ] **T020 · Feature · P2: implement log level control by build environment**
    - **Context:** cr-10, Step 2
    - **Action:**
        1. Add mechanism to `logger.js` to set minimum log level via environment variable (e.g., `process.env.NODE_ENV`).
    - **Done‑when:**
        1. Logger only logs messages at/above the configured level (e.g., DEBUG in dev, WARN in prod).
    - **Verification:**
        1. Set NODE_ENV=production, build, run, confirm only WARN/ERROR logs appear.
        2. Set NODE_ENV=development, build, run, confirm DEBUG/INFO logs also appear.
    - **Depends‑on:** T019

- [ ] **T021 · Refactor · P2: replace direct console calls with logger calls**
    - **Context:** cr-10, Step 3
    - **Action:**
        1. Replace all `console.*` usage in `src/` with corresponding `logger.*` calls.
    - **Done‑when:**
        1. No direct `console.*` in source code (except within `logger.js`).
        2. All logging routed through logger utility.
    - **Depends‑on:** T020

## Dev / Documentation
- [ ] **T022 · Chore · P2: update ESLint JSDoc policy for public APIs**
    - **Context:** cr-07+cr-12, Step 1
    - **Action:**
        1. Configure `.eslintrc.js` rule `jsdoc/require-jsdoc` to enforce JSDoc on exported functions/classes (`publicOnly: true` or similar).
    - **Done‑when:**
        1. ESLint fails when exported APIs lack JSDoc.
    - **Depends‑on:** none

- [ ] **T023 · Chore · P2: remove JSDoc rule overrides for UI components**
    - **Context:** cr-07+cr-12, Step 2
    - **Action:**
        1. Delete or update the `overrides` section disabling JSDoc rules for UI components in `.eslintrc.js`.
    - **Done‑when:**
        1. No unnecessary JSDoc overrides remain.
        2. ESLint enforces JSDoc policy consistently.
    - **Depends‑on:** T022

- [ ] **T024 · Chore · P2: add or complete JSDoc for all exported key module functions**
    - **Context:** cr-07+cr-12, Step 3
    - **Action:**
        1. Write full JSDoc blocks (`@param`, `@returns`, description) for all exported functions/classes in `storage.js`, `converter.js`, `domScanner.js`, `priceFinder.js`, etc.
    - **Done‑when:**
        1. All public APIs in key modules are documented.
        2. `npm run lint` passes without JSDoc errors.
    - **Verification:**
        1. Run lint, confirm no JSDoc errors.
    - **Depends‑on:** T023

## Frontend / domScanner.js
- [ ] **T025 · Refactor · P1: update walk function to accept settings parameter**
    - **Context:** cr-04, Step 1
    - **Action:**
        1. Change `walk` signature in `domScanner.js` to `walk(node, callback, settings, options = {})`.
    - **Done‑when:**
        1. Function signature updated.
        2. Tests updated and pass.
    - **Depends‑on:** none

- [ ] **T026 · Refactor · P1: propagate settings through recursive walk calls and to callback**
    - **Context:** cr-04, Step 2
    - **Action:**
        1. Ensure `walk` passes the received `settings` object to all recursive calls and when invoking the `callback`.
    - **Done‑when:**
        1. All internal and callback invocations receive `settings`.
    - **Depends‑on:** T025

- [ ] **T027 · Refactor · P1: update all walk callers to provide settings object**
    - **Context:** cr-04, Step 3
    - **Action:**
        1. Refactor `processPage` in `index.js` and `processPendingNodes` in `domScanner.js` to fetch and pass `settings` to `walk`.
    - **Done‑when:**
        1. All callers supply correct `settings`.
        2. Logic behaves predictably based on settings.
        3. Tests pass.
    - **Depends‑on:** T026

## Core / Constants & Decoupling
- [ ] **T028 · Refactor · P2: centralize all shared constants in constants.js**
    - **Context:** cr-08+cr-14, Step 1
    - **Action:**
        1. Create `src/utils/constants.js`.
        2. Move all shared constants (CSS class names, keys, formats) to `constants.js`.
        3. Update all modules to import constants from `constants.js`.
    - **Done‑when:**
        1. No duplicated or scattered constants in codebase.
        2. Imports updated, build succeeds.
    - **Depends‑on:** none

- [ ] **T029 · Refactor · P1: refactor functions to accept state via parameters**
    - **Context:** cr-08+cr-14, Step 2
    - **Action:**
        1. Update functions (e.g., within `domScanner`) relying on shared state (e.g., `amazonPriceState`) to receive state explicitly as parameters.
        2. Update callers to pass the required state.
    - **Done‑when:**
        1. No implicit module state sharing remains.
        2. Tests updated and pass.
    - **Depends‑on:** T028

- [ ] **T030 · Refactor · P1: separate concerns of scanning, finding, converting, modifying**
    - **Context:** cr-08+cr-14, Step 3
    - **Action:**
        1. Create/refine modules: `domScanner` finds nodes; `priceFinder` identifies prices; `converter` converts; `domModifier` updates DOM.
        2. Update `index.js` (content script entry point) to orchestrate these steps.
    - **Done‑when:**
        1. Each module has clear, isolated responsibility.
        2. Tests refactored and pass.
    - **Depends‑on:** T029

## Frontend / MutationObserver & Testability
- [ ] **T031 · Feature · P2: add performance timing to processPendingNodes**
    - **Context:** cr-06+cr-15p1, Step 1
    - **Action:**
        1. Add `performance.mark`/`measure` or `logger.debug` timings around the core logic in `processPendingNodes`.
    - **Done‑when:**
        1. Performance metrics are logged for observer callback execution.
    - **Verification:**
        1. Inspect logs/timings during dynamic page updates in dev tools.
    - **Depends‑on:** T021 # Assumes logger exists

- [ ] **T032 · Feature · P2: add option to disable or throttle DOM observation**
    - **Context:** cr-06+cr-15p1, Step 2
    - **Action:**
        1. Add a user setting (e.g., `enableDynamicScanning`) in options & storage.
        2. Modify observer setup to check this setting before observing. (Throttle is optional stretch).
    - **Done‑when:**
        1. Option is exposed in UI and disables observer when set.
    - **Verification:**
        1. Manual: Disable option, load dynamic page, confirm no updates after initial load. Enable, confirm updates work.
    - **Depends‑on:** none

- [ ] **T033 · Refactor · P2: allow injecting mock MutationObserver for tests**
    - **Context:** cr-06+cr-15p1, Step 3
    - **Action:**
        1. Refactor `observeDomChanges` (or equivalent setup logic) to optionally accept a `MutationObserver` constructor/instance as a parameter for testing.
    - **Done‑when:**
        1. Tests can inject and control observer behavior.
    - **Depends‑on:** none

- [ ] **T034 · Refactor · P2: ensure observer callback logic is unit-testable**
    - **Context:** cr-06+cr-15p1, Step 4
    - **Action:**
        1. Structure observer callback logic (`processPendingNodes`) so it can be invoked directly with mock `MutationRecord` arrays for testing.
    - **Done‑when:**
        1. Callback logic is testable independently of the actual observer.
    - **Depends‑on:** T033

## QA / Edge Case & Security Tests
- [ ] **T035 · Test · P0: add XSS injection tests for formHandler**
    - **Context:** cr-09+cr-15p2, Step 1
    - **Action:**
        1. Create unit tests in `formHandler.spec.js` that attempt to inject XSS payloads via form inputs and verify sanitization works.
    - **Done‑when:**
        1. Sanitization protects against XSS.
        2. Tests fail if XSS is possible, pass when fixed.
    - **Depends‑on:** T001

- [ ] **T036 · Test · P1: add storage error simulation tests for storage.js**
    - **Context:** cr-09+cr-15p2, Step 2
    - **Action:**
        1. Write unit tests in `storage.spec.js` or relevant UI tests that simulate `chrome.runtime.lastError` and verify error handling/UI display.
    - **Done‑when:**
        1. Storage errors are correctly surfaced and handled in tests.
    - **Depends‑on:** T005

- [ ] **T037 · Test · P1: add observer stress and cleanup tests for domScanner.js**
    - **Context:** cr-09+cr-15p2, Step 3
    - **Action:**
        1. Write unit tests using mocked observer/timers to simulate rapid DOM mutations and verify `stopObserver` cleans up correctly.
    - **Done‑when:**
        1. Observer handles simulated stress and is cleaned up correctly in tests.
    - **Depends‑on:** T034

- [ ] **T038 · Test · P2: add edge case tests for converter logic**
    - **Context:** cr-09+cr-15p2, Step 4
    - **Action:**
        1. Write unit tests in `converter.spec.js` covering zero, large, negative, and non-numeric values for price/rate inputs.
    - **Done‑when:**
        1. Edge cases for conversion logic are covered and handled correctly.
    - **Depends‑on:** T009

## Core / priceFinder.js
- [ ] **T039 · Refactor · P2: simplify and clarify regex construction**
    - **Context:** cr-13, Step 1
    - **Action:**
        1. Refactor regex construction in `priceFinder.js`. Break down complex ORs. Consider separate patterns for common cases.
    - **Done‑when:**
        1. Regex logic is modular and easy to read/maintain.
    - **Depends‑on:** T030 # Assumes separation of concerns is done

- [ ] **T040 · Test · P1: add comprehensive unit tests for currency regexes**
    - **Context:** cr-13, Step 2
    - **Action:**
        1. Write unit tests in `priceFinder.spec.js` covering various currency formats (USD, EUR, JPY, etc.), edge cases (prices in text, multiple prices), and non-matches.
    - **Done‑when:**
        1. All significant currency formats and edge cases are tested.
    - **Verification:**
        1. Tests fail if false positives/negatives occur.
    - **Depends‑on:** T039

- [ ] **T041 · Chore · P3: document regex logic with clear comments**
    - **Context:** cr-13, Step 3
    - **Action:**
        1. Add comments in `priceFinder.js` explaining the logic of each significant part of the regex patterns.
    - **Done‑when:**
        1. All regex logic is documented inline.
    - **Depends‑on:** T039

## Platform / Manifest V3 & Build
- [ ] **T042 · Feature · P0: migrate manifest.json to Manifest V3**
    - **Context:** cr-01+cr-23p1, Step 1
    - **Action:**
        1. Update `manifest.json` to `manifest_version: 3`.
        2. Use `background.service_worker` and `action` keys.
        3. Move permissions to `host_permissions` where applicable.
    - **Done‑when:**
        1. Manifest is valid MV3 and extension loads in Chrome/Edge without manifest errors.
    - **Verification:**
        1. Manual: Load unpacked extension in Chrome/Edge, confirm no load errors.
    - **Depends‑on:** none

- [ ] **T043 · Feature · P0: minimize and restrict host permissions**
    - **Context:** cr-01+cr-23p1, Step 2
    - **Action:**
        1. Restrict `host_permissions` in `manifest.json` to the minimum required URL patterns.
        2. Replace broad patterns (e.g., `<all_urls>`) with specific ones (e.g., `*://*.amazon.com/*`).
        3. Consider using `activeTab` or optional permissions if feasible.
    - **Done‑when:**
        1. Extension requests only necessary host permissions.
    - **Verification:**
        1. Inspect permissions requested upon install/update.
    - **Depends‑on:** T042

- [ ] **T044 · Refactor · P1: adapt background.js for service worker context**
    - **Context:** cr-01+cr-23p1, Step 3
    - **Action:**
        1. Refactor `background.js` for service worker environment (use top-level listeners, avoid persistent state, ensure MV3 API compatibility).
    - **Done‑when:**
        1. No MV2-only APIs or patterns remain.
        2. Background logic works correctly in MV3 service worker.
    - **Verification:**
        1. Tests and manual checks confirm correct background behavior.
    - **Depends‑on:** T042

- [x] **T045 · Chore · P2: update build script to use relative, cross-platform paths**
    - **Context:** cr-01+cr-23p1, Step 4
    - **Action:**
        1. Refactor `scripts/build-extension.sh` (or equivalent) to use relative paths (e.g., `./src`, `./dist`) and avoid OS-specific commands where possible.
    - **Done‑when:**
        1. Build script works reliably on different OSes (Linux, macOS, Windows/WSL).
    - **Verification:**
        1. Run build on different OSes; confirm success.
    - **Depends‑on:** none

- [ ] **T046 · Test · P0: test extension loading and all functionality in MV3**
    - **Context:** cr-01+cr-23p1, Step 5
    - **Action:**
        1. Load the built extension in a browser with MV3 support (Chrome/Edge).
        2. Thoroughly test all major features: price conversion on various sites, options saving/loading, dynamic content updates.
    - **Done‑when:**
        1. Extension functions as expected with MV3 manifest and service worker.
    - **Verification:**
        1. Manual: Exercise all extension features end-to-end in Chrome/Edge.
    - **Depends‑on:** [T042, T043, T0
