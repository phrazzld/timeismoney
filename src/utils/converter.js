/**
 * Unified Converter module for converting prices to equivalent working time.
 * Uses RecognitionService and CurrencyService to handle detection and conversion.
 *
 * Contains some legacy functions for backward compatibility.
 *
 * @module utils/converter
 */

import * as logger from './logger.js';
import recognitionService from '../services/recognitionService.js';
import currencyService from '../services/currencyService.js';

/**
 * Normalizes a price string by removing formatting characters (LEGACY FUNCTION)
 * Kept for backward compatibility with existing tests
 *
 * @param {string} priceString - The price string to normalize
 * @param {RegExp} thousands - Regex for thousands delimiter
 * @param {RegExp} decimal - Regex for decimal delimiter
 * @returns {number} Normalized price as a number
 */
export function normalizePrice(priceString, thousands, decimal) {
  // First strip any non-essential characters like currency symbols and codes
  // Keep only digits, decimal points, commas, spaces, dots
  let cleaned = priceString.replace(/[^\d.,\s]/g, '');

  // Trim any leading/trailing whitespace that might be left
  cleaned = cleaned.trim();

  // Now proceed with the normal replacement logic but with better error handling
  try {
    let normalized = cleaned
      .replace(thousands, '@')
      .replace(decimal, '~')
      .replace(/~/g, '.') // Replace all decimal separators, not just the first one
      .replace(/@/g, ''); // Remove all thousands separators, not just the first one

    // Extract just the numerical value - only digits and decimal point
    // This handles cases where the regex replacements might not have caught everything
    normalized = normalized.replace(/[^\d.]/g, '');

    // Handle special case for currencies like JPY that typically don't have decimal places
    if (normalized.indexOf('.') === -1) {
      // No decimal point found - this is likely a whole number currency like Yen
      return parseInt(normalized, 10);
    }

    return parseFloat(parseFloat(normalized).toFixed(2));
  } catch (error) {
    // Fallback to basic parsing if the regex replacements fail
    const numericValue = parseFloat(cleaned.replace(/[^\d.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
}

/**
 * Calculates the hourly wage based on frequency and amount (LEGACY FUNCTION)
 * Kept for backward compatibility with existing tests
 *
 * @param {string} frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string|number} amount - Wage amount as string or number
 * @returns {number} Hourly wage as a number
 */
export function calculateHourlyWage(frequency, amount) {
  let hourlyWage = parseFloat(amount);
  if (frequency === 'yearly') {
    hourlyWage = hourlyWage / 2080; // 40 hours * 52 weeks
  }
  return hourlyWage;
}

/**
 * Converts a monetary amount to equivalent time based on hourly rate (LEGACY FUNCTION)
 * Kept for backward compatibility with existing tests
 *
 * @param {number} priceValue - The price to convert
 * @param {number} hourlyRate - The hourly wage rate
 * @returns {object} Object containing hours and minutes
 */
export function convertToTime(priceValue, hourlyRate) {
  const totalHours = priceValue / hourlyRate;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  // Handle case where minutes rounds up to 60
  if (minutes === 60) {
    return { hours: hours + 1, minutes: 0 };
  }

  return { hours, minutes };
}

/**
 * Converts wage information from settings to a money object
 * Handles frequency conversion (yearly to hourly)
 *
 * @param {object} wageInfo - Information about wage
 * @param {string} wageInfo.frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string|number} wageInfo.amount - Wage amount as string or number
 * @param {string} wageInfo.currencyCode - Currency code for the wage (e.g., 'USD')
 * @returns {import('../types/money').IMoneyObject|null} Money object representing hourly wage
 */
export function createWageObject(wageInfo) {
  if (!wageInfo || typeof wageInfo !== 'object' || !wageInfo.amount || !wageInfo.currencyCode) {
    logger.error('Converter.createWageObject: Invalid wage information', { wageInfo });
    return null;
  }

  try {
    let hourlyAmount = parseFloat(wageInfo.amount);

    // Convert yearly wage to hourly
    if (wageInfo.frequency === 'yearly') {
      hourlyAmount = hourlyAmount / 2080; // 40 hours * 52 weeks
    }

    // Create a money object from the hourly wage
    return currencyService.createMoney(hourlyAmount.toString(), wageInfo.currencyCode);
  } catch (error) {
    logger.error('Converter.createWageObject: Error creating wage object', {
      error: error.message,
      stack: error.stack,
      wageInfo,
    });
    return null;
  }
}

/**
 * Formats time data into a readable verbose snippet
 *
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {string} Formatted time string (e.g., "5 hours, 30 minutes")
 */
export function formatTimeSnippet(hours, minutes) {
  const hourText = hours === 1 ? 'hour' : 'hours';
  const minuteText = minutes === 1 ? 'minute' : 'minutes';

  if (hours === 0) {
    return `${minutes} ${minuteText}`;
  } else if (minutes === 0) {
    return `${hours} ${hourText}`;
  } else {
    return `${hours} ${hourText}, ${minutes} ${minuteText}`;
  }
}

/**
 * Formats time data into a compact snippet
 *
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {string} Formatted time string (e.g., "5h 30m")
 */
export function formatTimeCompact(hours, minutes) {
  return `${hours}h ${minutes}m`;
}

/**
 * Combines original price with equivalent time format
 *
 * @param {string} originalPrice - The original price string
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @param {boolean} [useCompactFormat] - Whether to use compact formatting (5h 30m) or verbose (5 hours, 30 minutes)
 * @returns {string} Combined string with original price and time (e.g., "$10 (2h 30m)")
 */
export function formatPriceWithTime(originalPrice, hours, minutes, useCompactFormat = true) {
  const timeFormat = useCompactFormat
    ? formatTimeCompact(hours, minutes)
    : formatTimeSnippet(hours, minutes);

  return `${originalPrice} (${timeFormat})`;
}

/**
 * Main function to convert a price string to time representation
 * Uses RecognitionService to extract currency information and CurrencyService for conversion
 *
 * This function handles both new and legacy call patterns:
 * - New: (priceString, culture, wageInfo, useCompactFormat)
 * - Legacy: (priceString, formatters, wageInfo, useCompactFormat)
 *
 * @param {string} priceString - The original price string
 * @param {string|object} cultureOrFormatters - Either a culture string (e.g., 'en-US') or a legacy formatters object
 * @param {object} wageInfo - Information about wage
 * @param {string} wageInfo.frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string|number} wageInfo.amount - Wage amount as string or number
 * @param {string} [wageInfo.currencyCode] - Currency code for the wage (e.g., 'USD')
 * @param {boolean} [useCompactFormat] - Whether to use compact formatting
 * @returns {string} Formatted string with price and equivalent working time
 */
export function convertPriceToTimeString(
  priceString,
  cultureOrFormatters,
  wageInfo,
  useCompactFormat = true
) {
  // Handle completely invalid inputs
  if (!priceString) {
    return priceString;
  }

  // Handle null/undefined formatters according to test expectations
  if (!cultureOrFormatters) {
    return priceString;
  }

  // Handle null/undefined wageInfo
  if (!wageInfo) {
    return priceString;
  }

  // Check if this is a legacy call with formatters object
  if (
    typeof cultureOrFormatters === 'object' &&
    cultureOrFormatters.thousands instanceof RegExp &&
    cultureOrFormatters.decimal instanceof RegExp
  ) {
    // Legacy call pattern detected, use the legacy implementation
    return convertPriceToTimeStringLegacy(
      priceString,
      cultureOrFormatters,
      wageInfo,
      useCompactFormat
    );
  }

  // Handle modern implementation with culture string
  try {
    // Ensure we have a valid culture string
    const culture = typeof cultureOrFormatters === 'string' ? cultureOrFormatters : 'en-US';

    // Ensure wageInfo has currencyCode
    if (!wageInfo.currencyCode) {
      wageInfo.currencyCode = 'USD';
    }

    // Use RecognitionService to extract currency information
    const extractedCurrencies = recognitionService.extractCurrencies(priceString, culture);

    // If no currencies were found, return the original price string
    if (!extractedCurrencies || extractedCurrencies.length === 0) {
      logger.debug('Converter.convertPriceToTimeString: No currencies recognized', { priceString });
      return priceString;
    }

    // Use the first recognized currency (most relevant if multiple found)
    const extractedCurrency = extractedCurrencies[0];

    // Create money objects for both price and wage
    const priceObject = currencyService.createMoney(
      extractedCurrency.value,
      extractedCurrency.isoCurrency
    );

    const wageObject = createWageObject(wageInfo);

    // If either money object creation failed, return the original price
    if (!priceObject || !wageObject) {
      logger.debug('Converter.convertPriceToTimeString: Failed to create money objects', {
        priceObject,
        wageObject,
      });
      return priceString;
    }

    // Convert price to time
    const timeBreakdown = currencyService.convertToTime(priceObject, wageObject);

    // If conversion failed, return the original price
    if (!timeBreakdown) {
      logger.debug('Converter.convertPriceToTimeString: Failed to convert to time', {
        priceObject,
        wageObject,
      });
      return priceString;
    }

    // Format the result
    return formatPriceWithTime(
      priceString,
      timeBreakdown.hours,
      timeBreakdown.minutes,
      useCompactFormat
    );
  } catch (error) {
    logger.error('Converter.convertPriceToTimeString: Error converting price', {
      error: error.message,
      stack: error.stack,
      priceString,
    });
    return priceString;
  }
}

/**
 * Legacy interface for backward compatibility
 * This will be used by existing code that still passes formatters
 * Full legacy implementation that doesn't use the service-based approach
 *
 * @param {string} priceString - The original price string
 * @param {object} formatters - Formatting regex patterns
 * @param {RegExp} formatters.thousands - Regex for thousands delimiter
 * @param {RegExp} formatters.decimal - Regex for decimal delimiter
 * @param {object} wageInfo - Information about wage
 * @param {string} wageInfo.frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string|number} wageInfo.amount - Wage amount as string or number
 * @param {boolean} [useCompactFormat] - Whether to use compact formatting
 * @returns {string} Formatted string with price and equivalent working time
 */
export function convertPriceToTimeStringLegacy(
  priceString,
  formatters,
  wageInfo,
  useCompactFormat = true
) {
  // Handle invalid inputs with full legacy behavior
  if (!priceString || !formatters || !wageInfo) {
    return priceString;
  }

  // IMPORTANT: Detect a legacy call pattern - formatters should be an object with regex patterns
  // If it has thousands and decimal properties that are regular expressions, it's a legacy call
  const isLegacyCall =
    formatters && formatters.thousands instanceof RegExp && formatters.decimal instanceof RegExp;

  // If this is truly a legacy call with formatters, use the pure legacy implementation
  if (isLegacyCall) {
    try {
      const normalizedPrice = normalizePrice(priceString, formatters.thousands, formatters.decimal);
      const hourlyWage = calculateHourlyWage(wageInfo.frequency, wageInfo.amount);

      if (isNaN(normalizedPrice) || isNaN(hourlyWage) || hourlyWage <= 0) {
        return priceString;
      }

      const { hours, minutes } = convertToTime(normalizedPrice, hourlyWage);
      return formatPriceWithTime(priceString, hours, minutes, useCompactFormat);
    } catch (error) {
      logger.error('Error converting price with legacy implementation:', error);
      return priceString;
    }
  }
  // If it's a call with the new signature (culture string instead of formatters),
  // delegate to the new function
  else {
    try {
      // Assume formatters is actually a culture string, and use modern implementation
      const culture = formatters || 'en-US';

      // Ensure wageInfo has currencyCode
      if (wageInfo && !wageInfo.currencyCode) {
        wageInfo.currencyCode = 'USD';
      }

      return convertPriceToTimeString(priceString, culture, wageInfo, useCompactFormat);
    } catch (error) {
      logger.error('Error delegating to modern converter implementation:', error);
      return priceString;
    }
  }
}

// Export the main function under the original name for compatibility
// This is the preferred way to use the function going forward
export const convertPriceToTimeStringOriginal = convertPriceToTimeString;
