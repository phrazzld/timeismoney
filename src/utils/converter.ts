/**
 * Unified Converter module for converting prices to equivalent working time.
 * Uses RecognitionService and CurrencyService to handle detection and conversion.
 *
 * This module serves as the orchestration layer between the DOM-based price detection
 * and the service-based price processing. It contains both the modern implementation
 * using the new service architecture and legacy functions for backward compatibility.
 *
 * @module utils/converter
 */

import * as logger from './logger.js';
import * as debugTools from '../content/debugTools.js';
import recognitionService from '../services/recognitionService.js';
import currencyService from '../services/currencyService.js';
import type { IMoneyObject, ITimeBreakdown } from '../types/money.js';

interface WageInfo {
  frequency: string;
  amount: string | number;
  currencyCode?: string;
  debugMode?: boolean;
}

interface Formatters {
  thousands: RegExp;
  decimal: RegExp;
}

/**
 * Normalizes a price string by removing formatting characters.
 *
 * @deprecated This is a LEGACY FUNCTION from the regex-based price parsing implementation.
 * Kept only for backward compatibility with existing tests and legacy code.
 * New code should use the service-based approach with RecognitionService instead.
 * TODO: Remove when integration tests are updated to use service-based approach.
 *
 * This function handles the old regex-based approach for extracting numeric values
 * from formatted price strings with various thousands/decimal separators.
 */
