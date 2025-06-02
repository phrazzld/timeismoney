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
 * Generate a unique correlation ID for request tracing
 *
 * @returns {string} Unique correlation ID
 */
function generateCorrelationId() {
  return `pid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced debug logging for price detection with comprehensive diagnostics
 * Follows DEVELOPMENT_PHILOSOPHY.md structured logging standards
 *
 * @param {string} phase - Detection phase (pipeline-start|strategy-attempt|strategy-result|pipeline-complete)
 * @param {string} context - Specific context (site-specific|dom-analyzer|pattern-matching|pipeline)
 * @param {object} data - Data to log (default: {})
 * @param {object} timing - Performance timing data (start, end, duration)
 * @param {string} correlationId - Request correlation ID (auto-generated if not provided)
 * @param {object} siteConfig - Site configuration information
 */
export function debugPriceDetection(
  phase,
  context,
  data = {},
  timing = null,
  correlationId = null,
  siteConfig = null
) {
  // Check debug mode first, then shouldLog
  if (!debugMode || !shouldLog(LOG_LEVEL.DEBUG)) return;

  const timestamp = new Date().toISOString();
  const actualCorrelationId = correlationId || generateCorrelationId();

  // Build structured log following DEVELOPMENT_PHILOSOPHY.md standards
  const structuredLog = {
    timestamp,
    correlation_id: actualCorrelationId,
    service_name: 'timeismoney-price-detection',
    phase,
    context,
    message: `Price detection ${phase} in ${context}`,
    data: data || {},
  };

  // Add performance timing if provided
  if (timing) {
    structuredLog.timing = timing;
    structuredLog.performance_metrics = {
      duration: timing.duration || timing.end - timing.start,
      start_time: timing.start,
      end_time: timing.end,
    };
  }

  // Add site configuration if provided
  if (siteConfig) {
    structuredLog.site_config = siteConfig;
  }

  // Log with structured output
  // eslint-disable-next-line no-console
  console.debug(`${PREFIX}:PriceDetection:`, structuredLog);
}
