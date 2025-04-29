# T021 Plan: Replace Direct Console Calls with Logger Calls

## Context
This task is part of the Core/Logging improvements (cr-10, Step 3) to ensure all logging goes through the centralized logger utility.

## Analysis
After examining the codebase, I found several instances of direct `console.*` calls in the source code. These need to be replaced with the corresponding `logger.*` calls to ensure consistent logging across the application.

The main sources with direct console calls were:
1. src/utils/converter.js
2. src/content/domScanner.js
3. src/content/index.js

## Implementation Approach
For each file with direct console calls:
1. Import the logger module: `import * as logger from '../utils/logger.js';`
2. Replace console.* calls with the appropriate logger.* equivalents:
   - console.debug → logger.debug
   - console.log → logger.info (for most informational logging)
   - console.warn → logger.warn
   - console.error → logger.error
3. In some cases, timing patterns (console.time/timeEnd) were converted to use performance.now() with logger.debug

## Changes Made
1. In src/utils/converter.js:
   - Added import for logger module
   - Replaced console.error with logger.error

2. In src/content/domScanner.js:
   - Added import for logger module
   - Replaced all console.* calls with the appropriate logger.* equivalents
   - Converted console.time/timeEnd to use performance.now() with logger.debug

3. In src/content/index.js:
   - Added import for logger module
   - Replaced all console.* calls with the appropriate logger.* equivalents
   - Changed some informational logs to use logger.info
   - Changed debugging logs to use logger.debug

## Benefits
1. Consistent logging format with the "TimeIsMoney:" prefix
2. Centralized control over log levels based on environment
3. Cleaner code with no direct console dependencies
4. Better maintainability for future logging enhancements

## Verification
- Verified that all direct console.* calls in source code have been replaced (except within logger.js itself)
- All logging now routes through the centralized logger utility