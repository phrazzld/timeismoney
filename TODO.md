# Todo

## Core Setup

- [x] **T001 · Chore · P2: install project dependencies**

  - **Context:** Plan Details - Detailed Build Steps - 1. Setup & Installation
  - **Action:**
    1. Run `pnpm add @microsoft/recognizers-text-suite money`.
  - **Done‑when:**
    1. Dependencies `@microsoft/recognizers-text-suite` and `money` are added to `package.json` and `pnpm-lock.yaml`.
    2. Project successfully installs dependencies with `pnpm install`.
  - **Depends‑on:** none

- [x] **T002 · Feature · P2: define core interfaces and types for currency and money handling**
  - **Context:** Plan Details - Detailed Build Steps - 1. Setup & Installation; Architecture Blueprint - Public Interfaces / Contracts
  - **Action:**
    1. Create `src/types/money.ts` (or `src/interfaces/` as appropriate).
    2. Define and export `IExtractedCurrency`, `IMoneyObject` (as an opaque type `unknown`), `ITimeBreakdown`, `IRecognitionService`, and `ICurrencyService` interfaces as specified in the plan.
  - **Done‑when:**
    1. All specified interfaces and types are defined and exported from `src/types/money.ts`.
    2. TypeScript compilation passes with the new type definitions.
    3. JSDoc comments are added to all defined interfaces and types as per "Documentation - Code Self‑Doc Patterns".
  - **Depends‑on:** none

## Recognition Service (`Microsoft.Recognizers.Text` Adapter)

- [x] **T003 · Feature · P1: implement `RecognitionService` adapter**

  - **Context:** Plan Details - Detailed Build Steps - 2. Implement `RecognitionService`; Architecture Blueprint - Modules / Packages (`src/services/recognitionService.ts`); Error & Edge‑Case Strategy; Logging & Observability; Security & Config
  - **Action:**
    1. Create `src/services/recognitionService.ts` and implement the `IRecognitionService` interface.
    2. Implement `extractCurrencies` using `@microsoft/recognizers-text-suite` (specifically `recognizeCurrency`), mapping recognizer results to `IExtractedCurrency`.
    3. Implement error handling (wrap library calls in `try...catch`, log errors, return empty array on failure) and input validation (ensure `text` is a string, `culture` is a string).
  - **Done‑when:**
    1. `RecognitionService.extractCurrencies` correctly extracts and transforms currency data for various inputs and cultures.
    2. Handles multiple currencies found in text and cases with no currencies by returning appropriate `IExtractedCurrency[]`.
    3. Library errors are caught, logged centrally, and an empty array is returned.
    4. Logging for `RecognitionService.extractCurrencies` (DEBUG, WARN, ERROR events) is implemented as per "Logging & Observability".
    5. Basic input validation for `text` and `culture` parameters is performed.
  - **Depends‑on:** [T002]

- [x] **T004 · Test · P1: write unit tests for `RecognitionService`**
  - **Context:** Plan Details - Detailed Build Steps - 8. Testing; Testing Strategy - Unit Tests (`RecognitionService`)
  - **Action:**
    1. Create unit tests for `RecognitionService` in a new test file (e.g., `src/services/recognitionService.test.ts`).
    2. Test `extractCurrencies` with various text inputs (different currencies, formats, multiple prices, no prices, empty strings), cultures, and ensure error handling.
    3. Do not mock `@microsoft/recognizers-text-suite`; test the integration with the actual library.
  - **Done‑when:**
    1. Unit tests achieve >90% coverage for `RecognitionService`.
    2. Tests verify correct mapping to `IExtractedCurrency`, handling of various inputs, culture processing, and error logging/return values.
    3. Edge cases outlined in "Coverage Targets & Edge‑Case Notes" are covered.
  - **Depends‑on:** [T003]

## Currency Service (`Money.js` Adapter)

