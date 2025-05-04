# Plan: Address Root Cause of Jest Performance Issues

## Chosen Approach (One‑liner)

Architecturally separate pure logic and DOM-heavy tests, minimize mocking by focusing only on true external dependencies, and migrate the test suite from Jest to Vitest (leveraging its native ESM support and faster transformers like esbuild/SWC) to eliminate performance bottlenecks and align test structure with code modularity.

## Architecture Blueprint

### Modules / Packages (Test Suite & Tooling)

- **Remove:** `jest`, `jest-environment-jsdom`, `@types/jest`, `babel-jest` (and potentially Babel config if solely used for Jest).
- **Add:** `vitest`, `@vitest/coverage-v8` (or similar provider), `@vitest/ui` (optional, for debugging).
- **Modify:** `package.json` (scripts, dependencies), CI configuration (`.github/workflows/ci.yml` or equivalent).
- **Structure (`src/__tests__/`):**
  - `unit/`: Pure logic tests (no DOM, minimal external mocks). Target Node environment.
  - `integration/`: Tests involving interactions between modules, potentially light DOM usage. Target JSDOM environment.
  - `dom/`: Tests heavily reliant on DOM manipulation, MutationObservers, complex browser APIs. Target JSDOM environment.
- **Configuration:**
  - `vitest.config.js`: Central configuration for Vitest. Defines environments (node vs. jsdom based on test paths), setup files, coverage, aliases, transform pipeline.
- **Setup & Mocks:**
  - `src/__tests__/setup/`: Directory for global or suite-specific setup files (e.g., `vitest.setup.js`, `dom.setup.js`).
  - `src/__tests__/mocks/`: Explicit, minimal mocks for _true external dependencies only_ (e.g., `chrome-api.mock.js`).

### Public Interfaces / Contracts (Test Suite)

- **Test Execution Commands:** Updated `npm` scripts (`test`, `test:unit`, `test:dom`, `test:integration`, `test:watch`, `test:coverage`).
- **Test API:** Standard Vitest API (`describe`, `it`, `expect`, `vi`). Mocks use `vi.mock`, `vi.fn`, `vi.spyOn`.
- **Mock Contracts:** Mocks in `src/__tests__/mocks/` must accurately reflect the interface (method signatures, return types) of the external dependency they replace. Use JSDoc or TypeScript types via comments for clarity.

### Data Flow Diagram (Test Execution)

```mermaid
graph TD
    subgraph Test Categories
        UnitTests[Unit Tests (.unit.test.js)]
        IntegrationTests[Integration Tests (.integration.test.js)]
        DOMTests[DOM Tests (.dom.test.js)]
    end

    subgraph Vitest Runner & Config
        VitestConfig[vitest.config.js]
        VitestCLI[Vitest CLI]
        Transformer[Transformer (esbuild/SWC)]
        NodeEnv[Node Environment]
        JSDOMEnv[JSDOM Environment]
    end

    subgraph Setup & Mocks
        GlobalSetup[src/__tests__/setup/global.setup.js]
        DOMSetup[src/__tests__/setup/dom.setup.js]
        Mocks[src/__tests__/mocks/*]
    end

    subgraph Source Code
        AppCode[src/**/*.js]
    end

    VitestCLI --reads--> VitestConfig
    VitestConfig --configures--> Transformer
    VitestConfig --selects env for--> UnitTests
    VitestConfig --selects env for--> IntegrationTests
    VitestConfig --selects env for--> DOMTests

    UnitTests --run in--> NodeEnv
    IntegrationTests --run in--> JSDOMEnv
    DOMTests --run in--> JSDOMEnv

    NodeEnv --loads--> GlobalSetup
    JSDOMEnv --loads--> GlobalSetup
    JSDOMEnv --loads--> DOMSetup

    UnitTests --imports & tests--> AppCode
    IntegrationTests --imports & tests--> AppCode
    DOMTests --imports & tests--> AppCode

    UnitTests --uses minimal--> Mocks
    IntegrationTests --uses--> Mocks
    DOMTests --uses--> Mocks

    AppCode --transformed by--> Transformer

    VitestCLI --> Results[Test Results & Coverage]

    classDef category fill:#f9f,stroke:#333,stroke-width:2px;
    class UnitTests,IntegrationTests,DOMTests category;
    classDef config fill:#ccf,stroke:#333,stroke-width:2px;
    class VitestConfig,VitestCLI,Transformer,NodeEnv,JSDOMEnv config;
    classDef support fill:#e6f,stroke:#333,stroke-width:2px;
    class GlobalSetup,DOMSetup,Mocks support;
```

