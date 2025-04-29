# T019 Plan: Implement Centralized Logger Utility

## Context
This task is part of the Core/Logging improvements (cr-10, Step 1) to create a centralized logging mechanism for the application.

## Analysis
We need to create a centralized logger utility that wraps the standard console methods. This will allow for:
1. Consistent logging format across the application
2. Centralized control over logging (which will be implemented in T020)
3. Easier replacement of the underlying logging mechanism if needed

The logger should provide wrappers for common console methods:
- debug
- info
- warn
- error

## Implementation Plan
1. Create `src/utils/logger.js` with the following features:
   - Wrapper functions for console.debug, console.info, console.warn, and console.error
   - Add a standard prefix to all log messages (e.g., "TimeIsMoney")
   - Export the wrapper functions

2. Use ES6 module syntax for consistency with the codebase

## Testing
This is a simple utility that doesn't require extensive testing at this point. 
- Manual verification that the logger works as expected
- Future tickets will add more advanced features and tests

## Implementation Details
The logger.js file will include:
```javascript
/**
 * Centralized logger utility for consistent logging across the application
 * @module utils/logger
 */

const PREFIX = 'TimeIsMoney';

/**
 * Log debug level message
 * @param {...any} args - Arguments to log
 */
export function debug(...args) {
  console.debug(`${PREFIX}:`, ...args);
}

/**
 * Log info level message
 * @param {...any} args - Arguments to log
 */
export function info(...args) {
  console.info(`${PREFIX}:`, ...args);
}

/**
 * Log warning level message
 * @param {...any} args - Arguments to log
 */
export function warn(...args) {
  console.warn(`${PREFIX}:`, ...args);
}

/**
 * Log error level message
 * @param {...any} args - Arguments to log
 */
export function error(...args) {
  console.error(`${PREFIX}:`, ...args);
}
```