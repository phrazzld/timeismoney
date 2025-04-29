/**
 * Centralized logger utility for consistent logging across the application
 *
 * @module utils/logger
 */

const PREFIX = 'TimeIsMoney';

/**
 * Log debug level message
 *
 * @param {...any} args - Arguments to log
 */
export function debug(...args) {
  // eslint-disable-next-line no-console
  console.debug(`${PREFIX}:`, ...args);
}

/**
 * Log info level message
 *
 * @param {...any} args - Arguments to log
 */
export function info(...args) {
  // eslint-disable-next-line no-console
  console.info(`${PREFIX}:`, ...args);
}

/**
 * Log warning level message
 *
 * @param {...any} args - Arguments to log
 */
export function warn(...args) {
  // eslint-disable-next-line no-console
  console.warn(`${PREFIX}:`, ...args);
}

/**
 * Log error level message
 *
 * @param {...any} args - Arguments to log
 */
export function error(...args) {
  // eslint-disable-next-line no-console
  console.error(`${PREFIX}:`, ...args);
}