### Error & Edge‑Case Strategy (Test Suite)

- **Failure Clarity:** Test failures must clearly indicate the component, expected vs. actual outcome, and provide stack traces pointing to the test file and source code. Vitest's default reporters aid this.
- **Isolation:** Enforce strict test isolation. Use `beforeEach`/`afterEach` within test files or setup files to reset mocks (`vi.clearAllMocks()`, `vi.resetAllMocks()`), reset DOM state (if applicable), and clear timers (`vi.useRealTimers()`). No test order dependency allowed.
- **Resource Management:** Vitest runs tests in parallel by default. Monitor for memory leaks or excessive CPU usage, especially in DOM-heavy tests. Use Vitest flags (`--inspect-brk`, `--heap`) for debugging if needed. Mark known resource-intensive tests and consider running them serially or excluding them from default runs if necessary.
- **Mock Accuracy:** Mock failures should indicate a mismatch between the mock and the actual external API contract. Regularly review mocks against documentation.

## Detailed Build Steps

1.  **Audit & Categorize Existing Tests:**
    - Go through every file in `src/__tests__`.
    - Identify the primary nature of each test: pure logic, integration, DOM-heavy, UI interaction.
    - Rename files with suffixes reflecting their category: `.unit.test.js`, `.integration.test.js`, `.dom.test.js`.
    - Identify and flag tests that currently mix concerns (e.g., heavy DOM manipulation within a primarily logic test) for refactoring.
    - Document findings: list tests, categories, and refactoring notes.
2.  **Establish New Test Structure:**
    - Create directories: `src/__tests__/unit/`, `src/__tests__/integration/`, `src/__tests__/dom/`, `src/__tests__/setup/`, `src/__tests__/mocks/`.
    - Move categorized test files (from step 1) into their respective directories.
3.  **Minimize & Centralize Mocks:**
    - Review all existing `jest.mock`, `jest.fn`, `jest.spyOn` usage.
    - Eliminate mocks for internal application modules. Tests should import and use the actual modules.
    - Identify true external dependencies (primarily `chrome.*` APIs).
    - Create minimal, reusable mocks for these externals in `src/__tests__/mocks/` (e.g., `chrome-api.mock.js`). Use `vi.fn()` for mock functions.
    - Refactor tests to import and use these centralized mocks where necessary, removing inline mocks.
4.  **Spike: Vitest Basic Setup & Compatibility:**
    - Install `vitest`, `@vitest/coverage-v8`.
    - Create a basic `vitest.config.js`. Configure aliases (`@/`) if needed.
    - Create a minimal `src/__tests__/setup/vitest.setup.js` to adapt essential parts of `jest.setup.cjs` (e.g., basic `chrome` mock setup using `vi.mock` and the centralized mock file).
    - Attempt to run _one_ simple `.unit.test.js` file with Vitest. Troubleshoot basic configuration, import/export syntax (Vitest prefers ESM), and `vi` API usage.
5.  **Configure Vitest (`vitest.config.js`):**
    - Define different environments based on test paths (e.g., `include: ['src/__tests__/unit/**']`, `environment: 'node'`, vs. `include: ['src/__tests__/dom/**', 'src/__tests__/integration/**']`, `environment: 'jsdom'`).
    - Configure `setupFiles` for global and potentially environment-specific setup.
    - Set `globals: true` if needed for Jest compatibility, but prefer explicit imports (`import { describe, it, expect, vi } from 'vitest'`).
    - Configure coverage (`provider: 'v8'`, reporters).
    - Ensure the transformer (default esbuild/SWC) is correctly handling the codebase.
6.  **Update `package.json` Scripts:**
    - Replace all `jest` commands with `vitest` equivalents:
      - `test`: `"vitest run"` (or configure specific suites)
      - `test:unit`: `"vitest run src/__tests__/unit"`
      - `test:dom`: `"vitest run src/__tests__/dom"`
      - `test:integration`: `"vitest run src/__tests__/integration"`
      - `test:watch`: `"vitest"`
      - `test:coverage`: `"vitest run --coverage"`
    - Update `ci` script to use the appropriate `vitest` command.