- [x] **T005 · Feature · P1: implement `CurrencyService` adapter**

  - **Context:** Plan Details - Detailed Build Steps - 3. Implement `CurrencyService`; Architecture Blueprint - Modules / Packages (`src/services/currencyService.ts`); Error & Edge‑Case Strategy; Logging & Observability; Security & Config
  - **Action:**
    1. Create `src/services/currencyService.ts` and implement the `ICurrencyService` interface.
    2. Implement `createMoney`, `convertToTime`, `formatMoney`, `getCurrencyCode`, and `getAmount` methods using `money.js`.
    3. Implement error handling (wrap library calls in `try...catch`, log errors), input validation (e.g., for `numericStringValue`, `currencyCode`), and specific logic for zero wage or different currencies in `convertToTime` (return `null`).
  - **Done‑when:**
    1. All `ICurrencyService` methods are implemented correctly according to their specifications.
    2. `createMoney` returns `IMoneyObject` or `null` for invalid inputs.
    3. `convertToTime` returns `ITimeBreakdown` or `null` if conversion is not possible (different currencies without FX rates, zero wage), logging reasons.
    4. Library errors are caught, logged centrally, and appropriate `null` or default values are returned.
    5. Logging for `CurrencyService.createMoney` and `CurrencyService.convertToTime` (DEBUG, WARN, INFO, ERROR events) is implemented as per "Logging & Observability".
    6. Input validation for `numericStringValue` and `currencyCode` in `createMoney` is performed.
  - **Depends‑on:** [T002]

- [x] **T006 · Test · P1: write unit tests for `CurrencyService`**
  - **Context:** Plan Details - Detailed Build Steps - 8. Testing; Testing Strategy - Unit Tests (`CurrencyService`)
  - **Action:**
    1. Create unit tests for `CurrencyService` in a new test file (e.g., `src/services/currencyService.test.ts`).
    2. Test all `ICurrencyService` methods: `createMoney` (valid/invalid inputs), `convertToTime` (same currency, different currencies - expecting `null`, zero wage), `formatMoney`, `getCurrencyCode`, `getAmount`.
    3. Do not mock `money.js`; test the integration with the actual library.
  - **Done‑when:**
    1. Unit tests achieve >90% coverage for `CurrencyService`.
    2. Tests verify correct monetary calculations, object creation/manipulation, error handling, and logging/return values for edge cases.
    3. Edge cases outlined in "Coverage Targets & Edge‑Case Notes" are covered.
  - **Depends‑on:** [T005]

## Core Logic Refactoring

- [x] **T007 · Refactor · P1: refactor `src/utils/converter.ts` to use new services**

  - **Context:** Plan Details - Detailed Build Steps - 4. Refactor `src/utils/converter.ts`; Error & Edge‑Case Strategy; Logging & Observability; Security & Config
  - **Action:**
    1. Modify `converter.ts` to be instantiated with or otherwise receive `IRecognitionService` and `ICurrencyService` instances.
    2. Rewrite the core price conversion logic (e.g., in a function like `generateTimeRepresentationForTextNode`) to use `IRecognitionService.extractCurrencies`, then for each result, use `ICurrencyService.createMoney` for both price and wage (retrieving wage settings from `settingsManager.ts`), and finally `ICurrencyService.convertToTime`.
    3. Remove all old regex-based price parsing logic from `converter.ts`.
  - **Done‑when:**
    1. `converter.ts` correctly orchestrates `IRecognitionService` and `ICurrencyService` for price-to-time conversion.
    2. Old regex-based price parsing logic is completely removed.
    3. Handles cases where services return empty results or `null` gracefully (e.g., by not attempting further conversion for that price).
    4. Logging for `utils/converter.ts` (INFO events) is implemented as per "Logging & Observability".
    5. User-configured wage settings (amount and currency) from `settingsManager.ts` are validated before being used to create the wage `IMoneyObject`.
    6. Existing time formatting logic (e.g., `formatTimeSnippet`) is retained and used for `ITimeBreakdown` objects.
  - **Depends‑on:** [T003, T005]

