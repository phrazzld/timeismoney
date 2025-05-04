# TODO: Phase 8 - Cleanup

**Focus:** Remove Jest dependencies, configurations, and any other related artifacts.
**Goal:** Leave the codebase clean with only Vitest-related tooling remaining.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 11

---

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