7.  **Iterative Test Migration & Refactoring:**
    - **Unit Tests:** Start with the `src/__tests__/unit/` directory. Adapt syntax (`jest.*` to `vi.*`). Ensure no DOM/JSDOM dependencies. Verify minimal mocking. Fix failures.
    - **Integration & DOM Tests:** Move to `src/__tests__/integration/` and `src/__tests__/dom/`. Adapt syntax. Ensure correct JSDOM environment usage. Refactor tests flagged in step 1 to better separate concerns. Simplify complex DOM setups (`setupTestDom`). Ensure mocks are correctly applied via setup files or `vi.mock`. Fix failures, paying attention to async behavior and timer mocks (`vi.useFakeTimers`).
    - **Remove Workarounds:** Delete any code related to Jest performance workarounds (e.g., manual test file splitting like `priceFinder.test.patch.js`). Ensure tests cover the intended logic directly.
8.  **Validate Coverage & Performance:**
    - Run `npm run test:coverage`. Verify reports are generated correctly and coverage meets targets. Address any significant drops.
    - Run the full suite (`npm test`). Monitor execution time and memory usage locally and in CI. Compare with previous Jest benchmarks if available. Identify and optimize remaining slow tests.
9.  **CI Integration:**
    - Update the CI workflow file (`.github/workflows/ci.yml`) to use the new `vitest` commands.
    - Ensure coverage reports are correctly uploaded (if applicable).
    - Remove any Jest-specific CI configurations (like `maxWorkers: 1` unless still proven necessary after optimization). Monitor CI run times and stability.
10. **Documentation Update:**
    - Update `README.md`, `CONTRIBUTING.md`, and any other relevant developer docs (`CLAUDE.md`).
    - Explain the new test structure (unit/integration/dom).
    - Document the new test commands.
    - Reinforce the testing philosophy (minimal mocking, separation of concerns).
    - Provide examples of how to write tests in the new structure.
11. **Cleanup:**
    - Remove Jest dependencies (`jest`, `jest-environment-jsdom`, `@types/jest`, `babel-jest`) from `package.json`.
    - Delete Jest configuration files (`jest.config.cjs`, `jest.setup.cjs`).
    - Remove Babel configuration (`babel.config.cjs`) _only if_ it was solely used for Jest transpilation.
    - Run `npm prune` (or equivalent) to remove orphaned packages.

## Testing Strategy

- **Test Layers:**
  - **Unit (`src/__tests__/unit/`):** Focus on individual functions/modules. Use Node environment. No DOM. Mock only true external dependencies (minimal Chrome API surface needed by the unit). High coverage expected (>95%).
  - **Integration (`src/__tests__/integration/`):** Test interaction between modules. Use JSDOM environment. Light DOM usage acceptable. Mock external dependencies (Chrome API). Focus on data flow and contracts between modules. Moderate-to-high coverage expected (>80%).
  - **DOM (`src/__tests__/dom/`):** Test components heavily interacting with the DOM (content scripts, MutationObservers, UI components). Use JSDOM environment. Requires careful setup/teardown of DOM state. Mock external dependencies. Focus on DOM manipulation logic, event handling, observer behavior. Moderate coverage expected (>70%), focusing on critical paths.
- **What to Mock:**
  - **Rule:** Only mock true external dependencies that are not part of the application's codebase or the standard JS environment provided by Node/JSDOM.
  - **Primary Target:** `chrome.*` APIs. Use centralized mocks from `src/__tests__/mocks/`.
  - **Avoid:** Mocking internal application modules, utility functions, or standard JS/DOM APIs that JSDOM provides. Test against the real implementation. Refactor code for better testability (dependency injection) if internal mocking seems necessary.
- **Coverage Targets & Edge Cases:**
  - Overall target: Maintain or increase existing coverage levels, aiming for >85% combined line coverage.
  - Focus on 100% coverage for critical utility/logic modules (`converter`, `parser`).
  - Ensure edge cases identified in existing tests (e.g., storage errors, form validation, complex price formats, XSS attempts, rapid mutations) are covered in the refactored tests.
  - Explicitly test cleanup logic (e.g., MutationObserver disconnect, event listener removal).

## Logging & Observability

