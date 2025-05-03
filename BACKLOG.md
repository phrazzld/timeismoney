# BACKLOG

This backlog outlines planned work for the extension, balancing feature development, technical improvements, operational excellence, and innovation, aligned with our development philosophy and informed by codebase analysis.

## High Priority

### Security & Stability

- **[Security] Implement Systematic Input Sanitization & Validation**: Refactor all user input processing (options form, popup settings) to ensure every input is rigorously sanitized (especially currency symbols, custom regex) and validated against a defined schema _before_ being saved to storage or used in logic, preventing XSS and invalid states.

  - **Type**: Security/Refactor
  - **Complexity**: Medium
  - **Rationale**: Critical for security (Prevent XSS, data corruption), robustness (Prevent downstream errors), and maintainability (Single validation path). Foundational for user safety and trust.
  - **Expected Outcome**: All inputs are demonstrably safe and valid before use, verified by specific unit and potentially integration tests targeting common XSS vectors and invalid data types. Storage only contains validated data.
  - **Dependencies**: Potentially `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Refactor] Standardize Asynchronous Error Handling Pattern**: Implement and enforce a consistent pattern for handling errors in all asynchronous operations (especially `chrome.storage` calls, `MutationObserver` callbacks, `fetch` requests if any). Ensure errors are caught, logged with context, and the application state/UI remains consistent or recovers gracefully.
  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Critical for robustness, predictability, and debuggability. Ensures the application handles unexpected situations gracefully (Operational Excellence).
  - **Expected Outcome**: All async errors are handled predictably, logged effectively (ideally using structured logging), and do not leave the application in an inconsistent state.
  - **Dependencies**: Potentially `[Logging] Implement Consistent Structured Logging with Context`.

### Core Refactoring & Architecture

- **[Refactor] Remove Deprecated Top-Level `content.js`**: Delete the legacy `content.js` file at the project root and ensure all references (build scripts, potentially manifest) are removed, relying solely on `src/content/index.js`.

  - **Type**: Refactor
  - **Complexity**: Simple
  - **Rationale**: Reduces confusion, removes dead code (Technical Debt Reduction), simplifies build process, aligns with modular structure (Technical Excellence).
  - **Expected Outcome**: The deprecated file is removed without affecting functionality. Build process is cleaner.
  - **Dependencies**: None

- **[Refactor] Unify and Externalize Configuration Defaults**: Centralize all default values and configuration settings (currency, wage, debounce times, CSS selectors, regex patterns, feature flags) into a single, well-defined configuration module/source of truth, removing hardcoded values from other modules.

  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Simplifies configuration management, ensures consistency (Technical Excellence), improves testability (easy override), and decouples modules from specific default values (Modularity).
  - **Expected Outcome**: Configuration is managed in one place. Changes to defaults require modifying only one location. Modules read config dynamically.
  - **Dependencies**: Impacts multiple modules; foundational for other refactors.

- **[Refactor] Improve Separation of Concerns in Options (`formHandler.js`)**: Decouple UI interaction logic (reading/writing DOM elements, event listeners) from validation, sanitization, and storage interaction logic within `formHandler.js`. Move validation/sanitization and storage calls to dedicated utilities or modules.

  - **Type**: Refactor
  - **Complexity**: Medium
  - **Rationale**: Enhances modularity, testability (isolate UI vs. logic vs. storage), and maintainability by adhering to the Single Responsibility Principle (Technical Excellence).
  - **Expected Outcome**: `formHandler.js` primarily orchestrates UI events and calls dedicated modules for business logic and data persistence, making it easier to understand, test, and maintain.
  - **Dependencies**: `[Security] Implement Systematic Input Sanitization & Validation`, `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Refactor] Improve Separation of Concerns in Popup (`popup.js`)**: Separate UI logic (updating checkbox states, handling clicks) from storage interaction logic (getting/setting extension state) in `popup.js`. Delegate storage operations to the `storage.js` utility or a dedicated settings service.
  - **Type**: Refactor
  - **Complexity**: Simple
  - **Rationale**: Improves modularity, testability, and clarity by separating UI presentation from data persistence logic (Technical Excellence).
  - **Expected Outcome**: `popup.js` focuses on UI presentation and event handling, calling abstracted functions for data persistence.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`.

### Testing & Dependencies

- **[Test] Address Root Cause of Jest Performance Issues**: Investigate the underlying reasons for high memory usage and slow test execution in Jest. Implement architectural changes (e.g., refining mocks, optimizing DOM-heavy tests, separating pure logic tests from DOM tests) or configuration fixes to achieve efficient testing without workarounds. Consider potential solutions like environment changes, faster transformers (SWC/esbuild), or alternative runners (Vitest).

  - **Type**: Enhancement/Refactor
  - **Complexity**: Complex
  - **Rationale**: Essential for a reliable and fast feedback loop during development (Developer Experience), improves CI efficiency (Operational Excellence), and avoids brittle test setups (Technical Excellence).
  - **Expected Outcome**: The test suite runs efficiently and reliably on typical development machines and CI environments without excessive resource consumption or manual file splitting workarounds. Test structure reflects code architecture.
  - **Dependencies**: Requires deep dive into tests, especially DOM-related ones. Impacts CI setup.

- **[Chore] Audit and Update Dependencies**: Perform a thorough audit of all production and development dependencies listed in `package.json`. Remove unused packages, update outdated ones (verifying compatibility and security advisories), and ensure license compliance.
  - **Type**: Chore/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures security, stability, and maintainability by using up-to-date and necessary dependencies. Reduces potential vulnerabilities and build issues (Technical Excellence, Operational Excellence).
  - **Expected Outcome**: Project dependencies are minimal, up-to-date, secure, and properly licensed. `package-lock.json` reflects audited state.
  - **Dependencies**: None

### Build & CI/CD

## Medium Priority

### Core Functionality & Accuracy

- **[Refactor] Modularize Price Finder Logic**: Break down the complex `priceFinder.js` module into smaller, more focused units (e.g., separating regex generation, locale detection, node traversal, price extraction, currency handling) to improve readability, maintainability, and unit testability.

  - **Type**: Refactor
  - **Complexity**: Complex
  - **Rationale**: Reduces complexity of a critical module, making it easier to understand, debug, test, and extend with support for new sites or formats (Technical Excellence). Improves accuracy of core value proposition (Business Value).
  - **Expected Outcome**: Price finding logic is composed of smaller, single-responsibility modules that are easier to understand, test in isolation, and modify. Overall maintainability is improved.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Refactor] Harden DOM Mutation Observer Lifecycle Management**: Audit and refactor the `MutationObserver` start/stop/disconnect logic in `domScanner.js` and `index.js` to guarantee robust handling of rapid enable/disable cycles, page navigations, iframe interactions, and potential race conditions, preventing memory leaks or orphaned observers.
  - **Type**: Refactor/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Ensures the core content script mechanism is reliable, efficient, and doesn't cause performance degradation or errors on complex or dynamic web pages (Operational Excellence, Technical Excellence).
  - **Expected Outcome**: The MutationObserver lifecycle is reliable, efficient, and demonstrably free from leaks or race conditions under various usage scenarios (SPAs, dynamic content loading).
  - **Dependencies**: `[Refactor] Standardize Asynchronous Error Handling Pattern`.

### User Interface & Experience (UI/UX)

- **[Feature] Create Splash Page and Link Listing**: Design and implement a dedicated HTML page (linked from the extension listing or shown on first install/update) that introduces the extension's purpose, basic usage, and potentially highlights key features or recent changes.

  - **Type**: Feature
  - **Complexity**: Medium
  - **Rationale**: Improves user onboarding, clarifies value proposition, and provides a central place for information, potentially increasing user retention and satisfaction (Business Value).
  - **Expected Outcome**: A polished, informative splash/welcome page is accessible to users.
  - **Dependencies**: `[Enhancement] Create Professional Icons and Listing Images`.

- **[Enhancement] Create Professional Icons and Listing Images**: Design and implement high-quality, professional icons (various sizes required by browser stores) and promotional images/screenshots for the extension listing.

  - **Type**: Enhancement
  - **Complexity**: Medium (Requires design skill/assets)
  - **Rationale**: Crucial for attracting users in the extension store, establishing credibility, and creating a recognizable brand identity (Business Value).
  - **Expected Outcome**: A complete set of professional, consistent visual assets for the extension and its store listing.
  - **Dependencies**: None

- **[Enhancement] Improve Popup UI/UX Design**: Redesign the extension popup for better clarity, aesthetics, and usability. This could involve layout changes, better visual hierarchy, clearer state indication, and potentially adding links to options or help.

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves user interaction and satisfaction with the primary control surface of the extension (Business Value).
  - **Expected Outcome**: A more intuitive, visually appealing, and user-friendly popup interface.
  - **Dependencies**: `[Enhancement] Create Professional Icons and Listing Images`, `[Refactor] Improve Separation of Concerns in Popup (popup.js)`.

- **[Enhancement] Improve Options Page UI/UX Design**: Redesign the options page for better organization, clarity, and ease of use, especially if more configuration options are added over time. Group related settings logically.
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Makes configuration less daunting and error-prone for users, improving overall experience (Business Value).
  - **Expected Outcome**: A well-structured, intuitive, and visually consistent options page.
  - **Dependencies**: `[Refactor] Improve Separation of Concerns in Options (formHandler.js)`.

### Testing & Quality Assurance

- **[Test] Expand Test Coverage for Edge Cases and Errors**: Add specific unit and integration tests covering known edge cases and error conditions, such as storage errors (quota exceeded, invalid data), permission issues, context invalidation, complex/unusual DOM structures, empty/missing configuration, locale-specific number formats, and specific error paths identified during error handling standardization.

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Increases confidence in the extension's robustness and resilience to errors, unexpected inputs, and diverse web environments. Reduces regressions (Technical Excellence, Operational Excellence).
  - **Expected Outcome**: Increased test coverage provides higher confidence in the extension's behavior under adverse conditions. Key edge cases are demonstrably handled correctly.
  - **Dependencies**: `[Refactor] Standardize Asynchronous Error Handling Pattern`.

- **[Test] Implement End-to-End (E2E) Test Suite**: Set up and configure an E2E testing framework (e.g., Playwright) to simulate user interactions within a real browser environment. Create initial tests covering core user flows (e.g., enabling/disabling, changing settings, verifying price conversion on a sample page).
  - **Type**: Feature/Enhancement
  - **Complexity**: Complex
  - **Rationale**: Provides the highest level of confidence that the extension works correctly in a real browser, catching integration issues missed by unit/integration tests (Technical Excellence, Operational Excellence). Enables regression testing for future releases.
  - **Expected Outcome**: A basic E2E test suite runs successfully in CI, validating core user journeys.
  - **Dependencies**: Requires stable core functionality and potentially `[Test] Address Root Cause of Jest Performance Issues`.

### Operational Excellence & Developer Experience (DevEx)

- **[Logging] Implement Consistent Structured Logging with Context**: Standardize logging across all modules (`background`, `content`, `options`, `popup`, `utils`). Ensure logs are structured (e.g., JSON or key-value format), include context (e.g., module name, function name), consistent levels (debug, info, warn, error), and potentially correlation IDs for tracing operations. Introduce a lightweight logging utility.

  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Significantly improves debuggability and traceability, making it easier to diagnose issues in development and potentially in production if logs are collected (Operational Excellence, Developer Experience).
  - **Expected Outcome**: Logs provide clear, consistent, and structured information across the application. A central `logger.js` utility is used.
  - **Dependencies**: `[Refactor] Standardize Asynchronous Error Handling Pattern`.

- **[Security] Review and Minimize Host Permissions**: Analyze the `host_permissions` list in `manifest.json`. Justify each entry, remove unused domains, and evaluate if broad permissions (`<all_urls>`) can be replaced with more specific patterns or optional permissions requested at runtime.

  - **Type**: Security/Enhancement
  - **Complexity**: Medium
  - **Rationale**: Adheres to the principle of least privilege, enhancing security, reducing the extension's attack surface, and increasing user trust by requesting only necessary permissions (Security, Business Value).
  - **Expected Outcome**: The extension requests only the minimum necessary host permissions required for its core functionality. Manifest reflects reviewed permissions.
  - **Dependencies**: None

- **[Build] Optimize Build Process**: Exclude non-essential files (e.g., `glance.md`, `BACKLOG.md`, source maps in production builds unless needed for error reporting) from the final `dist/` package to minimize extension size. Review build script efficiency.

  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Reduces extension package size, potentially improving installation time and resource usage. Cleans up distributable artifact (Operational Excellence).
  - **Expected Outcome**: The packaged extension (`dist/`) contains only necessary files for runtime operation.
  - **Dependencies**: None

- **[DevEx] Set Up Useful Pre-commit Hooks**: Implement pre-commit hooks (e.g., using Husky and lint-staged) to automatically run linters, formatters (like Prettier), and potentially quick tests before allowing a commit. Include checks for file size limits (warn > 500 lines, error > 1000 lines).
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Improves code quality and consistency automatically, catches simple errors early, and enhances developer experience by automating routine checks (Developer Experience, Operational Excellence).
  - **Expected Outcome**: Pre-commit hooks enforce coding standards and run basic checks, improving codebase health.
  - **Dependencies**: Linters/formatters configured.

### Internationalization (i18n)

- **[i18n] Ensure Full Localization of User-Facing Strings**: Audit the codebase (UI components, validation messages, error messages) to ensure all user-facing strings are sourced via `chrome.i18n.getMessage`. Add any missing strings to `_locales/*/messages.json`.
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Enables internationalization, making the extension accessible to a wider audience and improving user experience for non-English speakers (Business Value). Aligns with coding standards (Technical Excellence).
  - **Expected Outcome**: All text seen by the user is localized via `messages.json` files, enabling easier translation and consistent international support.
  - **Dependencies**: Requires stable UI elements.

## Low Priority

### Code Quality & Standards

- **[Coding Standards] Enforce Consistent Use of Constants**: Perform a codebase review to identify and replace hardcoded "magic strings" or numbers (e.g., CSS class names, storage keys, event names, default timeouts) with named constants imported from `src/utils/constants.js` or other relevant constant modules. Configure linting rules if possible to prevent future occurrences.

  - **Type**: Chore/Refactor
  - **Complexity**: Simple
  - **Rationale**: Improves code readability, maintainability, and makes global changes (like renaming a storage key) safer and easier (Technical Excellence).
  - **Expected Outcome**: Hardcoded values are eliminated in favor of named constants. Code is easier to understand and refactor.
  - **Dependencies**: `[Refactor] Unify and Externalize Configuration Defaults`.

- **[Test] Refactor Tests for Clarity and Self-Documentation**: Review existing tests to improve naming conventions (describe/it blocks, test function names) and structure, ensuring they clearly express the intent and scenario being tested, minimizing the need for explanatory comments that merely restate the code.
  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Improves test readability and maintainability, making tests serve as effective documentation of expected behavior (Technical Excellence, Developer Experience).
  - **Expected Outcome**: Tests are highly readable and clearly communicate their purpose and the behavior they verify.
  - **Dependencies**: None

### Minor Performance Optimizations

- **[Performance] Add `passive: true` to Applicable Event Listeners**: Review `addEventListener` calls, particularly in content scripts (`domScanner`, `index`) and UI (`options`, `popup`), and add the `{ passive: true }` option where the listener does not call `event.preventDefault()`, potentially improving scrolling performance on complex pages.
  - **Type**: Enhancement
  - **Complexity**: Simple
  - **Rationale**: Minor performance optimization that follows best practices for event listeners, potentially improving perceived responsiveness (Technical Excellence).
  - **Expected Outcome**: Relevant event listeners are marked as passive where applicable, potentially improving scrolling performance.
  - **Dependencies**: None

### Documentation

- **[Docs] Enhance Documentation with "Why" Explanations**: Augment existing documentation (README, inline JSDoc, specific docs) to include the rationale behind significant architectural decisions, complex algorithms (like price finding regex), security choices, or configuration options, focusing on "why" rather than just "how".
  - **Type**: Documentation
  - **Complexity**: Simple
  - **Rationale**: Improves understanding for current and future maintainers, facilitates onboarding, and preserves institutional knowledge (Technical Excellence, Developer Experience).
  - **Expected Outcome**: Documentation provides deeper insights into design choices, making maintenance and contribution easier.
  - **Dependencies**: None

### CI/CD Optimization

- **[CI] Optimize CI Pipeline Execution**: Categorize tests (e.g., unit, integration, E2E) and potentially run faster tests first. Investigate parallelization options if test suite becomes very large. Run memory-intensive tests last or on separate runners if needed.
  - **Type**: Enhancement
  - **Complexity**: Medium
  - **Rationale**: Speeds up feedback loop from CI, allowing developers to identify failures faster. Optimizes resource usage in CI (Operational Excellence).
  - **Expected Outcome**: CI pipeline provides faster feedback and runs efficiently.
  - **Dependencies**: `[Test] Address Root Cause of Jest Performance Issues`, `[Test] Implement End-to-End (E2E) Test Suite`.

## Future Considerations

Items in this section represent valuable ideas for exploration, research, or features that are currently out of scope but may become relevant later.

- **[Research] Explore Alternative Price Detection Methods**: Investigate techniques beyond regex for detecting prices, such as using structured data (Schema.org), machine learning models, or maintaining site-specific selectors/adapters (Innovation).
- **[Research] Automated Error Reporting**: Investigate integrating a service like Sentry or a custom endpoint for collecting anonymized error reports from users in the field (Operational Excellence). Requires careful consideration of privacy.
- **[Research] Support for Additional Browsers (Firefox, Edge)**: Evaluate effort and compatibility for porting or building cross-browser support (Business Value).
- **[Research] Investigate Migrating Unit Tests to Vitest**: Formally evaluate Vitest as a replacement for Jest based on findings from performance investigation (Technical Excellence, Developer Experience).
- **[Feature] User-Driven Customization of Highlighting Styles**: Allow users to select or define how price/time highlights appear (Business Value, Innovation).
- **[Feature] Support for Additional Currencies/Locales**: Expand the range of currencies and number formats the extension can recognize and convert (Business Value).
- **[Feature] User-Defined Website Rules**: Allow users to define custom CSS selectors or simple rules for websites where the extension doesn't automatically detect prices (Business Value, Innovation).
- **[Feature] Analytics Opt-In for Understanding User Engagement**: Explore adding privacy-conscious, opt-in analytics to understand feature usage and guide future development (Business Value). Requires legal/privacy review.
- **[Feature] Crypto / Stock Price Conversion**: Explore extending the conversion logic to handle cryptocurrency or stock tickers found on pages (Innovation).