export function normalizePrice(priceString: string, thousands: RegExp, decimal: RegExp): number {
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
 * Calculates the hourly wage based on frequency and amount.
 *
 * @deprecated This is a LEGACY FUNCTION from the old price conversion implementation.
 * Kept only for backward compatibility with existing tests and legacy code.
 * New code should use createWageObject() and CurrencyService instead.
 * TODO: Remove when integration tests are updated to use service-based approach.
 *
 * Converts yearly wages to hourly wages by dividing by the standard
 * 2080 work hours per year (40 hours/week * 52 weeks).
 */
export function calculateHourlyWage(frequency: string | null, amount: string | number | null): number {
  let hourlyWage = parseFloat(String(amount));
  if (frequency === 'yearly') {
    hourlyWage = hourlyWage / 2080; // 40 hours * 52 weeks
  }
  return hourlyWage;
}

/**
 * Converts a monetary amount to equivalent time based on hourly rate.
 *
 * @deprecated This is a LEGACY FUNCTION from the old price conversion implementation.
 * Kept only for backward compatibility with existing tests and legacy code.
 * New code should use CurrencyService.convertToTime() instead.
 * TODO: Remove when integration tests are updated to use service-based approach.
 *
 * This function is the core of the legacy conversion logic, calculating
 * how many hours and minutes of work are required to earn a given price.
 */
export function convertToTime(
  priceValue: number,
  hourlyRate: number
): { hours: number; minutes: number } {
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
 * Converts wage information from settings to a money object.
 * Handles frequency conversion (yearly to hourly) and creates a standardized
 * money object using the CurrencyService.
 *
 * This function bridges the user settings with the CurrencyService by
 * normalizing the wage information and converting yearly wages to hourly.
 */
export function createWageObject(wageInfo: WageInfo): IMoneyObject | null {
  if (!wageInfo || typeof wageInfo !== 'object' || !wageInfo.amount || !wageInfo.currencyCode) {
    logger.error('Converter.createWageObject: Invalid wage information', { wageInfo });
    return null;
  }

  try {
    let hourlyAmount = parseFloat(wageInfo.amount.toString());

    // Convert yearly wage to hourly
    if (wageInfo.frequency === 'yearly') {
      hourlyAmount = hourlyAmount / 2080; // 40 hours * 52 weeks
    }

    // Create a money object from the hourly wage
    return currencyService.createMoney(hourlyAmount.toString(), wageInfo.currencyCode);
  } catch (error) {
    const err = error as Error;
    logger.error('Converter.createWageObject: Error creating wage object', {
      error: err.message,
      stack: err.stack,
      wageInfo,
    });
    return null;
  }
}

/**
 * Formats time data into a readable verbose snippet.
 * Creates a human-friendly, grammatically correct time string.
 */
export function formatTimeSnippet(hours: number, minutes: number): string {
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
 * Formats time data into a compact snippet.
 * Creates a short, space-efficient time string.
 */
export function formatTimeCompact(hours: number, minutes: number): string {
  return `${hours}h ${minutes}m`;
}

/**
 * Combines original price with equivalent time format.
 * Creates a combined string showing both the price and the time equivalent,
 * typically for display in augmented DOM elements.
 */
export function formatPriceWithTime(
  originalPrice: string,
  hours: number,
  minutes: number,
  useCompactFormat = true
): string {
  const timeFormat = useCompactFormat
    ? formatTimeCompact(hours, minutes)
    : formatTimeSnippet(hours, minutes);

  return `${originalPrice} (${timeFormat})`;
}

/**
 * Main function to convert a price string to time representation.
 * Uses RecognitionService to extract currency information and CurrencyService for conversion.
 *
 * This function is the core orchestration point for the price-to-time conversion flow,
 * connecting the various services and handling both modern and legacy call patterns.
 *
 * Two call patterns are supported:
 * 1. Modern: (priceString, culture, wageInfo, useCompactFormat)
 * 2. Legacy: (priceString, formatters, wageInfo, useCompactFormat)
 *
 * The function detects which pattern is being used based on the type of the second parameter.
 */
export function convertPriceToTimeString(
  priceString: string,
  cultureOrFormatters: string | Formatters,
  wageInfo: WageInfo,
  useCompactFormat = true
): string {
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
    'thousands' in cultureOrFormatters &&
    'decimal' in cultureOrFormatters &&
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

      // Log failed detection if debug mode is enabled
      if (wageInfo.debugMode) {
        // Find the parent element to mark as failed
        const nodeElement = document.evaluate(
          `//*[contains(text(), "${priceString}")]`,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as HTMLElement | null;

        if (nodeElement) {
          debugTools.markConversionFailure(nodeElement, priceString, 'No currency detected');
        }
      }

      return priceString;
    }

    // Use the first recognized currency (most relevant if multiple found)
    const extractedCurrency = extractedCurrencies[0];

    // If debug mode is enabled, log the detected price
    if (wageInfo.debugMode) {
      debugTools.debugState.lastDetectedPrice = extractedCurrency.text;
    }

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
    const result = formatPriceWithTime(
      priceString,
      timeBreakdown.hours,
      timeBreakdown.minutes,
      useCompactFormat
    );

    // Log successful conversion if debug mode is enabled
    if (wageInfo.debugMode) {
      // Find the parent element to mark as converted
      const nodeElement = document.evaluate(
        `//*[contains(text(), "${priceString}")]`,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue as HTMLElement | null;

      if (nodeElement) {
        debugTools.markConversionSuccess(nodeElement, extractedCurrency.text, result);
      }

      // Record conversion time
      const conversionTime = performance.now() - (timeBreakdown.startTime || 0);
      debugTools.recordConversionTime(conversionTime);
    }

    return result;
  } catch (error) {
    const err = error as Error;
    logger.error('Converter.convertPriceToTimeString: Error converting price', {
      error: err.message,
      stack: err.stack,
      priceString,
    });
    return priceString;
  }
}

/**
 * Legacy interface for backward compatibility.
 *
 * @deprecated This is a LEGACY FUNCTION that implements the full regex-based price conversion flow.
 * Kept only for backward compatibility with existing tests and integrations.
 * New code should use the service-based approach with RecognitionService and CurrencyService.
 * TODO: Remove when integration tests are updated to use service-based approach.
 *
 * This function is maintained for backward compatibility with existing
 * code that still uses the old regex-based approach. It implements the
 * complete legacy conversion flow using the old helper functions.
 */
export function convertPriceToTimeStringLegacy(
  priceString: string,
  formatters: Formatters | string,
  wageInfo: WageInfo,
  useCompactFormat = true
): string {
  // Handle invalid inputs with full legacy behavior
  if (!priceString || !formatters || !wageInfo) {
    return priceString;
  }

  // IMPORTANT: Detect a legacy call pattern - formatters should be an object with regex patterns
  // If it has thousands and decimal properties that are regular expressions, it's a legacy call
  const isLegacyCall =
    formatters &&
    typeof formatters === 'object' &&
    'thousands' in formatters &&
    'decimal' in formatters &&
    formatters.thousands instanceof RegExp &&
    formatters.decimal instanceof RegExp;

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
      const culture = (formatters as string) || 'en-US';

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

// Removed redundant alias convertPriceToTimeStringOriginal
// The main convertPriceToTimeString function is now the preferred API
