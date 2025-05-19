# Plan: Refactor Price Detection and Currency Handling

## Chosen Approach (One‑liner)

Introduce `Microsoft.Recognizers.Text` for robust currency entity extraction and `Money.js` for precise monetary value representation and arithmetic by creating dedicated, testable adapter services, and refactor existing price finding and conversion logic to utilize these services.

## Architecture Blueprint

- **Modules / Packages**

  - `src/services/recognitionService.ts`
    - Responsibility: Adapts `@microsoft/recognizers-text-suite` (specifically currency recognizer) for extracting structured currency information from text. Handles recognizer initialization, culture configuration, and result transformation into a defined `IExtractedCurrency` interface.
  - `src/services/currencyService.ts`
    - Responsibility: Adapts `money.js` for creating, manipulating, and performing arithmetic on monetary values. Provides a consistent interface (`ICurrencyService`) for working with money objects (`IMoneyObject`) and converting prices to time.
  - `src/types/money.ts` (or `src/interfaces/`)
    - Responsibility: Defines core data structures and interfaces like `IExtractedCurrency`, `IMoneyObject`, `ITimeBreakdown`.
  - `src/content/priceFinder.ts` (Refactored)
    - Responsibility: Identifies potential price-containing text nodes in the DOM. Delegates the detailed parsing of these text strings to `IRecognitionService`.
  - `src/utils/converter.ts` (Refactored)
    - Responsibility: Orchestrates the conversion of a recognized price to a time string. Uses `IRecognitionService` to parse price strings, `ICurrencyService` to create money objects for price and wage, and `ICurrencyService` to calculate time. Retains time formatting logic.
  - `src/content/settingsManager.ts` (Existing, Utilized)
    - Responsibility: Provides user settings, including hourly wage (amount and currency) and potentially preferred locale/culture for recognition.
  - `src/content/domModifier.ts` (Existing, Utilized)
    - Responsibility: Modifies the DOM to display converted prices. Its input will be the formatted time string.

- **Public Interfaces / Contracts**

  ```typescript
  // src/types/money.ts

  export interface IExtractedCurrency {
    text: string; // The matched text (e.g., "$19.99", "20 EUR")
    value: string; // Normalized numeric string value (e.g., "19.99", "20")
    unit: string; // Recognized currency unit/symbol (e.g., "Dollar", "EUR", "$", "€")
    isoCurrency: string; // Resolved ISO 4217 currency code (e.g., "USD", "EUR")
    culture: string; // Culture used for recognition (e.g., "en-US")
    start: number; // Start index in the input text
    end: number; // End index in the input text
  }

  // Opaque type for Money.js objects to enforce usage via ICurrencyService
  export type IMoneyObject = unknown;

  export interface ITimeBreakdown {
    hours: number;
    minutes: number;
    // Potentially seconds, or a total in a specific unit
  }

  // src/services/recognitionService.ts
  export interface IRecognitionService {
    /**
     * Extracts all currency mentions from a given text string.
     * @param text The text to analyze.
     *   @param culture The culture code (e.g., "en-US", "de-DE") to guide recognition.
     * @returns An array of extracted currency information.
     */
    extractCurrencies(text: string, culture: string): IExtractedCurrency[];
  }

  // src/services/currencyService.ts
  export interface ICurrencyService {
    /**
     * Creates a money object from a numeric string value and ISO currency code.
     * @param numericStringValue The numeric value as a string (e.g., "19.99").
     * @param currencyCode ISO 4217 currency code (e.g., "USD").
     * @returns An IMoneyObject or null if creation fails.
     */
    createMoney(numericStringValue: string, currencyCode: string): IMoneyObject | null;

    /**
     * Converts a price (IMoneyObject) into a duration of work, given an hourly wage (IMoneyObject).
     * Returns null if conversion is not possible (e.g., different currencies without exchange rates, zero wage).
     * Money.js fx rates are assumed to be NOT configured for this initial refactor unless specified.
     */
    convertToTime(price: IMoneyObject, hourlyWage: IMoneyObject): ITimeBreakdown | null;

    /**
     * Formats an IMoneyObject into a string representation.
     * (May not be strictly needed if Recognizers.Text provides good original text,
     * but useful for consistent display of wage or intermediate values).
     */
    formatMoney(money: IMoneyObject, options?: object): string;

    /**
     * Gets the ISO currency code from an IMoneyObject.
     */
    getCurrencyCode(money: IMoneyObject): string | null;

    /**
     * Gets the amount from an IMoneyObject as a number.
     */
    getAmount(money: IMoneyObject): number | null;
  }
  ```

