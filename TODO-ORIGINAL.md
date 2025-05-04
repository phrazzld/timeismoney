# Todo

## Test Suite Audit & Structure

- [ ] **T001 · Chore · P1: audit, categorize, and rename existing test files**

  - **Context:** PLAN.md - Detailed Build Steps - 1. Audit & Categorize Existing Tests
  - **Action:**
    1. Review every file in `src/__tests__`, identify its primary nature (unit, integration, dom).
    2. Rename files using `.unit.test.js`, `.integration.test.js`, `.dom.test.js` suffixes.
    3. Document findings: list tests, assigned categories, and flag any needing refactoring due to mixed concerns.
  - **Done‑when:**
    1. All test files in `src/__tests__` are renamed with appropriate suffixes.
    2. A temporary document/comment lists all tests, their categories, and refactoring notes.
  - **Depends‑on:** none

- [ ] **T002 · Chore · P2: create new test directory structure**

  - **Context:** PLAN.md - Detailed Build Steps - 2. Establish New Test Structure
  - **Action:**
    1. Create directories: `src/__tests__/unit/`, `src/__tests__/integration/`, `src/__tests__/dom/`, `src/__tests__/setup/`, `src/__tests__/mocks/`.
  - **Done‑when:**
    1. All specified directories exist under `src/__tests__/`.
  - **Depends‑on:** none

- [ ] **T003 · Chore · P2: move categorized test files into new directories**
  - **Context:** PLAN.md - Detailed Build Steps - 2. Establish New Test Structure
  - **Action:**
    1. Move the categorized/renamed test files (from T001) into their corresponding `unit/`, `integration/`, or `dom/` directories.
  - **Done‑when:**
    1. All test files reside in the correct subdirectory (`unit`, `integration`, `dom`).
    2. The root `src/__tests__/` directory contains no test files directly.
  - **Depends‑on:** [T001, T002]

## Mocking Strategy

- [ ] **T004 · Refactor · P2: review mocks and identify external dependencies**

  - **Context:** PLAN.md - Detailed Build Steps - 3. Minimize & Centralize Mocks
  - **Action:**
    1. Scan tests for `jest.mock`, `jest.fn`, `jest.spyOn` usage.
    2. Document which internal modules are currently mocked (to be removed).
    3. Document the specific external dependencies (e.g., `chrome.*` APIs) that require mocking.
  - **Done‑when:**
    1. A list of internal mocks to remove is created.
    2. A list of external dependencies needing mocks is finalized.
  - **Depends‑on:** [T001]

- [ ] **T005 · Feature · P1: create centralized mocks for external dependencies**

  - **Context:** PLAN.md - Detailed Build Steps - 3. Minimize & Centralize Mocks
  - **Action:**
    1. Create minimal, reusable mock implementations for external dependencies (from T004) in `src/__tests__/mocks/` (e.g., `chrome-api.mock.js`).
    2. Use `vi.fn()` for mock functions, ensuring basic API contract adherence (signatures). Add JSDoc for clarity.
  - **Done‑when:**
    1. Mock files exist in `src/__tests__/mocks/` for required external dependencies.
    2. Mocks use `vi.fn()` and have basic JSDoc.
  - **Depends‑on:** [T002, T004]

- [ ] **T006 · Refactor · P1: refactor tests to use centralized mocks and remove internal mocks**
  - **Context:** PLAN.md - Detailed Build Steps - 3. Minimize & Centralize Mocks
  - **Action:**
    1. Remove mocks targeting internal application modules identified in T004.
    2. Update tests to import and use the centralized external mocks (from T005) via `vi.mock`.
    3. Remove inline external mocks.
  - **Done‑when:**
    1. No tests mock internal application modules.
    2. All tests requiring external mocks use the centralized implementations from `src/__tests__/mocks/`.
  - **Depends‑on:** [T003, T005]

## Vitest Setup & Configuration

- [x] **T007 · Chore · P1: install vitest dependencies**

  - **Context:** PLAN.md - Detailed Build Steps - 4. Spike: Vitest Basic Setup & Compatibility
  - **Action:**
    1. Add `vitest` and `@vitest/coverage-v8` as dev dependencies using the package manager.
    2. Optionally install `@vitest/ui`.
  - **Done‑when:**
    1. Packages are listed in `package.json` and installed in `node_modules`.
  - **Depends‑on:** none

- [x] **T008 · Feature · P1: create minimal vitest config and setup files**

  - **Context:** PLAN.md - Detailed Build Steps - 4. Spike: Vitest Basic Setup & Compatibility
  - **Action:**
    1. Create a minimal `vitest.config.js`, including necessary aliases (e.g., `@/`).
    2. Create a minimal `src/__tests__/setup/vitest.setup.js`, adapting essential global setup (e.g., `chrome` mock import/application via `vi.mock`).
  - **Done‑when:**
    1. `vitest.config.js` exists and defines basic settings.
    2. `src/__tests__/setup/vitest.setup.js` exists with essential global setup.
  - **Depends‑on:** [T002, T005, T007]

