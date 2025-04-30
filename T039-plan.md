# T039 · Refactor · P2: simplify and clarify regex construction

## Task Overview
Refactor regex construction in `priceFinder.js` to break down complex ORs and consider separate patterns for common cases.

## Current Implementation Analysis
After reviewing the code in `priceFinder.js`, I've identified several areas that can be improved:

1. The `buildMatchPattern` function (lines 113-168) constructs a complex regex pattern that:
   - Handles currency symbols before or after the amount
   - Handles currency codes
   - Combines these patterns with OR (|) operators

2. Issues with the current implementation:
   - The regex pattern construction is complex and difficult to understand
   - The pattern construction combines multiple concerns in a single function
   - The resulting patterns can become quite large with many OR conditions
   - Adding new currency formats requires modifying complex regex logic

## Approach
I'll refactor the regex construction to be more modular and easier to understand by:

1. Breaking down the `buildMatchPattern` function into smaller, focused functions
2. Creating separate pattern builders for different currency position styles (before/after)
3. Separating currency symbol patterns from currency code patterns
4. Improving documentation and variable naming for clarity
5. Creating helper functions to reduce nested logic
6. Ensuring all existing tests continue to pass

## Implementation Plan

### 1. Create Helper Functions
- Create helper functions for escaping regex special characters
- Create helpers for building specific pattern segments

### 2. Refactor Pattern Construction
- Break down the existing `buildMatchPattern` function into smaller components:
  - `buildCurrencySymbolPattern` - For currency symbol patterns
  - `buildCurrencyCodePattern` - For currency code patterns
  - Separate "before" and "after" pattern builders

### 3. Simplify Pattern Combination
- Modify how patterns are combined to make the code more readable
- Use array methods and joins instead of direct string concatenation

### 4. Improve Documentation
- Add detailed JSDoc comments for each new function
- Add explanatory inline comments for complex regex patterns

### 5. Update Tests
- Update existing tests if necessary
- Ensure all existing test cases still pass

## Success Criteria
1. Code is more modular and easier to understand
2. All existing tests pass, proving the logic is unchanged
3. Any complex regex patterns are broken down into more manageable components
4. Documentation clearly explains the purpose of each component
5. The overall solution follows the project's development philosophy

## Risk Assessment
This is a relatively low-risk refactoring since:
- We're not changing the external API
- We have good test coverage
- The changes are purely structural
- We can verify the output patterns match the current implementation

However, we need to be careful about:
- Maintaining compatibility with existing code
- Preserving the exact pattern matching behavior
- Ensuring the cache mechanism still works efficiently