- **Data Flow Diagram** (Mermaid)

  ```mermaid
  graph TD
      A[DOM Text Node] --> PF[priceFinder.ts];
      PF -- Raw Text & Culture --> RS[IRecognitionService];
      RS -- IExtractedCurrency[] --> CONV[utils/converter.ts];

      SM[settingsManager.ts] -- Wage Amount & Currency --> CONV;
      CONV -- Extracted Value & ISO Code --> CS[ICurrencyService: createMoney as PriceObject];
      CONV -- Wage Value & ISO Code --> CS2[ICurrencyService: createMoney as WageObject];

      CS -- PriceObject (IMoneyObject) --> CONV;
      CS2 -- WageObject (IMoneyObject) --> CONV;

      CONV -- PriceObject, WageObject --> CS3[ICurrencyService: convertToTime];
      CS3 -- ITimeBreakdown | null --> CONV;
      CONV -- Formats ITimeBreakdown --> FS[Formatted Time String];
      FS --> DM[domModifier.ts];
      DM -- Updates --> DOM;
  ```

- **Error & Edge‑Case Strategy**
  - **Library Errors:** Calls to `MS Recognizers.Text` and `Money.js` within adapter services (`RecognitionService`, `CurrencyService`) will be wrapped in `try...catch` blocks. Errors will be logged centrally and result in `null` or empty array returns to the caller, preventing crashes.
  - **No Recognition:** If `IRecognitionService` finds no currency, it returns an empty array. `converter.ts` will handle this by not attempting conversion.
  - **Invalid Input to Services:** Services will perform basic validation. E.g., `CurrencyService.createMoney` returns `null` for invalid numeric strings or unsupported currency codes.
  - **Currency Conversion Failure:** `CurrencyService.convertToTime` will return `null` if `price` and `wage` are in different currencies and exchange rates are not configured/available in `Money.js` (default assumption for this task), or if the wage is zero. This failure will be logged.
  - **Zero Wage:** `CurrencyService.convertToTime` will handle division by zero (or zero wage) gracefully, returning `null` and logging a warning.
  - **Culture/Locale:** `RecognitionService` will require a culture string. This will initially be sourced from user settings or a sensible default (e.g., "en-US"), falling back to browser locale if robustly detectable.

## Detailed Build Steps

1.  **Setup & Installation:**
    - Install packages: `pnpm add @microsoft/recognizers-text-suite money`.
    - Define interfaces (`IExtractedCurrency`, `IMoneyObject`, `ITimeBreakdown`, `IRecognitionService`, `ICurrencyService`) in `src/types/money.ts` (or a similar new interfaces file).
2.  **Implement `RecognitionService`:**
    - Create `src/services/recognitionService.ts`.
    - Implement `IRecognitionService.extractCurrencies` using `@microsoft/recognizers-text-suite` (specifically `recognizeCurrency`).
    - Map recognizer results to the `IExtractedCurrency` interface. Handle cases where multiple currencies might be found.
    - Include error handling and logging.
