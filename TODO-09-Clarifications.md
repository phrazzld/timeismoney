# TODO: Phase 9 - Clarifications

**Focus:** Track and resolve open questions that may block specific tasks or influence decisions.
**Goal:** Ensure all assumptions are validated and blockers are removed.
**Related Plan Section:** PLAN.md - Open Questions

---

- [ ] **Q001: Confirm absence of complex Jest plugins/matchers needing specific handling**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there current Jest plugins, custom reporters, or complex matchers lacking direct Vitest equivalents that require specific migration plans? (Assumption: No)
  - **Blocking?:** no
  - **Resolution:** `[Record resolution here]`

- [ ] **Q002: Confirm Babel's role (Jest only vs. Build process)**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Is `babel.config.cjs` used _only_ for Jest transpilation, or is it required for the main application build process? (Assumption: Only for Jest)
  - **Blocking?:** yes (Blocks T021)
  - **Resolution:** `[Record resolution here]`

- [ ] **Q003: Define specific performance benchmarks/goals**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there explicit targets for test suite execution time post-migration?
  - **Blocking?:** no (Affects validation criteria for T018)
  - **Resolution:** `[Record resolution here]`

- [ ] **Q004: Define definitive code coverage target percentage**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** What is the precise minimum code coverage percentage required? (Assumption: Maintain/improve, aiming >85% combined)
  - **Blocking?:** no (Affects validation criteria for T017)
  - **Resolution:** `[Record resolution here]`

- [ ] **Q005: Decide handling for resource-intensive tests**
  - **Context:** PLAN.md - Open Questions
  - **Issue:** If specific tests remain resource-intensive, should they be excluded from the default `npm test` run?
  - **Blocking?:** no (Affects T018 and potentially T011)
  - **Resolution:** `[Record resolution here]`