- [ ] **T008 · Test · P1: update unit tests for refactored `src/utils/converter.ts`**

  - **Context:** Plan Details - Detailed Build Steps - 8. Testing; Testing Strategy - Unit Tests (`converter.ts`)
  - **Action:**
    1. Update or rewrite unit tests for `converter.ts`.
    2. Mock `IRecognitionService`, `ICurrencyService`, and `settingsManager.ts` interfaces to test the orchestration logic.
    3. Test various scenarios: successful conversion, no price found by `IRecognitionService`, `ICurrencyService` returning `null` for money object creation or `convertToTime`.
  - **Done‑when:**
    1. Unit tests for `converter.ts` are updated and pass, covering its orchestration responsibilities.
    2. Interactions with mocked services and `settingsManager.ts` are thoroughly tested.
    3. Time formatting functions are tested directly if their logic is significant.
  - **Depends‑on:** [T007]

- [ ] **T009 · Refactor · P1: refactor `src/content/priceFinder.ts`**
  - **Context:** Plan Details - Detailed Build Steps - 5. Refactor `src/content/priceFinder.ts`; Error & Edge‑Case Strategy (Culture/Locale)
  - **Action:**
    1. Simplify `priceFinder.ts` to focus on identifying relevant DOM text nodes that might contain prices.
    2. Modify it to determine the appropriate culture string (from user settings, default, or browser locale as per plan) and pass the raw text content along with this culture to the refactored `converter.ts` (or its orchestrating function).
    3. Remove any complex regex generation or direct price pattern matching from `priceFinder.ts`.
  - **Done‑when:**
    1. `priceFinder.ts` correctly identifies potential price-containing text nodes.
    2. Raw text content and the determined culture string are passed to the downstream conversion logic.
    3. Old complex regex generation for price patterns is removed.
  - **Depends‑on:** [T007]

## Integration and Cleanup

- [ ] **T010 · Chore · P2: update `src/content/index.ts` (or equivalent entry point)**

  - **Context:** Plan Details - Detailed Build Steps - 6. Update `src/content/index.ts`
  - **Action:**
    1. Ensure `RecognitionService` and `CurrencyService` are instantiated in the main content script entry point.
    2. Provide/inject these service instances to the refactored `converter.ts` and/or the main DOM processing logic that utilizes `priceFinder.ts`.
  - **Done‑when:**
    1. Services are correctly instantiated and made available to dependent modules.
    2. The application initializes without errors related to service provisioning or DI.
  - **Depends‑on:** [T003, T005, T007, T009]

- [ ] **T011 · Chore · P3: remove old regex constants from `src/utils/constants.js`**

  - **Context:** Plan Details - Detailed Build Steps - 7. Update `src/utils/constants.js`
  - **Action:**
    1. Identify and remove any constants from `src/utils/constants.js` (or equivalent files) that were related to the old manual regex patterns for currency/numbers if they are fully replaced.
  - **Done‑when:**
    1. Obsolete regex-related constants are removed.
    2. Project builds and runs correctly without these constants.
  - **Depends‑on:** [T007, T009]

- [ ] **T012 · Test · P2: update integration/DOM tests for `priceFinder.ts` and `domModifier.ts`**
  - **Context:** Plan Details - Detailed Build Steps - 8. Testing; Testing Strategy - Integration Tests
  - **Action:**
    1. Update existing integration/DOM tests that cover the flow from `priceFinder.ts` identifying elements, through `converter.ts` processing, to `domModifier.ts` updating the DOM.
    2. Mock service interfaces (`IRecognitionService`, `ICurrencyService`) or the refactored `converter.ts` to provide controlled data and verify interactions.
  - **Done‑when:**
    1. Integration tests are updated to reflect the new data flow and pass.
    2. Interactions between `priceFinder.ts`, `converter.ts` (or its mocked behavior), and `domModifier.ts` are verified.
  - **Verification:**
    1. Manually verify on a sample page that price finding, conversion, and DOM modification work as expected with the refactored logic.
  - **Depends‑on:** [T009]

## Documentation and Finalization

