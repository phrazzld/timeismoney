/**
 * Currency service for monetary value representation and calculations.
 * Adapts Money.js for consistent handling of currency operations and price-to-time conversions.
 *
 * This service provides standardized interfaces for creating, manipulating, and converting
 * monetary values, with consistent error handling and validation.
 *
 * @module services/currencyService
 */

import fx from 'money';
import { debug, warn, error } from '../utils/logger.js';

/**
 * Implementation of ICurrencyService that adapts Money.js
 * for handling monetary values and time conversions.
 *
 * This class provides a consistent interface for working with monetary values,
 * abstracting away the details of the underlying Money.js library implementation.
 * It handles validation, normalization, and error handling for all operations.
 *
 * @implements {import('../types/money').ICurrencyService}
 */
export class CurrencyService {
  /**
   * Creates a money object from a numeric string value and ISO currency code.
   * Validates and normalizes the inputs before creating a standardized
   * representation of the monetary value.
   *
   * @param {string} numericStringValue - The numeric value as a string (e.g., "19.99")
   * @param {string} currencyCode - ISO 4217 currency code (e.g., "USD")
   * @returns {import('../types/money').IMoneyObject|null} An IMoneyObject for valid inputs, or null if creation fails due to invalid inputs or errors
   *
   * @example
   * // Create a USD money object
   * const money = currencyService.createMoney("19.99", "USD");
   */
  createMoney(numericStringValue, currencyCode) {
    // Input validation
    if (typeof numericStringValue !== 'string' || !numericStringValue.trim()) {
      error('CurrencyService.createMoney: Invalid numericStringValue parameter', {
        numericStringValue,
      });
      return null;
    }

    if (typeof currencyCode !== 'string' || !currencyCode.trim()) {
      error('CurrencyService.createMoney: Invalid currencyCode parameter', { currencyCode });
      return null;
    }

    // Normalize currency code
    const normalizedCurrencyCode = currencyCode.trim().toUpperCase();

    // Validate ISO currency code format (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(normalizedCurrencyCode)) {
      warn('CurrencyService.createMoney: Currency code is not in ISO 4217 format', {
        currencyCode,
      });
      // We'll continue anyway, as Money.js might handle some non-standard codes
    }

