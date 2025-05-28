/**
 * Centralized logger utility for consistent logging across the application
 *
 * @module utils/logger
 */

const PREFIX = 'TimeIsMoney';

/**
 * Log levels enum
 *
 * @enum {number}
 */
export const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Debug mode state
let debugMode = false;

/**
 * Enable or disable debug mode
 *
 * @param {boolean} enabled - Whether to enable debug mode
 */
export function setDebugMode(enabled) {
  debugMode = enabled;
}

/**
 * Check if debug mode is enabled
 *
 * @returns {boolean} Whether debug mode is enabled
 */
export function isDebugMode() {
  return debugMode;
}

/**
 * Get the minimum log level based on the current environment
 *
 * @returns {number} The minimum log level
 */
function getMinLogLevel() {
  // If debug mode is explicitly enabled, always use DEBUG level
  if (debugMode) {
    return LOG_LEVEL.DEBUG;
  }

  const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

  switch (env) {
    case 'production':
      return LOG_LEVEL.WARN;
    case 'development':
      return LOG_LEVEL.DEBUG;
    case 'test':
      return LOG_LEVEL.DEBUG;
    default:
      return LOG_LEVEL.INFO;
  }
}

/**
 * Check if a message at the given level should be logged
 *
 * @param {number} level - The log level to check
 * @returns {boolean} True if the message should be logged
 */
function shouldLog(level) {
  // Re-evaluate min log level if debug mode might have changed
  const currentMinLevel = getMinLogLevel();
  return level >= currentMinLevel;
}

/**
 * Log debug level message
 *
 * @param {...any} args - Arguments to log
 */
export function debug(...args) {
  if (shouldLog(LOG_LEVEL.DEBUG)) {
    // eslint-disable-next-line no-console
    console.debug(`${PREFIX}:`, ...args);
  }
}

/**
 * Log info level message
 *
 * @param {...any} args - Arguments to log
 */
export function info(...args) {
  if (shouldLog(LOG_LEVEL.INFO)) {
    // eslint-disable-next-line no-console
    console.info(`${PREFIX}:`, ...args);
  }
}

/**
 * Log warning level message
 *
 * @param {...any} args - Arguments to log
 */
export function warn(...args) {
  if (shouldLog(LOG_LEVEL.WARN)) {
    // eslint-disable-next-line no-console
    console.warn(`${PREFIX}:`, ...args);
  }
}

/**
 * Log error level message
 *
 * @param {...any} args - Arguments to log
 */
export function error(...args) {
  if (shouldLog(LOG_LEVEL.ERROR)) {
    // eslint-disable-next-line no-console
    console.error(`${PREFIX}:`, ...args);
  }
}

/**
 * Log debug message for price detection.
 * Provides structured logging for price detection debugging
 *
 * @param {string} context - Context of the detection (e.g., 'pattern_match', 'dom_analysis')
 * @param {object} data - Data to log
 */
export function debugPriceDetection(context, data) {
  if (!shouldLog(LOG_LEVEL.DEBUG)) return;

  const timestamp = new Date().toISOString();
  const structuredLog = {
    timestamp,
    context,
    ...data,
  };

  // eslint-disable-next-line no-console
  console.debug(`${PREFIX}:PriceDetection:`, structuredLog);
}
