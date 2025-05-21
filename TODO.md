# TODO

## CI Failure Resolution PR #56

- [x] **T001 · Bugfix · P0: update node.js version to 20.x in all ci-fix.yml setup steps and push**
  - **Context:** Resolution for PR #56 CI failures
  - **Action:**
    1. Open the file `.github/workflows/ci-fix.yml` in the `feature/recognizers-money-refactor` branch.
    2. Locate all "Set up Node.js" steps (approx. 3 occurrences) and modify their `node-version` from `18.x` to `20.x`.
    3. Commit this change with a descriptive message (e.g., `fix(ci): align ci-fix.yml node version to 20.x`) and push to the branch.
  - **Done‑when:**
    1. The CI run for PR #56 completes successfully for all jobs defined in the `ci-fix.yml` workflow.
    2. Logs of the "Set up Node.js" step in the `ci-fix.yml` workflow jobs confirm that Node.js 20.x is installed.
    3. The `ERR_PNPM_UNSUPPORTED_ENGINE` error no longer appears in any job logs.

## CI/CD Pipeline Enhancements

- [ ] **T002 · Chore · P1: evaluate and select strategy for centralized node.js version management in ci**

  - **Context:** Prevention of similar CI issues in the future
  - **Action:**
    1. Evaluate the pros and cons of using reusable workflows/composite actions versus using `node-version-file: '.nvmrc'` with a root `.nvmrc` file.
    2. Document the chosen strategy and the rationale for the decision.
  - **Done‑when:**
    1. A clear decision on the strategy for centralizing Node.js version management is documented.

- [ ] **T003 · Refactor · P1: implement selected centralized node.js version management strategy in ci**

  - **Context:** Implementation of strategy from T002
  - **Action:**
    1. Create the necessary artifacts (e.g., a reusable workflow or a root `.nvmrc` file).
    2. Update all relevant CI workflows to utilize the implemented centralized mechanism for Node.js setup.
  - **Done‑when:**
    1. All CI workflows consistently use a single, central mechanism to define the Node.js version.
    2. CI jobs pass successfully using the centrally defined Node.js version.
  - **Depends‑on:** [T002]

- [ ] **T004 · Test · P2: implement script for automated ci node.js version validation**

  - **Context:** Automated CI configuration validation
  - **Action:**
    1. Develop a script that validates all CI workflows use the correct Node.js version.
    2. Integrate this script as a check in the CI pipeline.
  - **Done‑when:**
    1. A validation script correctly identifies non-compliant workflow configurations.
    2. The CI pipeline includes this check and fails the build if discrepancies are found.
  - **Depends‑on:** [T003]

- [ ] **T005 · Chore · P2: evaluate consolidation of ci-fix.yml and ci.yml workflows**

  - **Context:** Workflow consolidation for improved maintenance
  - **Action:**
    1. Analyze the triggers, jobs, and purpose of both workflow files.
    2. Document similarities, differences, and provide a recommendation.
  - **Done‑when:**
    1. A written analysis with a clear recommendation is documented and reviewed.

- [ ] **T006 · Chore · P2: document procedure for updating critical environment versions**
  - **Context:** Documentation for environment updates
  - **Action:**
    1. Create or update project documentation with a procedure for updating Node.js, pnpm, etc.
    2. Include a checklist that references the centralized management mechanism.
  - **Done‑when:**
    1. Documentation contains a comprehensive procedure for environment version updates.
  - **Depends‑on:** [T003]
