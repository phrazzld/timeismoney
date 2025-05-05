# TODO: Phase 8 - Cleanup

**Focus:** Remove Jest dependencies, configurations, and any other related artifacts.
**Goal:** Leave the codebase clean with only Vitest-related tooling remaining.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 11

---

- [x] **T020 · Chore · P2: remove jest dependencies and configuration files**

  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup
  - **Action:**
    1. Remove Jest packages (`jest`, `jest-environment-jsdom`, `@types/jest`, `babel-jest`) from `package.json`.
    2. Delete Jest configuration files (`jest.config.cjs`, `jest.setup.cjs`).
  - **Done‑when:**
    1. Jest dependencies are removed from `package.json`.
    2. Jest configuration files are deleted from the repository.
  - **Depends‑on:** [T018]
  - **Completed:**
    1. Removed Jest packages from package.json:
       - jest
       - jest-environment-jsdom
       - @types/jest
       - babel-jest
       - eslint-plugin-jest
    2. Deleted Jest configuration files:
       - jest.config.cjs
       - jest.setup.cjs
    3. Updated ESLint configuration to remove Jest-specific rules but maintain compatibility with old tests during migration

- [x] **T021 · Chore · P3: remove babel configuration if confirmed unnecessary**

  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup & Open Question Q002
  - **Action:**
    1. Based on the answer to Q002, delete `babel.config.cjs` if it was confirmed to be used _only_ for Jest.
  - **Done‑when:**
    1. `babel.config.cjs` is deleted (if applicable).
  - **Depends‑on:** [T020, Q002]
  - **Completed:**
    1. Resolved Q002, confirming that Babel was used exclusively for Jest transpilation
    2. Deleted `babel.config.cjs` file
    3. Removed Babel dependencies from package.json:
       - `@babel/core`
       - `@babel/plugin-syntax-dynamic-import`
       - `@babel/plugin-syntax-import-meta`
       - `@babel/preset-env`
    4. Verified that lint still passes (tests failures expected as they're still being migrated from Jest to Vitest)

- [x] **T022 · Chore · P3: prune orphaned packages**
  - **Context:** PLAN.md - Detailed Build Steps - 11. Cleanup
  - **Action:**
    1. Run `npm prune` (or equivalent package manager command) to remove packages no longer listed in `package.json`.
  - **Done‑when:**
    1. `node_modules` directory is cleaned of unneeded packages.
  - **Depends‑on:** [T020, T021]
  - **Completed:**
    1. Ran `npm prune` to remove packages not listed in package.json
    2. Successfully removed 285 orphaned packages, including all Babel and Jest-related packages
    3. Verified that only the required dependencies remain in node_modules
