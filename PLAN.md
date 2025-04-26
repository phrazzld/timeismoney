# Remediation Plan – Sprint 1

## Executive Summary
We will eliminate duplicate legacy files to restore a single source of truth, merge overlapping conversion logic into one module for maintainability, unify linting/formatting configs for consistency, optimize DOM traversal to improve performance, and add integration tests to guard against regressions. Fixes are ordered to remove blockers first and unlock subsequent tasks.

## Strike List
| Seq | CR-ID | Title                                         | Effort | Owner |
|-----|-------|-----------------------------------------------|--------|-------|
| 1   | cr-01 | Remove legacy root-level files                | s      | —     |
| 2   | cr-02 | Merge overlapping converter modules           | m      | —     |
| 3   | cr-03 | Consolidate ESLint & Prettier configurations  | s      | —     |
| 4   | cr-04 | Optimize DOM scanning with MutationObserver   | m      | —     |
| 5   | cr-05 | Add DOM conversion integration tests          | m      | —     |

## Detailed Remedies

### cr-01 Remove legacy root-level files
- **Problem:** Duplicate manifests and UI assets exist in both `/` and `src/`.
- **Impact:** Confusion over which files are packaged, risk of outdated code shipping, increased maintenance.
- **Chosen Fix:** Delete or archive all root-level `manifest.json`, HTML, CSS, JS; point build/CI to `src/` exclusively.
- **Steps:**
  1. Remove root `manifest.json`, `popup.*`, `options.*` files.
  2. Update build scripts and GitHub Actions to use `src/manifest.json`.
  3. Smoke-test extension locally and in CI.
- **Done-When:** Only `src/` assets remain; build passes; extension UI works unchanged.  
- **Effort:** s

### cr-02 Merge overlapping converter modules
- **Problem:** Two converter implementations (`src/utils/converter.js`, `src/content/priceConverter.js`) with slightly different logic.
- **Impact:** Divergent behavior, duplicated tests, harder refactoring and bug fixes.
- **Chosen Fix:** Consolidate into a single converter utility in `src/utils/converter.js`, deprecate and remove the extra module.
- **Steps:**
  1. Merge `normalizePrice`, `calculateHourlyWage`, conversion and formatting logic into `src/utils/converter.js`, resolving API differences.
  2. Refactor content scripts to import unified functions.
  3. Delete `src/content/priceConverter.js`.
  4. Expand Jest unit tests to cover all edge cases from both original modules.
- **Done-When:** No duplicate converter files; all unit tests pass; runtime behavior is identical.  
- **Effort:** m

### cr-03 Consolidate ESLint & Prettier configurations
- **Problem:** Both `.eslintrc.js` and `.eslintrc.json` coexist, causing rule conflicts; Prettier settings may be inconsistent.
- **Impact:** Style drift, confusing lint failures, wasted developer cycles.
- **Chosen Fix:** Standardize on a single `.eslintrc.js` and ensure a single `.prettierrc`.
- **Steps:**
  1. Merge any custom rules from `.eslintrc.json` into `.eslintrc.js`.
  2. Delete `.eslintrc.json`.
  3. Verify `.prettierrc` covers all desired formatting options.
  4. Run `eslint --fix` and `prettier --write .`.
- **Done-When:** One ESLint config file; one Prettier config; zero new lint/format errors.  
- **Effort:** s

### cr-04 Optimize DOM scanning with MutationObserver
- **Problem:** Full DOM text-node walk on load stalls on large pages.
- **Impact:** Page jank, high CPU usage, negative UX.
- **Chosen Fix:** Use a `MutationObserver` plus debounced scanner to process only new or changed nodes.
- **Steps:**
  1. Initialize a `MutationObserver` on `document.body` to catch added/changed nodes.
  2. Replace immediate full scan with a debounced call (e.g., 200 ms) to `domScanner.walk`.
  3. Ensure observer disconnects on script unload.
  4. Benchmark scan time before/after; verify no missed conversions.
- **Done-When:** Profiling shows > 50 % scan-time reduction; all intended nodes still processed.  
- **Effort:** m

### cr-05 Add DOM conversion integration tests
- **Problem:** No end-to-end tests for `applyConversion`/`revertAll`; risk silent regressions.
- **Impact:** Unverified DOM manipulations, potential undetected bugs in content scripts.
- **Chosen Fix:** Write Jest tests using JSDOM to simulate a sample page and verify conversions and reverts.
- **Steps:**
  1. Configure Jest to use JSDOM.
  2. Create test fixtures with sample text nodes and price elements.
  3. Assert that `applyConversion` adds expected time strings and `revertAll` restores originals.
  4. Integrate tests into CI pipeline.
- **Done-When:** New tests cover ≥ 80 % of DOM-related code; CI passes.  
- **Effort:** m

## Standards Alignment
- **Simplicity:** Removed duplicate files and configs, reduced code paths.  
- **Modularity:** Consolidated conversion logic into one module, improved separation of concerns.  
- **Testability:** Added integration tests, unified unit tests, ensured CI gating.  
- **Coding Standard:** Single ESLint/Prettier setup enforces consistent style.  
- **Security:** Optimized DOM scanning minimizes exposure to unexpected mutation patterns.

## Validation Checklist
- [ ] All unit and integration tests green  
- [ ] Lint and Prettier checks clean  
- [ ] CI build succeeds and artifacts load in browser  
- [ ] Performance profile shows scan improvements  
- [ ] Manual smoke test of extension features passed