- [x] **T009 · Test · P1: validate basic vitest setup with one unit test**

  - **Context:** PLAN.md - Detailed Build Steps - 4. Spike: Vitest Basic Setup & Compatibility
  - **Action:**
    1. Choose one simple `.unit.test.js` file.
    2. Adapt its syntax minimally to use `vi.*` if needed for basic execution.
    3. Run the single test file using the `vitest run <path>` command. Troubleshoot config/syntax errors.
  - **Done‑when:**
    1. The chosen unit test runs and passes successfully using Vitest.
  - **Verification:**
    1. Execute `npx vitest run <path/to/chosen/unit/test.js>`.
    2. Observe successful test pass message in the console output.
  - **Depends‑on:** [T008]

- [x] **T010 · Feature · P1: configure vitest environments, setup, coverage, and transformer**
  - **Context:** PLAN.md - Detailed Build Steps - 5. Configure Vitest (`vitest.config.js`)
  - **Action:**
    1. Update `vitest.config.js` to define environments (`node`, `jsdom`) based on directory paths (`unit/` vs `integration/`, `dom/`).
    2. Configure `setupFiles` for global (`vitest.setup.js`) and potentially environment-specific setup files.
    3. Configure coverage (`provider: 'v8'`, reporters) and ensure transformer settings are correct.
  - **Done‑when:**
    1. `vitest.config.js` includes environment configurations by path.
    2. `setupFiles` are correctly configured.
    3. Coverage and transformer options are defined.
  - **Depends‑on:** [T008]

## Scripts & CI

- [x] **T011 · Chore · P2: update package.json scripts for vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 6. Update `package.json` Scripts
  - **Action:**
    1. Replace `jest` commands with `vitest` equivalents for `test`, `test:watch`, `test:coverage`.
    2. Define new scripts for specific suites: `test:unit`, `test:dom`, `test:integration`.
    3. Update the primary `ci` script command to use `vitest`.
  - **Done‑when:**
    1. All relevant scripts in `package.json` invoke `vitest`.
    2. Suite-specific scripts (`test:unit`, etc.) are present.
  - **Verification:**
    1. Run `npm run test:unit -- --help` locally to confirm Vitest is invoked.
  - **Depends‑on:** [T010]

- [x] **T012 · Chore · P2: update ci workflow for vitest**
  - **Context:** PLAN.md - Detailed Build Steps - 9. CI Integration
  - **Action:**
    1. Modify the CI workflow file (`.github/workflows/ci.yml` or equivalent) to use the updated `vitest` script (from T011).
    2. Ensure coverage artifact upload steps are compatible with Vitest output (if applicable).
    3. Remove any Jest-specific CI configurations (e.g., `maxWorkers`).
  - **Done‑when:**
    1. CI workflow executes tests using `vitest`.
    2. Jest-specific CI settings are removed.
    3. CI pipeline passes test execution step.
  - **Verification:**
    1. Trigger CI pipeline.
    2. Observe successful completion of the test job.
    3. Verify coverage artifacts (if configured).
  - **Depends‑on:** [T011]

## Test Migration

- [ ] **T013 · Refactor · P1: migrate unit tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Unit Tests)
  - **Action:**
    1. Convert Jest API calls (`jest.*`) to Vitest (`vi.*`) in `src/__tests__/unit/`. Use explicit imports.
    2. Ensure tests use centralized mocks (T005) via `vi.mock`, remove internal mocks.
    3. Fix failures, ensure no DOM dependencies.
  - **Done‑when:**
    1. All tests in `src/__tests__/unit/` pass via `npm run test:unit`.
    2. Jest APIs replaced; internal mocks removed; external mocks centralized.
  - **Depends‑on:** [T006, T010, T011]

- [ ] **T014 · Refactor · P1: migrate integration tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Integration Tests)
  - **Action:**
    1. Convert Jest APIs to Vitest in `src/__tests__/integration/`. Use explicit imports.
    2. Ensure correct JSDOM environment usage and centralized mock application (T005). Refactor flagged tests (T001).
    3. Fix failures, check async behavior and timers (`vi.useFakeTimers`).
  - **Done‑when:**
    1. All tests in `src/__tests__/integration/` pass via `npm run test:integration`.
    2. Jest APIs replaced; JSDOM env used; mocks centralized.
  - **Depends‑on:** [T006, T010, T011, T013]

- [ ] **T015 · Refactor · P1: migrate dom tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (DOM Tests)
  - **Action:**
    1. Convert Jest APIs to Vitest in `src/__tests__/dom/`. Use explicit imports.
    2. Ensure JSDOM env, centralized mocks (T005), correct DOM setup/teardown. Refactor flagged tests (T001).
    3. Fix failures, focusing on DOM interactions, async, timers.
  - **Done‑when:**
    1. All tests in `src/__tests__/dom/` pass via `npm run test:dom`.
    2. Jest APIs replaced; JSDOM env used; mocks centralized; DOM handled correctly.
  - **Depends‑on:** [T006, T010, T011, T014]

