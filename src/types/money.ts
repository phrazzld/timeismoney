/**
 * Core interfaces and types for currency and money handling
 * Provides contracts for recognition services and currency operations
 * 
 * @module types/money
 */

/**
 * Represents extracted currency information from text
 * Contains both the original text and normalized currency data
 */
export interface IExtractedCurrency {
  /** The matched text (e.g., "$19.99", "20 EUR") */
  text: string;
  /** Normalized numeric string value (e.g., "19.99", "20") */
  value: string;
  /** Recognized currency unit/symbol (e.g., "Dollar", "EUR", "$", "€") */
  unit: string;
  /** Resolved ISO 4217 currency code (e.g., "USD", "EUR") */
  isoCurrency: string;
  /** Culture used for recognition (e.g., "en-US") */
  culture: string;
  /** Start index in the input text */
  start: number;
  /** End index in the input text */
  end: number;
}

/**
 * Opaque type for Money.js objects to enforce usage via ICurrencyService
 * Internal structure should not be accessed directly
 */
export type IMoneyObject = unknown;

/**
 * Represents a time duration broken down into hours and minutes
 * Used for displaying price in terms of work time
 */
export interface ITimeBreakdown {
  /** Number of hours */
  hours: number;
  /** Number of minutes (0-59) */
  minutes: number;
}

/**
 * Contract for the Microsoft Recognizers.Text currency recognition service
 * Handles extraction of currency mentions from plain text
 */
export interface IRecognitionService {
  /**
   * Extracts all currency mentions from a given text string
   *
   * @param text The text to analyze for currency mentions
   * @param culture The culture code (e.g., "en-US", "de-DE") to guide recognition
   * @returns An array of extracted currency information, empty if none found
   */
  extractCurrencies(text: string, culture: string): IExtractedCurrency[];
}

/**
 * Contract for the Money.js currency service
 * Handles creation, manipulation, and conversion of monetary values
 */
export interface ICurrencyService {
  /**
   * Creates a money object from a numeric string value and ISO currency code
   *
   * @param numericStringValue The numeric value as a string (e.g., "19.99")
   * @param currencyCode ISO 4217 currency code (e.g., "USD")
   * @returns An IMoneyObject or null if creation fails
   */
  createMoney(numericStringValue: string, currencyCode: string): IMoneyObject | null;

  /**
   * Converts a price (IMoneyObject) into a duration of work, given an hourly wage (IMoneyObject)
   * Returns null if conversion is not possible (e.g., different currencies without exchange rates, zero wage)
   * Money.js fx rates are assumed to be NOT configured for this initial refactor unless specified
   *
   * @param price The price to convert to time
   * @param hourlyWage The hourly wage to use for calculation
   * @returns Time breakdown or null if conversion is not possible
   */
  convertToTime(price: IMoneyObject, hourlyWage: IMoneyObject): ITimeBreakdown | null;

  /**
   * Formats an IMoneyObject into a string representation
   * May not be strictly needed if Recognizers.Text provides good original text,
   * but useful for consistent display of wage or intermediate values
   *
   * @param money The money object to format
   * @param options Optional formatting options
   * @returns Formatted string representation
   */
  formatMoney(money: IMoneyObject, options?: object): string;

  /**
   * Gets the ISO currency code from an IMoneyObject
   *
   * @param money The money object to extract currency from
   * @returns ISO currency code or null if extraction fails
   */
  getCurrencyCode(money: IMoneyObject): string | null;

  /**
   * Gets the amount from an IMoneyObject as a number
   *
   * @param money The money object to extract amount from
   * @returns Numeric amount or null if extraction fails
   */
  getAmount(money: IMoneyObject): number | null;
}