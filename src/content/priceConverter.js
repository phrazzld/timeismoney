/**
 * Price Converter module for converting prices to equivalent working time.
 * @module content/priceConverter
 */

/**
 * Normalizes a price string by removing formatting characters
 *
 * @param {string} priceString - The price string to normalize
 * @param {RegExp} thousands - Regex for thousands delimiter
 * @param {RegExp} decimal - Regex for decimal delimiter
 * @returns {number} Normalized price as a number
 */
export const normalizePrice = (priceString, thousands, decimal) => {
  let normalized = priceString
    .replace(thousands, '@')
    .replace(decimal, '~')
    .replace('~', '.')
    .replace('@', '');

  // Extract just the numerical value
  normalized = parseFloat(normalized.replace(/[^\d.]/g, '')).toFixed(2);
  return parseFloat(normalized);
};

/**
 * Calculates the hourly wage based on frequency and amount
 *
 * @param {string} frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string} amount - Wage amount as string
 * @returns {number} Hourly wage as a number
 */
export const calculateHourlyWage = (frequency, amount) => {
  let hourlyWage = parseFloat(amount);
  if (frequency === 'yearly') {
    hourlyWage = hourlyWage / 52 / 40;
  }
  return hourlyWage;
};

/**
 * Converts a monetary price to equivalent working time
 *
 * @param {number} price - The price value as a number
 * @param {number} hourlyWage - The hourly wage
 * @returns {Object} Object with hours and minutes
 */
export const convertToTime = (price, hourlyWage) => {
  const workHours = price / hourlyWage;
  let hours = Math.floor(workHours);
  let minutes = Math.ceil(60 * (workHours - hours));

  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }

  return { hours, minutes };
};

/**
 * Formats time as a string with hours and minutes
 *
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {string} Formatted time string (e.g., "5h 30m")
 */
export const formatTimeSnippet = (hours, minutes) => {
  return `${hours}h ${minutes}m`;
};

/**
 * Combines original price with equivalent time format
 *
 * @param {string} originalPrice - The original price string
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {string} Combined string with original price and time (e.g., "$10 (2h 30m)")
 */
export const formatPriceWithTime = (originalPrice, hours, minutes) => {
  return `${originalPrice} (${formatTimeSnippet(hours, minutes)})`;
};

/**
 * Main function to convert a price string to time representation
 *
 * @param {string} priceString - The original price string
 * @param {Object} formatters - Formatting regex patterns
 * @param {RegExp} formatters.thousands - Regex for thousands delimiter
 * @param {RegExp} formatters.decimal - Regex for decimal delimiter
 * @param {Object} wageInfo - Information about wage
 * @param {string} wageInfo.frequency - Wage frequency ('hourly' or 'yearly')
 * @param {string} wageInfo.amount - Wage amount as string
 * @returns {string} Formatted string with price and equivalent working time
 */
export const convertPriceToTimeString = (priceString, formatters, wageInfo) => {
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
    return formatPriceWithTime(priceString, hours, minutes);
  } catch (error) {
    console.error('Error converting price:', error);
    return priceString;
  }
};