3.  **Implement `CurrencyService`:**
    - Create `src/services/currencyService.ts`.
    - Implement `ICurrencyService.createMoney` using `new Money()`. Ensure robust parsing of `numericStringValue`.
    - Implement `ICurrencyService.convertToTime`.
      - Retrieve amounts and currencies from `IMoneyObject`s.
      - If currencies differ and no exchange rates are configured in `Money.js` (current assumption), return `null` and log.
      - If currencies are the same, perform `priceAmount / wageAmount` to get hours. Handle zero wage.
      - Convert total hours to `ITimeBreakdown { hours, minutes }`.
    - Implement `ICurrencyService.formatMoney` (wrapper around `Money.js` formatting).
    - Implement `ICurrencyService.getCurrencyCode` and `ICurrencyService.getAmount`.
    - Include error handling and logging.
4.  **Refactor `src/utils/converter.ts`:**
    - Inject/Instantiate `IRecognitionService` and `ICurrencyService`.
    - Modify core price conversion logic (e.g., a function like `generateTimeRepresentationForTextNode`):
      - Call `IRecognitionService.extractCurrencies` on input text.
      - For each `IExtractedCurrency`:
        - Call `ICurrencyService.createMoney` for the extracted price.
        - Retrieve wage settings (amount, currency) from `settingsManager.ts`.
        - Call `ICurrencyService.createMoney` for the wage.
        - If price and wage objects are created successfully, call `ICurrencyService.convertToTime`.
        - If `ITimeBreakdown` is returned, use existing time formatting functions (e.g., `formatTimeSnippet`) to create the display string.
    - Remove old regex-based price parsing logic.
5.  **Refactor `src/content/priceFinder.ts`:**
    - Simplify `priceFinder` to focus on identifying relevant text nodes.
    - It will now pass raw text content (and determined culture) from these nodes to the refactored `converter.ts` function or directly to `IRecognitionService` if `converter.ts` orchestrates less.
    - Remove complex regex generation for price patterns.
6.  **Update `src/content/index.ts` (or equivalent entry point):**
    - Ensure new services (`RecognitionService`, `CurrencyService`) are instantiated and provided/injected where needed (e.g., to the refactored `converter.ts` or the DOM processing logic).
7.  **Update `src/utils/constants.js`:**
    - Remove constants related to old manual regex patterns for currency/numbers if they are fully replaced.
8.  **Testing:**
    - Write unit tests for `RecognitionService`, testing its interaction with `MS Recognizers.Text` using various inputs and cultures.
    - Write unit tests for `CurrencyService`, testing its interaction with `Money.js` (creation, `convertToTime` with same/different currencies without rates, zero wage, formatting).
    - Update/rewrite unit tests for `converter.ts`, mocking `IRecognitionService` and `ICurrencyService` interfaces to test its orchestration logic.
    - Update integration/DOM tests for `priceFinder.ts` and `domModifier.ts` to reflect the new data flow, mocking service interfaces as needed.
    - Ensure all tests pass and coverage targets are met.
9.  **Documentation & Cleanup:**
    - Add JSDoc comments to new/refactored modules, interfaces, and complex functions.
    - Run linters and formatters.
    - Review and remove any dead code from the old implementation.

## Testing Strategy

- **Test Layers:**
  - **Unit Tests:**
    - `RecognitionService`: Test with various text inputs (different currencies, formats, multiple prices, no prices) and cultures. **Do not mock `MS Recognizers.Text` library itself; test the integration.**
    - `CurrencyService`: Test `createMoney` with valid/invalid inputs, `convertToTime` (same currency, different currencies - expecting null due to no fx rates, zero wage), `formatMoney`. **Do not mock `Money.js` library itself; test the integration.**
    - `converter.ts` (refactored logic): Mock `IRecognitionService` and `ICurrencyService` interfaces to test the orchestration and decision-making logic. Test time formatting functions directly.
  - **Integration Tests:**
    - Test the flow from `priceFinder.ts` through `converter.ts` to `domModifier.ts`. Mock service interfaces (`IRecognitionService`, `ICurrencyService`) to provide controlled data and verify interactions.
    - Focus on how modules collaborate using the defined interfaces.
  - **End-to-End (E2E) Tests:** (Existing E2E tests, if any, should be run to catch regressions). Verify the extension correctly identifies, converts, and displays prices on sample web pages.