    try {
      // Clean numeric string (allow only digits, single decimal point, and negative sign)
      const cleanedValue = numericStringValue.replace(/[^0-9.-]/g, '');

      // Parse the value
      const parsedValue = parseFloat(cleanedValue);

      // Check if the parsed value is a valid number
      if (isNaN(parsedValue)) {
        warn('CurrencyService.createMoney: Could not parse numeric value', {
          numericStringValue,
          cleanedValue,
        });
        return null;
      }

      // Create money object - we'll use a simple object structure conforming to our interface
      // rather than directly using the fx() instance since it has different behavior
      const moneyObject = {
        _type: 'money',
        _value: parsedValue,
        _currency: normalizedCurrencyCode,
      };

      debug('CurrencyService.createMoney: Created money object', {
        value: parsedValue,
        currency: normalizedCurrencyCode,
      });

      return moneyObject;
    } catch (err) {
      error('CurrencyService.createMoney: Error creating money object', {
        error: err.message,
        stack: err.stack,
        numericStringValue,
        currencyCode,
      });
      return null;
    }
  }

  /**
   * Converts a price (IMoneyObject) into a duration of work, given an hourly wage (IMoneyObject).
   * Calculates how long someone would need to work at the given hourly wage
   * to earn the equivalent of the price.
   *
   * This method handles currency matching, currency conversion when possible,
   * and edge cases like zero wage or missing exchange rates.
   *
   * @param {import('../types/money').IMoneyObject} price - The monetary price to convert to equivalent working time
   * @param {import('../types/money').IMoneyObject} hourlyWage - The hourly wage to use for the calculation
   * @returns {import('../types/money').ITimeBreakdown|null} Time breakdown with hours and minutes, or null if conversion is not possible
   *
   * @example
   * // Convert $50 to time with $10/hour wage
   * const price = currencyService.createMoney("50", "USD");
   * const wage = currencyService.createMoney("10", "USD");
   * const time = currencyService.convertToTime(price, wage);
   * // Returns { hours: 5, minutes: 0 }
   */
  convertToTime(price, hourlyWage) {
    // Input validation
    if (!price || !this._isValidMoneyObject(price)) {
      error('CurrencyService.convertToTime: Invalid price parameter', { price });
      return null;
    }

    if (!hourlyWage || !this._isValidMoneyObject(hourlyWage)) {
      error('CurrencyService.convertToTime: Invalid hourlyWage parameter', { hourlyWage });
      return null;
    }

    try {
      const priceAmount = price._value;
      const priceCurrency = price._currency;
      const wageAmount = hourlyWage._value;
      const wageCurrency = hourlyWage._currency;

      // Check for zero wage
      if (wageAmount === 0) {
        warn('CurrencyService.convertToTime: Hourly wage is zero, cannot convert to time', {
          priceAmount,
          priceCurrency,
          wageAmount,
          wageCurrency,
        });
        return null;
      }

      // Check if currencies match
      if (priceCurrency !== wageCurrency) {
        // With different currencies, we need exchange rates
        // Check if money.js has exchange rates set up
        if (!fx.rates || Object.keys(fx.rates).length === 0) {
          warn(
            'CurrencyService.convertToTime: Different currencies but no exchange rates available',
            {
              priceCurrency,
              wageCurrency,
            }
          );
          return null;
        }

        // If we have exchange rates, use money.js to convert
        try {
          // Convert price to wage currency
          const convertedPrice = fx(priceAmount).from(priceCurrency).to(wageCurrency);

          // Calculate hours
          const totalHours = convertedPrice / wageAmount;

          return this._createTimeBreakdown(totalHours);
        } catch (err) {
          warn('CurrencyService.convertToTime: Currency conversion failed', {
            error: err.message,
            priceCurrency,
            wageCurrency,
          });
          return null;
        }
      } else {
        // Same currency, simple division
        const totalHours = priceAmount / wageAmount;

        // Create the time breakdown
        return this._createTimeBreakdown(totalHours);
      }
    } catch (err) {
      error('CurrencyService.convertToTime: Error converting to time', {
        error: err.message,
        stack: err.stack,
        price,
        hourlyWage,
      });
      return null;
    }
  }

  /**
   * Formats an IMoneyObject into a string representation for display.
   * Provides consistent, localized formatting of monetary values with
   * configurable precision and symbol/code display options.
   *
   * @param {import('../types/money').IMoneyObject} money - The money object to format
   * @param {object} [options] - Optional formatting options
   * @param {boolean} [options.showSymbol] - Whether to display currency symbol
   * @param {boolean} [options.showCode] - Whether to display currency code instead of symbol
   * @param {number} [options.precision] - Number of decimal places to show
   * @returns {string} Formatted string representation (e.g., "$19.99", "15,00 €", "19.99 USD")
   *
   * @example
   * // Format with symbol (default)
   * currencyService.formatMoney(money); // Returns "$19.99"
   *
   * // Format with currency code instead of symbol
   * currencyService.formatMoney(money, { showSymbol: false, showCode: true }); // Returns "19.99 USD"
   *
   * // Format with higher precision
   * currencyService.formatMoney(money, { precision: 4 }); // Returns "$19.9900"
   */
  formatMoney(money, options = {}) {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.formatMoney: Invalid money parameter', { money });
      return '';
    }

    try {
      const amount = money._value;
      const currency = money._currency;

      const formatOptions = {
        showSymbol: options.showSymbol ?? true,
        showCode: options.showCode ?? false,
        precision: options.precision ?? 2,
        ...options,
      };

      // Default formatting: 2 decimal places
      let formattedValue = amount.toFixed(formatOptions.precision);

      // Add currency code or symbol
      if (formatOptions.showCode) {
        formattedValue = `${formattedValue} ${currency}`;
      } else if (formatOptions.showSymbol) {
        const symbol = this._getCurrencySymbol(currency);
        formattedValue = `${symbol}${formattedValue}`;
      }

      return formattedValue;
    } catch (err) {
      error('CurrencyService.formatMoney: Error formatting money', {
        error: err.message,
        stack: err.stack,
        money,
      });
      return '';
    }
  }

  /**
   * Gets the ISO currency code from an IMoneyObject.
   * Extracts the standardized currency identifier from the money object.
   *
   * @param {import('../types/money').IMoneyObject} money - The money object to extract currency code from
   * @returns {string|null} ISO 4217 currency code (e.g., "USD", "EUR") or null if extraction fails
   *
   * @example
   * // Get currency code from a money object
   * const code = currencyService.getCurrencyCode(money); // Returns "USD"
   */
  getCurrencyCode(money) {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.getCurrencyCode: Invalid money parameter', { money });
      return null;
    }

    return money._currency;
  }

  /**
   * Gets the amount from an IMoneyObject as a number.
   * Extracts the numeric value from the money object.
   *
   * @param {import('../types/money').IMoneyObject} money - The money object to extract amount from
   * @returns {number|null} Numeric amount (e.g., 19.99) or null if extraction fails
   *
   * @example
   * // Get amount from a money object
   * const amount = currencyService.getAmount(money); // Returns 19.99
   */
  getAmount(money) {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.getAmount: Invalid money parameter', { money });
      return null;
    }

    return money._value;
  }

  /**
   * Validates if an object is a valid money object.
   * Checks that the object has the required properties and types
   * to be a valid IMoneyObject.
   *
   * @private
   * @param {any} obj - The object to validate
   * @returns {boolean} True if the object is a valid money object
   */
  _isValidMoneyObject(obj) {
    return (
      obj &&
      typeof obj === 'object' &&
      obj._type === 'money' &&
      typeof obj._value === 'number' &&
      typeof obj._currency === 'string'
    );
  }

  /**
   * Creates a time breakdown object from total hours.
   * Converts a floating-point hours value into a structured object
   * with separate hours and minutes components, handling rounding
   * and edge cases.
   *
   * @private
   * @param {number} totalHours - Total hours to convert to a breakdown
   * @returns {import('../types/money').ITimeBreakdown} Time breakdown with hours and minutes
   *
   * @example
   * // 2.5 hours becomes { hours: 2, minutes: 30 }
   * _createTimeBreakdown(2.5);
   *
   * // 3.99 hours becomes { hours: 4, minutes: 0 } after rounding
   * _createTimeBreakdown(3.99);
   */
  _createTimeBreakdown(totalHours) {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // Record the start time for performance measurement
    const startTime = performance.now();

    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
      return {
        hours: hours + 1,
        minutes: 0,
        startTime: startTime,
      };
    }

    return {
      hours,
      minutes,
      startTime: startTime,
    };
  }

  /**
   * Gets a currency symbol for a given currency code.
   * Maps ISO 4217 currency codes to their common symbols,
   * falling back to the code itself if no symbol is found.
   *
   * @private
   * @param {string} currencyCode - ISO 4217 currency code
   * @returns {string} Currency symbol or currency code if no symbol found
   *
   * @example
   * _getCurrencySymbol("USD"); // Returns "$"
   * _getCurrencySymbol("EUR"); // Returns "€"
   * _getCurrencySymbol("XYZ"); // Returns "XYZ" (fallback)
   */
  _getCurrencySymbol(currencyCode) {
    const symbolMap = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'Fr',
      INR: '₹',
      NZD: 'NZ$',
      ZAR: 'R',
      RUB: '₽',
      BRL: 'R$',
      MXN: 'Mex$',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      CZK: 'Kč',
      PLN: 'zł',
      TRY: '₺',
      HKD: 'HK$',
      SGD: 'S$',
      THB: '฿',
      IDR: 'Rp',
    };

    return symbolMap[currencyCode] || currencyCode;
  }
}

/**
 * Singleton instance of CurrencyService.
 * Use this exported instance throughout the application for consistency.
 *
 * @type {CurrencyService}
 */
export default new CurrencyService();
