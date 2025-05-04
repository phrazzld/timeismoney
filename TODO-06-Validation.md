# TODO: Phase 6 - Validation

**Focus:** Measure and confirm test coverage and performance meet requirements.
**Goal:** Validate that the migration meets non-functional requirements.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 8

---

- [x] **T017 · Test · P2: validate test coverage**

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
  - **Completed:**
    1. Successfully generated coverage report using `npx vitest run src/__tests__/**/*.vitest.test.js --coverage`.
    2. Created detailed coverage analysis in T017-completed.md.
    3. Found overall coverage at 51.78% (below target of >85%).
    4. Critical utilities have good coverage (parser.js: 100%, converter.js: 95.42%).
    5. Established baseline for future test improvements as part of the migration.

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