- **What to Mock:**
  - **Service Interfaces (`IRecognitionService`, `ICurrencyService`):** Mock these when testing modules that _consume_ them (e.g., `converter.ts`, higher-level content script logic). This isolates the consumer's logic from the service implementation.
  - **External Dependencies (Chrome APIs, DOM):** Continue mocking `chrome.*` APIs and browser DOM elements/APIs as per existing strategy for tests that interact with them.
  - **Do NOT mock `MS Recognizers.Text` or `Money.js` within the unit tests for their respective adapter services.** The purpose of those service unit tests is to verify correct integration with these libraries.
- **Coverage Targets & Edge‑Case Notes:**
  - Aim for >90% unit test coverage for new services (`RecognitionService`, `CurrencyService`).
  - Maintain overall project coverage targets.
  - Cover edge cases: empty strings, non-currency text, multiple currencies in one string, various international formats, zero/negative values (if applicable for recognizers), zero wage, prices in currencies different from wage currency.

## Logging & Observability

- **Log Events + Structured Fields:**
  - `RecognitionService.extractCurrencies`:
    - `DEBUG`: Input text, culture.
    - `DEBUG`: Successfully extracted currencies (count, details of each `IExtractedCurrency`).
    - `WARN`: If recognition returns unexpected results or partial failures.
    - `ERROR`: On exceptions during recognition, with error details.
  - `CurrencyService.createMoney`:
    - `DEBUG`: Input value, currency code.
    - `DEBUG`: Successfully created `IMoneyObject`.
    - `WARN`: Failed to create `IMoneyObject` (e.g., invalid input), with reason.
  - `CurrencyService.convertToTime`:
    - `DEBUG`: Input price `IMoneyObject`, wage `IMoneyObject`.
    - `DEBUG`: Successfully converted to `ITimeBreakdown`.
    - `INFO`/`WARN`: Conversion not possible (e.g., different currencies without rates, zero wage), with reason.
    - `ERROR`: On exceptions during conversion.
  - `utils/converter.ts`:
    - `INFO`: Price found and conversion attempt initiated.
    - `INFO`: Successfully converted price to time string.
- **Correlation ID Propagation:** Not currently in scope but design services to allow future introduction if needed.

## Security & Config

- **Input Validation Hotspots:**
  - Text input to `IRecognitionService.extractCurrencies`: While `MS Recognizers.Text` is robust, ensure inputs are strings.
  - String values for amounts and currency codes passed to `ICurrencyService.createMoney`.
  - User-configured wage settings (amount, currency code) from `settingsManager.ts` should be validated before use.
- **Secrets Handling:** No secrets are involved in this refactor.
- **Least‑Privilege Notes:** No changes to extension permissions are anticipated.

## Documentation

- **Code Self‑Doc Patterns:**
  - JSDoc for all public interfaces (`IExtractedCurrency`, `IMoneyObject`, `ITimeBreakdown`, `IRecognitionService`, `ICurrencyService`).
  - JSDoc for public methods in services and major refactored functions in `converter.ts`, explaining logic, parameters, return values, and error handling.
  - Comments for complex or non-obvious logic sections.
- **Any required readme or openapi updates:**
  - Update `README.md` to mention the use of `MS Recognizers.Text` and `Money.js` for improved accuracy and handling.
  - Update `CHANGELOG.md` with details of the refactor.

## Risk Matrix

| Risk                                         | Severity | Mitigation                                                                                                                                                         |
| :------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance degradation due to new libraries | High     | Benchmark key flows before/after. Profile extension on complex pages. Optimize DOM traversal to minimize calls to `RecognitionService`. Consider debouncing/thrott |