- [ ] **T016 · Refactor · P2: remove jest-specific performance workarounds**
  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Remove Workarounds)
  - **Action:**
    1. Identify and delete code/files created solely for Jest performance (e.g., `*.test.patch.js`).
    2. Verify the migrated Vitest tests (T013-T015) cover the logic previously handled by workarounds.
  - **Done‑when:**
    1. All identified Jest workaround code/files are removed.
    2. Coverage for affected logic exists in main Vitest suites.
  - **Depends‑on:** [T013, T014, T015]

## Validation

- [ ] **T017 · Test · P2: validate test coverage**

  - **Context:** PLAN.md - Detailed Build Steps - 8. Validate Coverage & Performance
  - **Action:**
    1. Run `npm run test:coverage`.
    2. Verify coverage report generation and check against targets (>85% combined, >95% unit, critical modules 100% or previous level).
    3. Investigate and address any significant coverage regressions.
  - **Done‑when:**
    1. Coverage report generated successfully.
    2. Coverage meets or exceeds defined targets/baseline.
  - **Verification:**
    1. Review generated `coverage/index.html` report.
  - **Depends‑on:** [T016]

- [ ] **T018 · Test · P2: validate test suite performance**
  - **Context:** PLAN.md - Detailed Build Steps - 8. Validate Coverage & Performance
  - **Action:**
    1. Run the full test suite (`npm test`) locally and in CI.
    2. Monitor execution time and memory usage (if feasible).
    3. Compare performance against Jest baseline (if available) or performance goals (Q003).
  - **Done‑when:**
    1. Full test suite runs successfully.
    2. Performance is measured and meets acceptable criteria / shows improvement.
  - **Verification:**
    1. Observe test suite execution time printed by Vitest locally.
    2. Check CI logs for execution time.
  - **Depends‑on:** [T017]

## Documentation

- [ ] **T019 · Chore · P2: update developer documentation for vitest**
  - **Context:** PLAN.md - Detailed Build Steps - 10. Documentation Update & Documentation Section
  - **Action:**
    1. Update `README.md`, `CONTRIBUTING.md`, `CLAUDE.md` (or similar) with Vitest setup, commands, test structure (unit/integration/dom), and minimal mocking philosophy.
    2. Provide examples of writing tests using Vitest.
    3. Optionally create/update `TESTING_GUIDE.md`.
  - **Done‑when:**
    1. All relevant developer documentation accurately reflects the Vitest testing setup.
    2. Old Jest instructions are removed.
  - **Depends‑on:** [T018]

## Cleanup

- [ ] **T020 · Chore · P2: remove jest dependencies and configuration files**

  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup
  - **Action:**
    1. Remove Jest packages (`jest`, `jest-environment-jsdom`, `@types/jest`, `babel-jest`) from `package.json`.
    2. Delete Jest configuration files (`jest.config.cjs`, `jest.setup.cjs`).
  - **Done‑when:**
    1. Jest dependencies are removed from `package.json`.
    2. Jest configuration files are deleted from the repository.
  - **Depends‑on:** [T018]

- [ ] **T021 · Chore · P3: remove babel configuration if confirmed unnecessary**

  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup & Open Question Q002
  - **Action:**
    1. Based on the answer to Q002, delete `babel.config.cjs` if it was confirmed to be used _only_ for Jest.
  - **Done‑when:**
    1. `babel.config.cjs` is deleted (if applicable).
  - **Depends‑on:** [T020, Q002]

- [ ] **T022 · Chore · P3: prune orphaned packages**
  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup
  - **Action:**
    1. Run `npm prune` (or equivalent package manager command) to remove packages no longer listed in `package.json`.
  - **Done‑when:**
    1. `node_modules` directory is cleaned of unneeded packages.
  - **Depends‑on:** [T020, T021]

### Clarifications & Assumptions

- [ ] **Q001: Confirm absence of complex Jest plugins/matchers needing specific handling**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there current Jest plugins, custom reporters, or complex matchers lacking direct Vitest equivalents that require specific migration plans? (Assumption: No)
  - **Blocking?:** no

- [ ] **Q002: Confirm Babel's role (Jest only vs. Build process)**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Is `babel.config.cjs` used _only_ for Jest transpilation, or is it required for the main application build process? (Assumption: Only for Jest)
  - **Blocking?:** yes (Blocks T021)

- [ ] **Q003: Define specific performance benchmarks/goals**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there explicit targets for test suite execution time post-migration?
  - **Blocking?:** no

- [ ] **Q004: Define definitive code coverage target percentage**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** What is the precise minimum code coverage percentage required? (Assumption: Maintain/improve, aiming >85% combined)
  - **Blocking?:** no

- [ ] **Q005: Decide handling for resource-intensive tests**
  - **Context:** PLAN.md - Open Questions
  - **Issue:** If specific tests remain resource-intensive, should they be excluded from the default `npm test` run?
  - **Blocking?:** no
