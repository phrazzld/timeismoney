# TODO: Phase 6 - Validation

**Focus:** Measure and confirm test coverage and performance meet requirements.
**Goal:** Validate that the migration meets non-functional requirements.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 8

---

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
