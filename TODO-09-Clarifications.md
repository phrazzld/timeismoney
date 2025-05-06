# TODO: Phase 9 - Clarifications

**Focus:** Track and resolve open questions that may block specific tasks or influence decisions.
**Goal:** Ensure all assumptions are validated and blockers are removed.
**Related Plan Section:** PLAN.md - Open Questions

---

- [x] **Q001: Confirm absence of complex Jest plugins/matchers needing specific handling**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there current Jest plugins, custom reporters, or complex matchers lacking direct Vitest equivalents that require specific migration plans? (Assumption: No)
  - **Blocking?:** no
  - **Resolution:** After thorough analysis of the Jest configuration and test files, no complex Jest plugins, custom reporters, or special matchers are being used that would require specific migration handling. The Jest configuration was standard, using only the built-in JSDOM environment and Babel for transpilation (already addressed in T021). All test utilities used are standard Jest functions (mock, fn, spyOn, etc.) which have direct Vitest equivalents (vi.mock(), vi.fn(), vi.spyOn(), etc.). The matchers used in tests (`toHaveBeenCalled`, `toEqual`, `toBe`, `toThrow`, etc.) all have direct Vitest equivalents. Centralized mocking of the Chrome API has already been implemented using Vitest's mocking utilities to replace Jest-specific mocking.

- [x] **Q002: Confirm Babel's role (Jest only vs. Build process)**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Is `babel.config.cjs` used _only_ for Jest transpilation, or is it required for the main application build process? (Assumption: Only for Jest)
  - **Blocking?:** yes (Blocks T021)
  - **Resolution:** After thorough investigation, Babel is confirmed to be used exclusively for Jest transpilation. The main build process uses esbuild for all bundling and transpilation tasks, as evidenced in package.json scripts and build-extension.sh. The babel.config.cjs file itself explicitly mentions Jest compatibility in comments. Since Jest has been removed (T020), Babel is no longer needed.

- [x] **Q003: Define specific performance benchmarks/goals**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** Are there explicit targets for test suite execution time post-migration?
  - **Blocking?:** no (Affects validation criteria for T018)
  - **Resolution:** After analyzing T018-results.md and running performance tests, the following performance benchmarks are established for the test suite:

    1. **Overall Test Suite**:
       - Maximum execution time: ≤5 seconds for all migrated Vitest tests
       - Startup/initialization overhead: ≤2 seconds (transform + setup time)
    2. **Test Categories**:
       - Unit tests: ≤1.5 seconds total execution time
       - Integration tests: ≤1.5 seconds total execution time
       - DOM tests: ≤2.0 seconds total execution time
    3. **Individual Test Performance**:
       - Average test execution: ≤20ms per test
       - Maximum acceptable time for any single test: ≤200ms
       - Exception for documented resource-intensive tests: ≤500ms
    4. **Resource Usage**:
       - Memory: Peak usage should not exceed 512MB for the complete test run
       - CPU: Utilize parallel execution effectively (70%+ CPU utilization for multi-core systems)
    5. **CI Performance**:
       - CI environment execution time should be no more than 2x local execution time
       - Maximum CI pipeline duration for tests: ≤10 seconds

    These targets provide a clear benchmark for validating the Vitest migration. Performance should be monitored regularly, and any test exceeding these thresholds should be optimized or documented as an exception.

- [x] **Q004: Define definitive code coverage target percentage**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** What is the precise minimum code coverage percentage required? (Assumption: Maintain/improve, aiming >85% combined)
  - **Blocking?:** no (Affects validation criteria for T017)
  - **Resolution:** After analyzing the current code coverage data and reviewing project documentation, the following definitive code coverage targets are established:

    1. **Overall Codebase**:

       - Minimum Combined Line Coverage: 85%
       - Statement Coverage: 85%
       - Branch Coverage: 80%
       - Function Coverage: 90%

    2. **Module-Specific Targets**:

       - Critical Utility Modules (`converter.js`, `parser.js`, `constants.js`): 100% line and function coverage, ≥95% branch coverage
       - Core Logic Modules (src/content): 90% line and function coverage, ≥85% branch coverage
       - UI Components (src/options, src/popup): 85% line coverage, ≥80% branch coverage
       - Background Scripts: 80% line coverage

    3. **Test Category Targets**:

       - Unit Tests: 95% coverage for units under test
       - Integration Tests: 80% coverage for integrated modules
       - DOM Tests: 70% coverage focused on critical DOM interactions

    4. **Exclusions**:
       - Build/configuration files (not part of production code)
       - Generated code or boilerplate
       - Error-handling branches that cannot be triggered in normal conditions

    These targets are appropriate for a Chrome extension with critical price calculation functionality while acknowledging the challenges in testing browser-specific features. The current T017 results (51.78% overall coverage) establish the baseline, with incremental progress expected as more tests are migrated from Jest to Vitest.

- [x] **Q005: Decide handling for resource-intensive tests**

  - **Context:** PLAN.md - Open Questions
  - **Issue:** If specific tests remain resource-intensive, should they be excluded from the default `npm test` run?
  - **Blocking?:** no (Affects T018 and potentially T011)
  - **Resolution:** Based on analysis of T018 results and Vitest capabilities, the following approach is established for handling resource-intensive tests:

    1. **Definition of "Resource-Intensive"**:
       Tests are considered resource-intensive if they:
       - Take >200ms to execute individually (as established in Q003)
       - Consume excessive memory or CPU resources
       - Create complex DOM structures or many mutations
       - Use extensive timer simulations
    2. **Implementation Approach**:
       - Resource-intensive tests should be INCLUDED in the default `npm test` run for complete validation
       - Tests exceeding the 500ms threshold (established in Q003) must be documented with an `@performance` JSDoc tag
       - A new test script will be added: `test:fast` that excludes these marked tests for quicker development cycles
    3. **Configuration**:
       - Update vitest.config.js to define a new "fast" workspace that excludes tests marked as resource-intensive
       - Add an npm script: `"test:fast": "vitest run --workspace=fast"`
       - Use existing `test:unit` and `test:integration` scripts for targeted testing during development
    4. **Documentation**:
       - Document resource-intensive tests in code with JSDoc comments explaining why they're slow
       - Maintain a list of such tests in TESTING_GUIDE.md
       - Include clear instructions for when to use different test commands
    5. **CI Integration**:
       - CI will always run the full test suite (`npm test`) including resource-intensive tests
       - Resource-intensive tests should have CI-specific timeout adjustments if needed

    This approach balances complete validation with developer experience by including all tests in CI while providing faster feedback loops during development.
