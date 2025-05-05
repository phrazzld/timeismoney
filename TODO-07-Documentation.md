# TODO: Phase 7 - Documentation

**Focus:** Update developer documentation to reflect the new testing framework and practices.
**Goal:** Ensure documentation is accurate and helpful for developers using Vitest.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 10 & Documentation Section

---

- [x] **T019 · Chore · P2: update developer documentation for vitest**
  - **Context:** PLAN.md - Detailed Build Steps - 10. Documentation Update & Documentation Section
  - **Action:**
    1. Update `README.md`, `CONTRIBUTING.md`, `CLAUDE.md` (or similar) with Vitest setup, commands, test structure (unit/integration/dom), and minimal mocking philosophy.
    2. Provide examples of writing tests using Vitest.
    3. Optionally create/update `TESTING_GUIDE.md`.
  - **Done‑when:**
    1. All relevant developer documentation accurately reflects the Vitest testing setup.
    2. Old Jest instructions are removed.
  - **Depends‑on:** [T018]
  - **Completed:**
    1. Updated README.md to reference the new TESTING_GUIDE.md
    2. Updated CONTRIBUTING.md with Vitest commands and removed all Jest references
    3. Updated CLAUDE.md with current test commands and additional testing guidelines
    4. Created comprehensive TESTING_GUIDE.md with detailed testing structure, examples, and best practices
    5. Documented test categories (unit/integration/dom) and coverage requirements
