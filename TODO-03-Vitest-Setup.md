# TODO: Phase 3 - Vitest Setup & Configuration

**Focus:** Install Vitest, create configuration files, and perform basic validation.
**Goal:** Achieve a basic, runnable Vitest environment configured for the project.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 4 & 5

---

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
  - **Depends‑on:** [✅ T002, ✅ T005, ✅ T007]

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
