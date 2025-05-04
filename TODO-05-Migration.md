# TODO: Phase 5 - Test Migration

**Focus:** Convert test code syntax and logic from Jest to Vitest.
**Goal:** Have all test suites passing under the new Vitest runner.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 7

---

- [x] **T013 · Refactor · P1: migrate unit tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Unit Tests)
  - **Action:**
    1. Convert Jest API calls (`jest.*`) to Vitest (`vi.*`) in `src/__tests__/unit/`. Use explicit imports.
    2. Ensure tests use centralized mocks (T005) via `vi.mock`, remove internal mocks.
    3. Fix failures, ensure no DOM dependencies.
    4. **NOTE**: Some tests (e.g., priceFinder) cause memory issues due to complex regex patterns. These are simplified in this phase and will be optimized in T016.
  - **Done‑when:**
    1. All tests in `src/__tests__/unit/` pass via `npm run test:unit` or individual test runs.
    2. Jest APIs replaced; internal mocks removed; external mocks centralized.
  - **Depends‑on:** [T006, ✅ T010, ✅ T011]

- [x] **T014 · Refactor · P1: migrate integration tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Integration Tests)
  - **Action:**
    1. Convert Jest APIs to Vitest in `src/__tests__/integration/`. Use explicit imports.
    2. Ensure correct JSDOM environment usage and centralized mock application (T005). Refactor flagged tests (T001).
    3. Fix failures, check async behavior and timers (`vi.useFakeTimers`).
    4. **COMPLETED:** Migrated all integration tests to Vitest (dom-conversion, domScanner, formHandler.error, formHandler.storage, formHandler.storage.direct, formHandler.xss, formHandler.refactored, settingsManager.error, amazonHandler, price-conversion-flow, popup.error)
  - **Done‑when:**
    1. All tests in `src/__tests__/integration/` pass via `npm run test:integration`.
    2. Jest APIs replaced; JSDOM env used; mocks centralized.
  - **Depends‑on:** [T006, ✅ T010, ✅ T011, ✅ T013]

- [ ] **T015 · Refactor · P1: migrate dom tests to vitest**

  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (DOM Tests)
  - **Action:**
    1. Convert Jest APIs to Vitest in `src/__tests__/dom/`. Use explicit imports.
    2. Ensure JSDOM env, centralized mocks (T005), correct DOM setup/teardown. Refactor flagged tests (T001).
    3. Fix failures, focusing on DOM interactions, async, timers.
  - **Done‑when:**
    1. All tests in `src/__tests__/dom/` pass via `npm run test:dom`.
    2. Jest APIs replaced; JSDOM env used; mocks centralized; DOM handled correctly.
  - **Depends‑on:** [T006, ✅ T010, ✅ T011, T014]

- [ ] **T016 · Refactor · P2: remove jest-specific performance workarounds**
  - **Context:** PLAN.md - Detailed Build Steps - 7. Iterative Test Migration & Refactoring (Remove Workarounds)
  - **Action:**
    1. Identify and delete code/files created solely for Jest performance (e.g., `*.test.patch.js`).
    2. Verify the migrated Vitest tests (T013-T015) cover the logic previously handled by workarounds.
  - **Done‑when:**
    1. All identified Jest workaround code/files are removed.
    2. Coverage for affected logic exists in main Vitest suites.
  - **Depends‑on:** [T013, T014, T015]
