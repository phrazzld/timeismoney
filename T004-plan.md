# T004 · Refactor · P2: merge converter logic into src/utils/converter.js

## Task Details
- **Context:** cr-02 step 1
- **Action:**
    1. Consolidate `normalizePrice`, `calculateHourlyWage`, and formatting logic from `src/content/priceConverter.js` into `src/utils/converter.js`, ensuring a unified API.
- **Done-when:**
    1. `src/utils/converter.js` implements all conversion functions and exports a consistent interface covering both original modules.
- **Depends-on:** none

## Plan

### Analysis
1. Examine and compare the two files:
   - `src/utils/converter.js` - Core conversion utilities
   - `src/content/priceConverter.js` - Additional conversion functions

2. Identify all unique functionality in each file:
   - Functions for formatting currency and time
   - Functions for normalizing price strings
   - Functions for converting between price and time
   - Any helpers or utility functions

3. Document the current API and determine the ideal unified API.

### Implementation Approach
1. Create a backup of src/utils/converter.js for safety
2. Modify src/utils/converter.js to include all functionality from priceConverter.js:
   - Add any missing functions from priceConverter.js
   - Make sure function signatures are consistent
   - Ensure exported functions have clear documentation
   - Maintain backward compatibility where possible

3. Run tests to ensure no regressions occur

### Testing
1. Ensure existing tests for converter.js still pass
2. Add new tests for any new functions added from priceConverter.js

## Classification
This is a **Complex** task that requires careful analysis of existing code and ensuring we maintain compatibility while creating a unified API.