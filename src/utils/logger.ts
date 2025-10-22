/**
 * Centralized logger utility for consistent logging across the application
 *
 * @module utils/logger
 */

const PREFIX = 'TimeIsMoney';

/**
 * Log levels enum
 */
export const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

/**
 * Get the minimum log level based on the current environment
 */
function getMinLogLevel(): number {
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

// Get the minimum log level based on the environment
const MIN_LOG_LEVEL = getMinLogLevel();

/**
 * Check if a message at the given level should be logged
 */
function shouldLog(level: number): boolean {
  return level >= MIN_LOG_LEVEL;
}

/**
 * Log debug level message
 */
export function debug(...args: unknown[]): void {
  if (shouldLog(LOG_LEVEL.DEBUG)) {
    // eslint-disable-next-line no-console
    console.debug(`${PREFIX}:`, ...args);
  }
}

/**
 * Log info level message
 */
export function info(...args: unknown[]): void {
  if (shouldLog(LOG_LEVEL.INFO)) {
    // eslint-disable-next-line no-console
    console.info(`${PREFIX}:`, ...args);
  }
}

/**
 * Log warning level message
 */
export function warn(...args: unknown[]): void {
  if (shouldLog(LOG_LEVEL.WARN)) {
    // eslint-disable-next-line no-console
    console.warn(`${PREFIX}:`, ...args);
  }
}

/**
 * Log error level message
 */
export function error(...args: unknown[]): void {
  if (shouldLog(LOG_LEVEL.ERROR)) {
    // eslint-disable-next-line no-console
    console.error(`${PREFIX}:`, ...args);
  }
}