- [ ] **T013 · Chore · P2: add JSDoc comments to new/refactored modules and interfaces**

  - **Context:** Plan Details - Detailed Build Steps - 9. Documentation & Cleanup; Documentation - Code Self‑Doc Patterns
  - **Action:**
    1. Add JSDoc comments to all newly defined public interfaces in `src/types/money.ts` (`IExtractedCurrency`, etc.).
    2. Add JSDoc comments to all public methods in `RecognitionService` and `CurrencyService`.
    3. Add JSDoc comments to major refactored functions in `converter.ts`, explaining logic, parameters, return values, and error handling.
  - **Done‑when:**
    1. All specified interfaces, service methods, and major refactored functions have comprehensive JSDoc comments.
  - **Depends‑on:** [T002, T003, T005, T007]

- [ ] **T014 · Chore · P3: run linters and formatters on all changed code**

  - **Context:** Plan Details - Detailed Build Steps - 9. Documentation & Cleanup
  - **Action:**
    1. Run the project's linting (e.g., ESLint) and formatting (e.g., Prettier) tools across the codebase.
    2. Fix any reported issues in the new or refactored code.
  - **Done‑when:**
    1. Linters and formatters pass without errors for all new/modified files.
  - **Depends‑on:** [T013]

- [ ] **T015 · Chore · P3: review and remove dead code from old implementation**

  - **Context:** Plan Details - Detailed Build Steps - 9. Documentation & Cleanup
  - **Action:**
    1. Review the codebase for any functions, variables, or files related to the old price parsing and currency handling logic that are no longer used after the refactor.
    2. Remove identified dead code.
  - **Done‑when:**
    1. All unused code from the previous implementation related to price detection and currency handling is removed.
    2. Project builds and all tests pass after removal.
  - **Depends‑on:** [T011, T012, T014]

- [ ] **T016 · Chore · P3: update `README.md` and `CHANGELOG.md`**

  - **Context:** Plan Details - Documentation - Any required readme or openapi updates
  - **Action:**
    1. Update `README.md` to mention the use of `MS Recognizers.Text` and `Money.js` for improved accuracy and handling.
    2. Update `CHANGELOG.md` with details of this refactor.
  - **Done‑when:**
    1. `README.md` reflects the new dependencies and architectural changes.
    2. `CHANGELOG.md` includes an entry for this refactor.
  - **Depends‑on:** [T015]

- [ ] **T017 · Test · P2: run existing End-to-End (E2E) tests**

  - **Context:** Plan Details - Testing Strategy - End-to-End (E2E) Tests
  - **Action:**
    1. Execute the full suite of existing E2E tests, if any.
    2. Investigate and fix any regressions found that are related to this refactor.
  - **Done‑when:**
    1. All existing E2E tests pass, or any failures are understood and determined to be unrelated or new issues are created.
  - **Verification:**
    1. If E2E tests are limited, manually verify the extension's core functionality on a few diverse sample web pages.
  - **Depends‑on:** [T012, T010]

- [ ] **T018 · Chore · P2: benchmark key flows and profile extension performance**
  - **Context:** Plan Details - Risk Matrix (Performance degradation)
  - **Action:**
    1. Benchmark key flows (e.g., time from page load to prices converted) before (if a baseline exists) and after the refactor.
    2. Profile the extension's performance on complex web pages, paying attention to DOM traversal and calls to the new services.
  - **Done‑when:**
    1. Performance data for key flows is collected and documented.
    2. Any significant performance regressions are identified and documented for potential follow-up optimization tasks.
  - **Depends‑on:** [T017]

### Clarifications & Assumptions

- [ ] **Issue:** Confirm strategy for sourcing the `culture` string for `RecognitionService`.
  - **Context:** PLAN.md > Error & Edge‑Case Strategy (Culture/Locale) states: "This will initially be sourced from user settings or a sensible default (e.g., "en-US"), falling back to browser locale if robustly detectable."
  - **Blocking?:** no (Task T009 assumes `priceFinder.ts` or `converter.ts` will handle this sourcing logic.)
- [ ] **Issue:** The Risk Matrix for "Performance degradation" has a mitigation strategy that is cut off: "...Optimize DOM traversal to minimize calls to `RecognitionService`. Consider debounc/thrott".
  - **Context:** PLAN.md > Risk Matrix
  - **Blocking?:** no (Task T018 covers benchmarking and profiling. Optimization tasks would be separate, based on findings from T018, and are not part of this plan's direct build steps.)