- **Test Runner Output:** Utilize Vitest's built-in reporters (default, verbose, json) for clear pass/fail status, timings, and error reporting in local development and CI.
- **Debugging:** Use `console.log` or the application's logger (`src/utils/logger.js` configured for debug level) within tests for troubleshooting. Leverage `@vitest/ui` or `--inspect-brk` for deeper debugging.
- **Performance Monitoring:** Log execution times reported by Vitest. For specific performance investigations within tests (e.g., DOM processing), use `console.time`/`console.timeEnd` or Node's `perf_hooks` API.

## Security & Config

- **Input Validation Hotspots:** The migration reinforces the need for strong tests around input handling, especially in `options/validator.js` and `options/formHandler.js`. Ensure tests cover sanitization and validation against malicious inputs (XSS, unexpected types, boundary values).
- **Secrets Handling:** N/A. No secrets involved in the test suite or its configuration.
- **Least-Privilege (Mocks):** Ensure mocks created in `src/__tests__/mocks/` only expose the minimal API surface required by the tests, reducing the risk of tests passing based on overly permissive mock behavior.

## Documentation

- **Code Self-Doc:** Test descriptions (`describe`/`it`) must be clear and accurately reflect the tested behavior. Use JSDoc for complex test helper functions or mock implementations.
- **README/Contributing Updates:**
  - Update `README.md` and `CONTRIBUTING.md` testing sections:
    - Replace Jest setup/commands with Vitest.
    - Explain the new test directory structure (`unit`, `integration`, `dom`).
    - State the minimal mocking philosophy (mock externals only).
    - Provide clear instructions on how to run different test suites.
  - Update `CLAUDE.md` or similar AI interaction guides with new commands and structure.
- **Test Philosophy Document (Optional but Recommended):** A brief section in `CONTRIBUTING.md` or a separate `TESTING_GUIDE.md` explaining the rationale behind the structure and mocking strategy.

## Risk Matrix

| Risk                                                                           | Severity | Mitigation                                                                                                                                                                            |
| :----------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Underestimation of refactoring effort for complex/intertwined tests            | High     | Perform thorough audit (Step 1). Break down refactoring into smaller, manageable chunks per module/category. Allocate sufficient time. Use iterative approach (Step 7).               |
| Subtle behavior changes in tests due to runner/API differences                 | Medium   | Careful review of failing tests. Compare behavior against Jest execution if needed for specific complex cases. Leverage Vitest's snapshot testing judiciously if applicable.          |
| `chrome` API mock incompatibility or inaccuracy                                | High     | Centralize mocks (Step 3). Test mock behavior explicitly where necessary. Refer to Vitest mocking docs and Chrome extension docs. Use the compatibility spike (Step 4).               |
| Regressions in test coverage                                                   | Medium   | Run coverage reports before and after migration. Mandate maintaining or increasing coverage. Pay close attention to coverage gaps during refactoring.                                 |
| CI performance issues or instability with parallel execution                   | Medium   | Monitor CI runs closely after migration. Configure Vitest parallelism carefully. Identify and optimize resource-heavy tests. Consider serial execution for specific suites if needed. |
| JSDOM limitations hindering specific DOM/browser API tests                     | Medium   | Investigate JSDOM compatibility for needed APIs. If unsupported, mock the specific API minimally or evaluate if the test requires a true browser environment (E2E scope).             |
| Team unfamiliarity with Vitest API or concepts                                 | Low      | Provide links to Vitest documentation. Encourage pair programming during migration. Start migration with simpler tests. Use `@vitest/ui` for exploration.                             |
| Re-introduction of poor testing practices (excessive mocking, mixing concerns) | Medium   | Enforce new structure and mocking philosophy via documentation, PR reviews, and potentially lint rules (if feasible).                                                                 |

## Open Questions

- Are there any current Jest plugins, reporters, or complex matchers in use that lack direct Vitest equivalents and require significant rework? (Assumption: No, based on typical usage).
- Confirm Babel's role: Is it used _only_ for Jest, or does the main build process rely on it? (Assumption: Only for Jest, as `esbuild` is likely used for the build).
- Are there specific performance benchmarks (e.g., max execution time for the full suite) that need to be met post-migration?
- What is the definitive target for code coverage percentage? (Assumption: Maintain/improve, aiming >85%).
- Should resource-intensive stress tests (if any are identified) be included in the default `npm test` run or require an explicit flag?
