# Todo

## Phase 1: Foundation Security Infrastructure

- [x] **T001 · Chore · P0: create dependabot configuration file**

  - **Context:** Phase 1: Foundation Security Infrastructure · 1.1 Dependabot Configuration
  - **Action:**
    1. Create a new file at `.github/dependabot.yml` with the specified configuration for daily `npm` ecosystem updates.
  - **Done‑when:**
    1. The `.github/dependabot.yml` file is committed to the repository.
  - **Verification:**
    1. After merging, navigate to the repository's `Settings > Code security and analysis > Dependabot` and confirm the configuration is recognized.
  - **Depends‑on:** none

- [x] **T002 · Feature · P0: create security policy configuration module**

  - **Context:** Phase 1: Foundation Security Infrastructure · 1.3 Security Policy Configuration
  - **Action:**
    1. Create a new file at `scripts/security-config.js` that exports the `SECURITY_CONFIG` object.
    2. Populate the object with the `vulnerability` and `escalation` policies as defined in the plan.
  - **Done‑when:**
    1. The `scripts/security-config.js` module exists and exports the correct configuration structure.
  - **Depends‑on:** none

- [x] **T003 · Feature · P0: implement vulnerability parser module**

  - **Context:** Modular Component Structure · `scripts/vulnerability-parser.js`
  - **Action:**
    1. Create a new file at `scripts/vulnerability-parser.js`.
    2. Implement a function to parse the raw JSON output from `pnpm audit` into a clean, structured array of vulnerability objects.
  - **Done‑when:**
    1. The module correctly parses valid `pnpm audit` JSON, including cases with zero vulnerabilities.
  - **Depends‑on:** none

- [x] **T004 · Feature · P0: implement core security audit script**

  - **Context:** Phase 1: Foundation Security Infrastructure · 1.3 Security Audit Processing Script
  - **Action:**
    1. Create `scripts/security-audit.js` which reads a local `audit-results.json` file.
    2. Use the `vulnerability-parser` and `security-config` modules to apply the `failOnSeverity` policy.
    3. If the policy is violated, create a `critical-vulnerabilities.json` file and exit with a non-zero status code.
  - **Done‑when:**
    1. The script correctly identifies vulnerabilities that meet or exceed the `failOnSeverity` threshold.
    2. The script creates the `critical-vulnerabilities.json` file and exits non-zero only when a policy violation occurs.
  - **Depends‑on:** [T002, T003]

- [x] **T005 · Test · P1: add unit tests for security audit system**

  - **Context:** Phase 1: Foundation Security Infrastructure · Testing Strategy
  - **Action:**
    1. Create `src/__tests__/security/security-audit.vitest.test.js`.
    2. Write unit tests for the audit script, parser, and policy logic using mock vulnerability data.
  - **Done‑when:**
    1. Tests pass for scenarios with critical, high, and low severity vulnerabilities, including allowlist logic (once implemented).
    2. Code coverage for the new security scripts is at an acceptable level (e.g., >90%).
  - **Depends‑on:** [T004]

- [x] **T006 · Feature · P1: add security scan job to CI workflow**

  - **Context:** Phase 1: Foundation Security Infrastructure · 1.2 Enhanced CI Security Job
  - **Action:**
    1. Modify `.github/workflows/ci.yml` to add a new `security` job.
    2. The job must run `pnpm audit`, execute `scripts/security-audit.js`, and then check for the existence of `critical-vulnerabilities.json` to fail the build.
  - **Done‑when:**
    1. The `security` job appears and runs in the CI pipeline on every push.
    2. The job fails when the `check for critical vulnerabilities` step finds the failure artifact.
  - **Depends‑on:** [T004]

- [x] **T007 · Test · P1: validate end-to-end pipeline with a vulnerable package**
  - **Context:** Implementation Checklist · Week 2: Integration & Validation
  - **Action:**
    1. On a new branch, temporarily add a dependency with a known `critical` or `high` vulnerability.
    2. Push the branch and confirm the CI pipeline's `security` job fails as expected.
  - **Done‑when:**
    1. The CI run for the test branch fails specifically at the "Check for critical vulnerabilities" step.
    2. The temporary branch is deleted after validation.
  - **Depends‑on:** [T006]

## Phase 2: Advanced Monitoring & Automation

