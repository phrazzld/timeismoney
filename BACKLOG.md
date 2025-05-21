# BACKLOG

This backlog outlines planned work for the extension, balancing feature development, technical improvements, operational excellence, and innovation, aligned with our development philosophy and informed by codebase analysis.

---

## High Priority

### Core Functionality Enhancement

- **[Feature/Enhancement] Enable Extension on All Sites (Remove Site Whitelist)**

  - **Type**: Feature/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Expands the extension's utility by allowing price conversion on any website, significantly improving user experience and value proposition. Currently limited by site whitelist restrictions.
  - **Expected Outcome**: Extension operates on all websites by default, with users able to disable on specific sites if needed. Removal of hardcoded site restrictions.
  - **Dependencies**: `[Security/Refactor] Implement Systematic Input Sanitization & Validation`, `[Security/Enhancement] Review and Minimize Host Permissions`.

### Foundational Technical Excellence & Philosophy Alignment

- **[Refactor/Philosophy] Enforce Strict TypeScript Compiler Options and Eliminate `any` (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Complex
  - **Rationale**: Maximizes type safety across the project, enables earlier error detection, improves code clarity, and significantly reduces potential for runtime type errors. Aligns with _Maximize Language Strictness, Leverage Types Diligently: Express Intent Clearly_ principle.
  - **Expected Outcome**: `tsconfig.json` is configured for strict mode, and all `any` types are eliminated from the codebase, replaced with specific types, `unknown`, or well-defined interfaces/unions.
  - **Dependencies**: None.

- **[Refactor/Philosophy] Abstract All Chrome API Interactions (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Complex
  - **Rationale**: Isolates external dependencies (Chrome APIs) for improved testability and adherence to mocking policies. Critical for _Mocking Policy: Sparingly, At External Boundaries Only_, _Design for Testability_, _Strict Separation of Concerns_.
  - **Expected Outcome**: All direct calls to Chrome APIs (e.g., `chrome.storage.*`, `chrome.runtime.*`, `chrome.i18n.*`) are refactored to go through dedicated wrapper modules/services. Modules like `utils/storage.js`, `options/formHandler.js`, `popup/popup.js`, `background/background.js`, `content/index.js` no longer call `chrome.*` APIs directly.
  - **Dependencies**: `[Test/Philosophy] Centralize and Standardize All External API Mock Implementations`.

- **[Enhancement/Philosophy] Mandate Conventional Commits and Remove Linter/Type Suppressions (Philosophy Alignment)**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Standardizes commit history for automated changelogs/versioning and ensures true code quality by fixing underlying issues instead of suppressing them. Aligns with _Conventional Commits are Mandatory, Address Violations, Don't Suppress: Fix the Root Cause_.
  - **Expected Outcome**: Pre-commit hooks (e.g., Husky + commitlint) and CI checks enforce Conventional Commits. All linter/type error suppressions (e.g., `// eslint-disable-line`, `@ts-ignore`) are removed, and underlying issues are fixed.
  - **Dependencies**: `[DevEx] Set Up Useful Pre-commit Hooks`.

- **[Enhancement/Philosophy] Implement CI Quality Gates for Test Coverage and Security Vulnerabilities (Philosophy Alignment)**
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Actively enforces minimum test coverage and prevents introduction of known high-impact vulnerabilities, ensuring baseline quality and security. Aligns with _Test Coverage Enforcement, Dependency Management Security, Automation, Quality Gates, and CI/CD_.
  - **Expected Outcome**: CI pipeline fails builds if test coverage drops below a defined threshold (e.g., 85%) or if high/critical severity vulnerabilities are found in dependencies (e.g., via `pnpm audit --audit-level=high`).
  - **Dependencies**: `[Chore] Audit and Update Dependencies`, `[Test] Expand Test Coverage for Edge Cases and Errors`.

### Testing Infrastructure & Quality Assurance

- ✅ **[Enhancement/Refactor] Migrate from Jest to Vitest**

  - **Type**: Enhancement/Refactor
  - **Complexity**: Complex
  - **Rationale**: Essential for a reliable and fast feedback loop during development (Developer Experience), improves CI efficiency (Operational Excellence), and avoids brittle test setups (Technical Excellence).
  - **Expected Outcome**: The test suite runs efficiently and reliably on typical development machines and CI environments without excessive resource consumption or manual file splitting workarounds. Test structure reflects code architecture.
  - **Status**: Completed - All tests have been migrated to Vitest with proper structure and patterns.

- **[Refactor/Bug Fix] Remove Global Jest Compatibility Layer & Global Test Functions**

  - **Type**: Refactor/Bug Fix
  - **Complexity**: High
  - **Rationale**: The current setup (`vitest.setup.js:10-63`) reintroduces fragility and implicit dependencies of a global test environment, contradicting modern ESM best practices and violating _Explicit is Better than Implicit_, _Design for Testability_.
  - **Expected Outcome**: All Vitest functions explicitly imported in every test file from a central helper (e.g. `vitest-imports.js`), no global assignments for test functions in `vitest.setup.js`, and `globalThis.jest` object removed.
  - **Dependencies**: None.

- **[Refactor/Bug Fix/Philosophy] Remove All Internal Module Mocking (Philosophy Alignment)**
  - **Type**: Refactor/Bug Fix
  - **Complexity**: High
  - **Rationale**: Mocking internal modules (e.g., `utils/logger`, `utils/storage`) leads to brittle tests and hides real integration bugs, violating _Mocking Policy: Sparingly, At External Boundaries Only_.
  - **Expected Outcome**: Tests only mock true external dependencies (e.g., abstracted Chrome API). Internal modules are tested via their public API, ensuring tests verify real component collaboration.
  - **Dependencies**: `[Refactor/Philosophy] Abstract All Chrome API Interactions`. May require refactoring some modules for better testability.

### Security, Stability & Reliability

- **[Security/Refactor] Implement Systematic Input Sanitization & Validation**

  - **Type**: Security/Refactor
  - **Complexity**: Medium
  - **Rationale**: Critical for security (Prevent XSS, data corruption), robustness (Prevent downstream errors), and maintainability (Single validation path). Foundational for user safety and trust.
  - **Expected Outcome**: All user inputs (options form, popup settings, especially currency symbols, custom regex) are rigorously sanitized and validated against a defined schema _before_ being saved to storage or used in logic. Verified by specific unit/integration tests. Storage only contains validated data.
  - **Dependencies**: Potentially `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Refactor/Enhancement] Standardize Asynchronous Error Handling Pattern**
  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Critical for robustness, predictability, and debuggability. Ensures the application handles unexpected situations gracefully (Operational Excellence) and aligns with _Consistent Error Handling_.
  - **Expected Outcome**: All async errors (especially `chrome.storage` calls, `MutationObserver` callbacks, `fetch` requests) are handled predictably, logged effectively with context, and do not leave the application in an inconsistent state.
  - **Dependencies**: `[Enhancement/Philosophy] Replace All console.* Calls with a Standardized Structured Logger`.

### Core Architecture & Logic Refactoring

- **[Refactor] Unify and Externalize Configuration Defaults**

  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Simplifies configuration management, ensures consistency (Technical Excellence), improves testability (easy override), and decouples modules from specific default values (Modularity).
  - **Expected Outcome**: All default values and configuration settings (currency, wage, debounce times, CSS selectors, regex patterns, feature flags) are centralized into a single, well-defined configuration module. Modules read config dynamically.
  - **Dependencies**: Impacts multiple modules; foundational for other refactors.

- **[Refactor] Improve Separation of Concerns in Options (`formHandler.js`)**
  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Enhances modularity, testability (isolate UI vs. logic vs. storage), and maintainability by adhering to the Single Responsibility Principle (Technical Excellence).
  - **Expected Outcome**: `formHandler.js` primarily orchestrates UI events and calls dedicated modules for business logic (validation, sanitization) and data persistence.
  - **Dependencies**: `[Security/Refactor] Implement Systematic Input Sanitization & Validation`, `[Refactor] Unify and Externalize Configuration Defaults`, `[Refactor/Philosophy] Abstract All Chrome API Interactions`.

### Build & Dependencies

- ✅ **[Chore/Enhancement] Migrate to pnpm Package Manager**

  - **Type**: Chore/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves dependency management with better performance, disk efficiency, and stricter dependency management.
  - **Expected Outcome**: Project uses pnpm for all package management operations; properly defined pnpm-lock.yaml.
  - **Status**: Completed - Project now uses pnpm for package management.

- **[Chore/Enhancement] Audit and Update Dependencies**
  - **Type**: Chore/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures security, stability, and maintainability by using up-to-date dependencies. (Technical Excellence, Operational Excellence).
  - **Expected Outcome**: Project dependencies are minimal, up-to-date, secure, and properly licensed.
  - **Dependencies**: None.

### CI/CD Pipeline

- ✅ **[Enhancement] Implement Centralized Node.js Version Management in CI**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures consistency between local development and CI environments, prevents version mismatch issues, and simplifies version updates.
  - **Expected Outcome**: All CI workflows use a centralized approach to Node.js version management via `.nvmrc` file.
  - **Status**: Completed - `.nvmrc` file is now the single source of truth for Node.js version in both local development and CI environments.

- ✅ **[Test] Implement Automated CI Node.js Version Validation**

  - **Type**: Test
  - **Complexity**: Medium
  - **Rationale**: Prevents configuration drift in CI workflows that could lead to environment inconsistencies.
  - **Expected Outcome**: Validation script checks all workflow files for compliance with the centralized Node.js version management approach, failing CI builds when non-compliant configurations are found.
  - **Status**: Completed - Script implemented and integrated into CI pipeline.

- ✅ **[Chore/Doc] Document Procedures for Updating Critical Environment Versions**

  - **Type**: Documentation/Chore
  - **Complexity**: Simple
  - **Rationale**: Ensures consistent approach to environment updates across the team, reducing errors and inconsistencies.
  - **Expected Outcome**: Comprehensive documentation for updating Node.js, pnpm, and other critical environment components.
  - **Status**: Completed - Documented in `docs/development/ENVIRONMENT_VERSION_MANAGEMENT.md`.

- ✅ **[Enhancement] Evaluate Workflow File Consolidation**

  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Reduces duplication and simplifies CI configuration maintenance.
  - **Expected Outcome**: Analysis document with recommendation for consolidating duplicate workflow files.
  - **Status**: Completed - Recommendation documented in `docs/development/CI_WORKFLOW_EVALUATION.md`.

- **[Refactor] Consolidate CI Workflow Files**
  - **Type**: Refactor
  - **Complexity**: Simple
  - **Rationale**: Based on the completed evaluation (T005), consolidating the duplicate CI workflow files will improve maintenance.
  - **Expected Outcome**: Single workflow file (`ci.yml`) handling all CI processes with documentation of the change.
  - **Dependencies**: None.

---

## Medium Priority

### Core Functionality & Accuracy

- **[Refactor/Philosophy] Modularize Price Finder Logic & Prioritize Pure Functions (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Complex
  - **Rationale**: Reduces complexity of a critical module (`priceFinder.js`), making it easier to understand, debug, test, and extend. Improves accuracy of core value proposition (Technical Excellence, Business Value). Aligns with _Prioritize Pure Functions: Isolate Side Effects_, _Design for Testability_, _Modularity is Mandatory_.
  - **Expected Outcome**: `priceFinder.js` logic is composed of smaller, single-responsibility modules (e.g., regex generation, locale detection, node traversal, price extraction, currency handling). Core price detection and regex generation logic are extracted into pure functions.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`, `[Refactor/Philosophy] Enforce File and Function Length Guidelines via Linters`.

- **[Refactor/Enhancement] Harden DOM Mutation Observer Lifecycle Management**
  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures the core content script mechanism (`domScanner.js`, `src/content/index.js`) is reliable, efficient, and doesn't cause performance degradation or errors on complex/dynamic web pages (Operational Excellence, Technical Excellence).
  - **Expected Outcome**: The MutationObserver lifecycle is robust, efficient, and demonstrably free from leaks or race conditions under various usage scenarios (SPAs, dynamic content loading, rapid enable/disable cycles).
  - **Dependencies**: `[Refactor/Enhancement] Standardize Asynchronous Error Handling Pattern`.

### User Interface & Experience (UI/UX)

- **[Feature/Enhancement] Redesign Work Hours Conversion UI to be a Clean Badge with a Clock Icon**

  - **Type**: Feature/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves the user experience by making the converted price more visually distinct, modern, and aesthetically pleasing, enhancing the core value proposition. (Business Value)
  - **Expected Outcome**: Converted prices are displayed using a custom-styled badge element, potentially incorporating a clock icon, providing a clear visual cue.
  - **Dependencies**: `[Refactor/Philosophy] Modularize Price Finder Logic & Prioritize Pure Functions`.

- **[Enhancement/Philosophy] Ensure Full WCAG 2.1 AA Accessibility for All User Interfaces (Philosophy Alignment)**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Extension UI (popup, options page) must meet WCAG 2.1 Level AA standards, ensuring usability for people with disabilities and improving overall user experience. Aligns with _Accessibility (WCAG Compliance is Mandatory)_.
  - **Expected Outcome**: Popup (`src/popup/index.html`, `popup.css`, `popup.js`) and Options pages (`src/options/index.html`, `styles.css`, `formHandler.js`) are fully WCAG 2.1 AA compliant, verified by audit and testing.
  - **Dependencies**: `[Enhancement] Improve Popup UI/UX Design`, `[Enhancement] Improve Options Page UI/UX Design`.

- **[Enhancement] Improve Popup UI/UX Design**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves user interaction and satisfaction with the primary control surface of the extension (Business Value).
  - **Expected Outcome**: A more intuitive, visually appealing, and user-friendly popup interface, incorporating layout changes, better visual hierarchy, and clearer state indication.
  - **Dependencies**: `[Enhancement] Create Professional Icons and Listing Images`, `[Refactor] Improve Separation of Concerns in Popup (popup.js)`, `[Enhancement/Philosophy] Implement Mobile-First Responsive Design for Popup and Options Pages`.

- **[Enhancement] Improve Options Page UI/UX Design**
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Makes configuration less daunting and error-prone for users, improving overall experience, especially as more options are added (Business Value).
  - **Expected Outcome**: A well-structured, intuitive, and visually consistent options page with logically grouped settings.
  - **Dependencies**: `[Refactor] Improve Separation of Concerns in Options (formHandler.js)`, `[Enhancement/Philosophy] Implement Mobile-First Responsive Design for Popup and Options Pages`.

### Advanced Technical Refactoring & Philosophy Alignment

- **[Refactor/Philosophy] Improve Separation of Concerns in Popup (popup.js) (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Simple
  - **Rationale**: Improves modularity, testability, and clarity by separating UI presentation from data persistence logic (Technical Excellence).
  - **Expected Outcome**: `popup.js` focuses on UI presentation and event handling, calling abstracted functions for data persistence.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`, `[Refactor/Philosophy] Abstract All Chrome API Interactions`.

- **[Enhancement/Philosophy] Replace All `console.*` Calls with a Standardized Structured Logger (Philosophy Alignment)**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Systematically replaces all direct `console.*` usages with a centralized structured logging utility, enforcing consistent formatting, log levels, and contextual information. Aligns with _Structured Logging is Mandatory, Design for Observability_.
  - **Expected Outcome**: All application logs (from `options/formHandler.js`, `content/settingsManager.js`, `popup/popup.js`, etc.) are structured, consistently formatted, and include necessary context, significantly improving debuggability.
  - **Dependencies**: `[Refactor/Enhancement] Standardize Asynchronous Error Handling Pattern`.

- **[Refactor/Philosophy] Enforce File and Function Length Guidelines via Linters (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Automated enforcement of code length (e.g., functions < 100 lines, files < 500 lines) promotes more modular, readable, and maintainable code units. Aligns with _Adhere to Length Guidelines, Modularity is Mandatory, Simplicity First_.
  - **Expected Outcome**: ESLint configured to enforce strict file/function length guidelines, making violations a CI-blocking error. Existing code (e.g. `src/content/priceFinder.js`, `src/content/domScanner.js`) refactored to comply.
  - **Dependencies**: Linters configured.

- **[Enhancement/Philosophy] Enforce Immutability for Application State and Configuration (Philosophy Alignment)**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improved state management predictability, reduced side effects, and easier reasoning about data flow and application behavior. Aligns with _Default to Immutability: Simplify State Management, Robustness_.
  - **Expected Outcome**: Application state (e.g., settings from storage) and configuration objects are treated as immutable (using `Readonly<T>`, immutable update patterns) in modules like `utils/storage.js`, `content/settingsManager.js`, `options/formHandler.js`, `popup/popup.js`, `background/background.js`.
  - **Dependencies**: `[Refactor/Philosophy] Enforce Strict TypeScript Compiler Options and Eliminate any`.

- **[Refactor/Philosophy] Refactor `domModifier.js` for Clear Separation of Concerns (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Decouples DOM manipulation logic from price conversion/formatting logic within `domModifier.js`. Aligns with _Separation of Concerns, Modularity is Mandatory_.
  - **Expected Outcome**: `domModifier.js` has a clearer, single responsibility (DOM interaction), improving its testability, readability, and maintainability. It calls out to other services for data transformation.
  - **Dependencies**: `[Refactor/Philosophy] Modularize Price Finder Logic & Prioritize Pure Functions`.

- **[Enhancement/Philosophy] Ensure Explicit Typing for All Function Signatures (Philosophy Alignment)**
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Enhanced code clarity and self-documentation through explicit function contracts, reducing ambiguity and potential for type-related errors. Aligns with _Leverage Types Diligently: Express Intent Clearly, Explicit is Better than Implicit_.
  - **Expected Outcome**: All functions across the TypeScript codebase have explicit type annotations for every parameter and return value.
  - **Dependencies**: `[Refactor/Philosophy] Enforce Strict TypeScript Compiler Options and Eliminate any`.

### Testing & CI/CD Enhancements

- **[Refactor] Simplify Overly Complex ESLint Rules for Test Files**

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Complex ESLint rules for test files (`.eslintrc.json:44-131`) are difficult to maintain and cause developer friction, violating _Simplicity First_, _Maintainability Over Premature Optimization_.
  - **Expected Outcome**: Simplified ESLint config for test files after removing global setup and related complexities.
  - **Dependencies**: `[Refactor/Bug Fix] Remove Global Jest Compatibility Layer & Global Test Functions`.

- **[Cleanup] Clean Up Test File Duplication and Fragmentation**

  - **Type**: Cleanup
  - **Complexity**: Medium
  - **Rationale**: Duplicate test files (throughout `src/__tests__/` and `temp/consolidated/`) create confusion and maintenance burden, violating _Modularity is Mandatory_, _DRY_.
  - **Expected Outcome**: Single authoritative test file per module, consolidated tests, removed `temp/consolidated/` directory.
  - **Dependencies**: None.

- **[Bug Fix] Fix validate-test-names.js to Skip Deleted Files**

  - **Type**: Bug Fix
  - **Complexity**: Simple
  - **Rationale**: Script (`scripts/validate-test-names.js`) currently checks deleted files, causing false failures during cleanup.
  - **Expected Outcome**: Validation script filters out deleted files and only checks existing files.
  - **Dependencies**: None.

- **[Refactor] Ensure Consistent Import Usage in Tests**

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Mixed usage of globals and imports in `.vitest.test.js` files creates confusion and violates _Coding Standards_, _Explicit is Better than Implicit_.
  - **Expected Outcome**: All tests use explicit imports from the designated `vitest-imports.js` helper.
  - **Dependencies**: `[Refactor/Bug Fix] Remove Global Jest Compatibility Layer & Global Test Functions`.

- **[Test/Philosophy] Centralize and Standardize All External API Mock Implementations (Philosophy Alignment)**

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Consistent, maintainable, and reliable mocking strategy for external dependencies, simplifying test setup and reducing boilerplate. Aligns with _Design for Testability, DRY (Don't Repeat Yourself), Modularity is Mandatory_.
  - **Expected Outcome**: All mock implementations for external APIs (e.g., Chrome API, browser APIs) are consolidated into `src/__tests__/mocks/`. Tests use a consistent setup utility (e.g., `setupChromeMocks`) for applying/resetting mocks.
  - **Dependencies**: `[Refactor/Philosophy] Abstract All Chrome API Interactions`, `[Refactor/Bug Fix/Philosophy] Remove All Internal Module Mocking`.

- **[Enhancement] Expand Test Coverage for Edge Cases and Errors**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Increases confidence in the extension's robustness and resilience to errors, unexpected inputs, and diverse web environments. Reduces regressions (Technical Excellence, Operational Excellence).
  - **Expected Outcome**: Increased test coverage for storage errors (quota exceeded, invalid data), permission issues, context invalidation, complex/unusual DOM structures, empty/missing configuration, locale-specific number formats, and specific error paths.
  - **Dependencies**: `[Refactor/Enhancement] Standardize Asynchronous Error Handling Pattern`.

- **[Feature/Enhancement] Implement End-to-End (E2E) Test Suite**
  - **Type**: Feature/Enhancement
  - **Complexity**: Complex
  - **Rationale**: Provides the highest level of confidence that the extension works correctly in a real browser, catching integration issues missed by unit/integration tests (Technical Excellence, Operational Excellence).
  - **Expected Outcome**: A basic E2E test suite (e.g., using Playwright) runs successfully in CI, validating core user journeys (enabling/disabling, changing settings, verifying price conversion on a sample page).
  - **Dependencies**: Stable core functionality.

### Operational Excellence & Developer Experience (DevEx)

- **[Security/Enhancement] Review and Minimize Host Permissions**

  - **Type**: Security/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Adheres to the principle of least privilege, enhancing security, reducing the extension's attack surface, and increasing user trust (Security, Business Value).
  - **Expected Outcome**: The extension requests only the minimum necessary host permissions in `manifest.json`. Broad permissions (`<all_urls>`) are justified or replaced with more specific patterns/optional permissions.
  - **Dependencies**: None.

- **[Enhancement] Set Up Useful Pre-commit Hooks**

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves code quality and consistency automatically, catches simple errors early, and enhances developer experience by automating routine checks (Developer Experience, Operational Excellence).
  - **Expected Outcome**: Pre-commit hooks (e.g., Husky and lint-staged) automatically run linters, formatters (Prettier), and potentially quick tests/file size checks.
  - **Dependencies**: Linters/formatters configured. See also `[Enhancement/Philosophy] Mandate Conventional Commits...`.

- **[Enhancement/Philosophy] Implement Mobile-First Responsive Design for Popup and Options Pages (Philosophy Alignment)**
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures optimal user experience across all device types and screen sizes. Aligns with modern responsive design principles.
  - **Expected Outcome**: Popup and Options pages display properly on mobile devices and smaller viewports, with touch-friendly interfaces where applicable.
  - **Dependencies**: `[Enhancement] Improve Popup UI/UX Design`, `[Enhancement] Improve Options Page UI/UX Design`.

### Internationalization (i18n)

- **[i18n] Ensure Full Localization of User-Facing Strings**
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Makes the extension accessible to more users and supports global adoption.
  - **Expected Outcome**: All user-facing text is localized via `messages.json` files, enabling easier translation and consistent international support.
  - **Dependencies**: Requires stable UI elements.

---

## Low Priority

### Code Quality & Standards

- **[Bug Fix] Fix Fragile Performance Logging in domScanner.js**

  - **Type**: Bug Fix
  - **Complexity**: Simple
  - **Rationale**: Code uses `performance.getEntriesByName(...).pop()` without defensive checks, can throw TypeErrors, violating _Consistent Error Handling_ and _Robustness_.
  - **Expected Outcome**: Defensive checks prevent crashes when performance entries are missing.
  - **Dependencies**: None.

- **[Cleanup] Simplify setupTestDom Helper in Vitest Setup**

  - **Type**: Refactor
  - **Complexity**: Simple
  - **Rationale**: Current helper creates overly specific DOM structure, coupling tests to arbitrary elements and violating _Simplicity First_ and _Design for Testability_.
  - **Expected Outcome**: `setupTestDom` provides minimal necessary DOM setup (e.g., `document.body`). Tests become responsible for creating the specific DOM structures they need.
  - **Dependencies**: None.

- **[Coding Standards] Enforce Consistent Use of Constants**

  - **Type**: Chore/Refactor
  - **Complexity**: Simple
  - **Rationale**: Improves code readability, maintainability, and makes global changes safer and easier (Technical Excellence).
  - **Expected Outcome**: Hardcoded values are eliminated in favor of named constants. Code is easier to understand and refactor.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Test] Refactor Tests for Clarity and Self-Documentation**
  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Improves test readability and aids future maintainers.
  - **Expected Outcome**: Tests use clear naming conventions and structure that express intent and scenarios being tested.
  - **Dependencies**: None.

### Minor Performance Optimizations

- **[Performance] Add `passive: true` to Applicable Event Listeners**
  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Follows best practices for event listeners, improving responsiveness.
  - **Expected Outcome**: All eligible listeners use `{ passive: true }`.
  - **Dependencies**: None.

### Build & Configuration

- **[Build] Fix .gitignore for Config Files**

  - **Type**: Bug Fix
  - **Complexity**: Simple
  - **Rationale**: Ensures config files are not improperly linted or excluded.
  - **Expected Outcome**: ESLint does not flag legitimate config files.
  - **Dependencies**: None.

- **[Build] Remove Redundant test:all Script**

  - **Type**: Cleanup
  - **Complexity**: Simple
  - **Rationale**: Simplifies scripts and reduces confusion.
  - **Expected Outcome**: Only one test command is present.
  - **Dependencies**: None.

- **[CI] Make Coverage Report Upload Mandatory**
  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Ensures test coverage is always tracked and enforced in CI.
  - **Expected Outcome**: CI runs fail if coverage reports are missing.
  - **Dependencies**: None.

### Documentation

- **[Docs] Enhance Documentation with "Why" Explanations**
  - **Type**: Documentation
  - **Complexity**: Simple
  - **Rationale**: Preserves institutional knowledge and aids future maintainers.
  - **Expected Outcome**: Documentation includes rationale for key decisions.
  - **Dependencies**: None.
