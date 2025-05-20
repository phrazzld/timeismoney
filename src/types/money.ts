/**
 * Core interfaces and types for currency and money handling.
 * Provides contracts for recognition services and currency operations.
 * These interfaces form the foundation of the service-based architecture
 * for currency detection and time conversion.
 * 
 * @module types/money
 */

/**
 * Represents extracted currency information from text.
 * Contains both the original text and normalized currency data.
 * This is the output format from the RecognitionService after 
 * processing text with Microsoft Recognizers Text.
 * 
 * @example
 * // Example of extracted currency from "$19.99 for the item"
 * {
 *   text: "$19.99",
 *   value: "19.99",
 *   unit: "$",
 *   isoCurrency: "USD",
 *   culture: "en-US",
 *   start: 0,
 *   end: 6
 * }
 */
export interface IExtractedCurrency {
  /** The matched text exactly as found in the source (e.g., "$19.99", "20 EUR") */
  text: string;
  /** Normalized numeric string value with all formatting removed (e.g., "19.99", "20") */
  value: string;
  /** Recognized currency unit/symbol as found in the text (e.g., "Dollar", "EUR", "$", "€") */
  unit: string;
  /** Resolved ISO 4217 currency code for standardized processing (e.g., "USD", "EUR") */
  isoCurrency: string;
  /** Culture/locale used for recognition, affects currency interpretation (e.g., "en-US", "de-DE") */
  culture: string;
  /** Start index (position) of the currency mention in the input text */
  start: number;
  /** End index (position) of the currency mention in the input text */
  end: number;
}

/**
 * Opaque type for Money.js objects to enforce usage via ICurrencyService.
 * Internal structure should not be accessed directly by consuming code.
 * This abstraction allows the implementation details of monetary values
 * to be hidden and potentially changed without affecting client code.
 * 
 * Always use the ICurrencyService methods to interact with this type.
 */
export type IMoneyObject = unknown;

/**
 * Represents a time duration broken down into hours and minutes.
 * Used for displaying price in terms of work time (how long someone
 * needs to work to earn the equivalent of a price).
 * 
 * @example
 * // 2 hours and 30 minutes of work time
 * {
 *   hours: 2,
 *   minutes: 30
 * }
 */
export interface ITimeBreakdown {
  /** Number of whole hours in the time duration */
  hours: number;
  /** Number of remaining minutes in the time duration (0-59) */
  minutes: number;
}

/**
 * Contract for the Microsoft Recognizers.Text currency recognition service.
 * Handles extraction of currency mentions from plain text by leveraging
 * the Microsoft Recognizers Text library to identify and normalize
 * currency values across different formats and locales.
 * 
 * Implementations should handle parsing edge cases, errors, and
 * provide consistent output for different text inputs.
 */
export interface IRecognitionService {
  /**
   * Extracts all currency mentions from a given text string.
   * Processes the input text to identify and normalize any currency values,
   * using the specified culture to guide recognition patterns.
   *
   * @param text - The text to analyze for currency mentions
   * @param culture - The culture/locale code (e.g., "en-US", "de-DE") to guide recognition
   * @returns An array of extracted currency information objects, or an empty array if none found or on error
   * 
   * @example
   * // Extract currencies from text with en-US culture
   * const currencies = recognitionService.extractCurrencies(
   *   "The item costs $19.99 or €15.00",
   *   "en-US"
   * );
   * // Returns array with information about the $19.99 and €15.00 mentions
   */
  extractCurrencies(text: string, culture: string): IExtractedCurrency[];
}

/**
 * Contract for the Money.js currency service.
 * Handles creation, manipulation, and conversion of monetary values
 * using the Money.js library as the underlying implementation.
 * 
 * Provides a consistent interface for monetary operations including
 * creating money objects, converting between currencies, formatting
 * for display, and converting monetary values to time representations.
 */
export interface ICurrencyService {
  /**
   * Creates a money object from a numeric string value and ISO currency code.
   * Validates and normalizes the inputs before creating a standardized
   * representation of the monetary value.
   *
   * @param numericStringValue - The numeric value as a string (e.g., "19.99")
   * @param currencyCode - ISO 4217 currency code (e.g., "USD")
   * @returns An IMoneyObject for valid inputs, or null if creation fails due to invalid inputs or errors
   * 
   * @example
   * // Create a USD money object
   * const money = currencyService.createMoney("19.99", "USD");
   */
  createMoney(numericStringValue: string, currencyCode: string): IMoneyObject | null;

  /**
   * Converts a price (IMoneyObject) into a duration of work, given an hourly wage (IMoneyObject).
   * Calculates how long someone would need to work at the given hourly wage
   * to earn the equivalent of the price.
   * 
   * Returns null if conversion is not possible (e.g., different currencies without exchange rates, zero wage).
   * Money.js fx rates are assumed to be NOT configured for this initial refactor unless specified.
   *
   * @param price - The monetary price to convert to equivalent working time
   * @param hourlyWage - The hourly wage to use for the calculation
   * @returns Time breakdown with hours and minutes, or null if conversion is not possible
   * 
   * @example
   * // Convert $50 to time with $10/hour wage
   * const price = currencyService.createMoney("50", "USD");
   * const wage = currencyService.createMoney("10", "USD");
   * const time = currencyService.convertToTime(price, wage);
   * // Returns { hours: 5, minutes: 0 }
   */
  convertToTime(price: IMoneyObject, hourlyWage: IMoneyObject): ITimeBreakdown | null;

  /**
   * Formats an IMoneyObject into a string representation for display.
   * May not be strictly needed if Recognizers.Text provides good original text,
   * but useful for consistent display of wage or intermediate values.
   *
   * @param money - The money object to format
   * @param options - Optional formatting options (currency symbols, decimal places, etc.)
   * @returns Formatted string representation (e.g., "$19.99", "15,00 €")
   * 
   * @example
   * // Format a USD money object
   * const money = currencyService.createMoney("19.99", "USD");
   * const formatted = currencyService.formatMoney(money);
   * // Returns "$19.99"
   */
  formatMoney(money: IMoneyObject, options?: object): string;

  /**
   * Gets the ISO currency code from an IMoneyObject.
   * Extracts the standardized currency identifier from the money object.
   *
   * @param money - The money object to extract currency code from
   * @returns ISO 4217 currency code (e.g., "USD", "EUR") or null if extraction fails
   * 
   * @example
   * // Get currency code from a money object
   * const money = currencyService.createMoney("19.99", "USD");
   * const code = currencyService.getCurrencyCode(money);
   * // Returns "USD"
   */
  getCurrencyCode(money: IMoneyObject): string | null;

  /**
   * Gets the amount from an IMoneyObject as a number.
   * Extracts the numeric value from the money object.
   *
   * @param money - The money object to extract amount from
   * @returns Numeric amount (e.g., 19.99) or null if extraction fails
   * 
   * @example
   * // Get amount from a money object
   * const money = currencyService.createMoney("19.99", "USD");
   * const amount = currencyService.getAmount(money);
   * // Returns 19.99
   */
  getAmount(money: IMoneyObject): number | null;
}