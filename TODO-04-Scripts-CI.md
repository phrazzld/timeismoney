# TODO: Phase 4 - Scripts & CI Integration

**Focus:** Integrate Vitest into the development workflow (npm scripts) and CI pipeline.
**Goal:** Ensure developers can run tests easily and CI validates changes using Vitest.
**Related Plan Section:** PLAN.md - Detailed Build Steps - 6 & 9

---

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
  - **Depends‑on:** [✅ T010]

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
  - **Depends‑on:** [✅ T011]
