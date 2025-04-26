/**
 * Unified Converter module for converting prices to equivalent working time.
 * Combines functionality from the original converter.js and priceConverter.js.
 * @module utils/converter
 */

/**
 * Normalizes a price string by removing formatting characters
 *
 * @param {string} priceString - The price string to normalize
 * @param {RegExp} thousands - Regex for thousands delimiter
 * @param {RegExp} decimal - Regex for decimal delimiter
 * @returns {number} Normalized price as a number
 */
export function normalizePrice(priceString, thousands, decimal) {
  let normalized = priceString
    .replace(thousands, '@')
    .replace(decimal, '~')
    .replace('~', '.')
    .replace('@', '');

  // Extract just the numerical value
  normalized = parseFloat(normalized.replace(/[^\d.]/g, '')).toFixed(2);
  return parseFloat(normalized);
}

/**
 * Calculates the hourly wage based on frequency and amount
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
 * Converts a monetary amount to equivalent time based on wage settings
 *
 * @param {number} priceValue - The price to convert
 * @param {Object|number} wageSettings - Either an object containing wage settings or directly the hourly wage
 * @param {number} [wageSettings.amount] - Hourly wage amount
 * @param {string} [wageSettings.frequency] - Wage frequency (hourly, yearly)
 * @returns {Object} Object containing hours and minutes
 */
export function convertToTime(priceValue, wageSettings) {
  let hourlyRate;
  
  // Handle both function signatures for backward compatibility
  if (typeof wageSettings === 'number') {
    // Called with (price, hourlyWage) signature from priceConverter.js
    hourlyRate = wageSettings;
  } else {
    // Called with (price, wageSettings) signature from converter.js
    hourlyRate = parseFloat(wageSettings.amount);
    
    // Convert yearly salary to hourly rate
    if (wageSettings.frequency === 'yearly') {
      hourlyRate = hourlyRate / 2080; // 40 hours * 52 weeks
    }
  }

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
 * @param {boolean} [useCompactFormat=true] - Whether to use compact formatting (5h 30m) or verbose (5 hours, 30 minutes)
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
 *
 * @param {string} priceString - The original price string
 * @param {Object} formatters - Formatting regex patterns
 * @param {RegExp} formatters.thousands - Regex for thousands delimiter
 * @param {RegExp} formatters.decimal - Regex for decimal delimiter
 * @param {Object} wageInfo - Information about wage
 * @param {string} wageInfo.frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string|number} wageInfo.amount - Wage amount as string or number
 * @param {boolean} [useCompactFormat=true] - Whether to use compact formatting (5h 30m) or verbose (5 hours, 30 minutes)
 * @returns {string} Formatted string with price and equivalent working time
 */
export function convertPriceToTimeString(priceString, formatters, wageInfo, useCompactFormat = true) {
  // Handle invalid inputs
  if (!priceString || !formatters || !wageInfo) {
    return priceString;
  }

  try {
    const normalizedPrice = normalizePrice(priceString, formatters.thousands, formatters.decimal);
    const hourlyWage = calculateHourlyWage(wageInfo.frequency, wageInfo.amount);

    if (isNaN(normalizedPrice) || isNaN(hourlyWage) || hourlyWage <= 0) {
      return priceString;
    }

    const { hours, minutes } = convertToTime(normalizedPrice, hourlyWage);
    return formatPriceWithTime(priceString, hours, minutes, useCompactFormat);
  } catch (error) {
    console.error('Error converting price:', error);
    return priceString;
  }
}