- [x] **T008 · Feature · P2: implement vulnerability allowlist mechanism**

  - **Context:** Risk Assessment & Mitigation · False positives blocking CI
  - **Action:**
    1. Modify `scripts/security-audit.js` to read the `allowList` array from `security-config.js`.
    2. Filter out any vulnerabilities whose ID is in the `allowList` before applying the severity policy.
  - **Done‑when:**
    1. A vulnerability that would normally fail the build is ignored if its ID is in the allowlist.
    2. Unit tests are updated to cover this allowlist logic.
  - **Depends‑on:** [T004, T005]

- [x] **T009 · Feature · P2: generate security report as a CI artifact**

  - **Context:** Phase 1.3 Security Audit Processing Script · `generateSecurityReport()`
  - **Action:**
    1. Enhance `scripts/security-audit.js` to generate a human-readable markdown report (`security-report.md`).
    2. Add a step to the `security` job in `ci.yml` to upload this report as a build artifact.
  - **Done‑when:**
    1. The `security-report.md` artifact is available for download on every CI run.
  - **Depends‑on:** [T004, T006]

- [x] **T010 · Chore · P2: configure dependabot auto-merge for low-risk updates**

  - **Context:** Phase 2: Advanced Monitoring & Automation · 2.1 Automated PR Management
  - **Action:**
    1. Update `.github/dependabot.yml` to enable `auto-merge` for patch and minor updates, contingent on CI passing.
  - **Done‑when:**
    1. The `dependabot.yml` file is updated with a valid auto-merge configuration.
  - **Verification:**
    1. Observe that a low-risk Dependabot PR is automatically merged after all required checks pass.
  - **Depends‑on:** [T001, T007]

- [x] **T011 · Chore · P2: create github issue template for vulnerability tracking**
  - **Context:** Phase 2: Advanced Monitoring & Automation · 2.2 Security Monitoring Dashboard
  - **Action:**
    1. Create a new issue template file at `.github/ISSUE_TEMPLATE/security_vulnerability.yml`.
    2. Define structured fields for reporting a vulnerability, such as severity, package, CVE, and impact.
  - **Done‑when:**
    1. A "Security Vulnerability" option appears in the "New Issue" template chooser.
  - **Depends‑on:** none

## Phase 3: Operational Excellence

- [x] **T012 · Chore · P2: document vulnerability response procedures**

  - **Context:** Phase 3: Operational Excellence · 3.1 Documentation & Procedures
  - **Action:**
    1. Create `docs/security/VULNERABILITY_RESPONSE.md` and populate it with the classification table, SLAs, and response actions from the plan.
  - **Done‑when:**
    1. The document is created, reviewed for clarity, and merged.
  - **Depends‑on:** none

- [x] **T013 · Chore · P2: document dependency management and escalation procedures**

  - **Context:** Phase 3: Operational Excellence · 3.1 Documentation & Procedures
  - **Action:**
    1. Create `docs/security/DEPENDENCY_MANAGEMENT.md` with guidelines for handling updates and the allowlist.
    2. Create `docs/security/ESCALATION_PROCEDURES.md` with the detailed escalation workflow.
  - **Done‑when:**
    1. Both documentation files are created, reviewed, and merged.
  - **Depends‑on:** none

- [ ] **T014 · Feature · P2: implement emergency bypass for security checks**

  - **Context:** Rollback Procedures · Emergency Bypass
  - **Action:**
    1. Modify the `security` job in `.github/workflows/ci.yml` to include an `if` condition that skips the job if a commit message contains `[skip security]`.
  - **Done‑when:**
    1. The security job is skipped when the bypass string is present in the latest commit message of a PR's head branch.
    2. The bypass procedure is documented in `docs/security/VULNERABILITY_RESPONSE.md`.
  - **Depends‑on:** [T006, T012]

- [ ] **T015 · Chore · P3: train team on new security processes**
  - **Context:** Implementation Checklist · Week 3
  - **Action:**
    1. Schedule and conduct a training session covering the new CI security checks, Dependabot workflow, and response procedures.
  - **Done‑when:**
    1. Training session is completed for all relevant team members.
  - **Depends‑on:** [T012, T013]

---

### Clarifications & Assumptions

- [ ] **Issue:** Confirm required repository permissions for implementation.

  - **Context:** Dependencies & Blockers
  - **Blocking?:** yes
  - **Action:**
    1. Request admin access to the repository to configure Dependabot and protected branch rules.
    2. Confirm workflow write access to modify `.github/workflows/ci.yml`.

- [ ] **Issue:** Obtain formal approval for security policies.
  - **Context:** Dependencies & Blockers · Security policy decisions
  - **Blocking?:** yes
  - **Action:**
    1. Present the initial `failOnSeverity` and `escalation` policies from `scripts/security-config.js` to the security team for formal sign-off.
