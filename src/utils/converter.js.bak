/**
 * Converts a monetary amount to equivalent time based on wage settings
 *
 * @param {number} priceValue - The price to convert
 * @param {Object} wageSettings - Object containing wage settings
 * @param {number} wageSettings.amount - Hourly wage amount
 * @param {string} wageSettings.frequency - Wage frequency (hourly, yearly)
 * @returns {Object} Object containing hours and minutes
 */
export function convertToTime(priceValue, wageSettings) {
  let hourlyRate = parseFloat(wageSettings.amount);

  // Convert yearly salary to hourly rate
  if (wageSettings.frequency === 'yearly') {
    hourlyRate = hourlyRate / 2080; // 40 hours * 52 weeks
  }

  const totalHours = priceValue / hourlyRate;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  return { hours, minutes };
}

/**
 * Formats time data into a readable snippet
 *
 * @param {number} hours - Number of hours
 * @param {number} minutes - Number of minutes
 * @returns {string} Formatted time string
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
