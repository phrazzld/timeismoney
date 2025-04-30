# T040 · Test · P1: add comprehensive unit tests for currency regexes

## Task Overview
Write comprehensive unit tests for currency regex patterns in `priceFinder.js` to validate the handling of various currency formats, edge cases, and ensure no false positives/negatives occur.

## Current State Analysis
After examining the codebase, I found that:

1. There are already some test files for priceFinder:
   - `priceFinder.test.js` - Basic tests for the core functions
   - `priceFinder.enhanced.test.js` - Tests for international format support
   - `priceFinder.currency.test.js` - Tests for currency format detection
   - `priceFinder.test.patch.js` - Patches for test-specific behavior

2. The recent refactoring in T039 has improved the regex construction, making it more modular and maintainable, but comprehensive tests are still needed to ensure all currency formats are properly supported.

3. Current tests cover some basic scenarios but don't test exhaustively across all supported currencies and edge cases.

## Implementation Approach

1. **Review Existing Tests**:
   - Understand what's already covered in existing test files
   - Identify gaps in test coverage

2. **Enhance Currency Format Tests**:
   - Create tests for all supported currency symbols and codes
   - Add tests for different positioning (before/after amount)
   - Test thousands and decimal delimiter variations

3. **Add Edge Case Tests**:
   - Prices at boundaries (very small, very large)
   - Mixed currency formats in the same text
   - Prices with no fractional part
   - Invalid formats that shouldn't match
   - Potential regex backtracking issues

4. **Ensure Test Organization**:
   - Group tests logically by currency or feature
   - Use descriptive test names
   - Add test documentation where needed

## Specific Tasks

1. Create or update tests for all supported currency formats:
   - USD ($) - US dollar format
   - EUR (€) - Euro format (both comma decimal and space/dot thousands)
   - GBP (£) - British pound format
   - JPY (¥) - Japanese yen format
   - INR (₹) - Indian rupee format
   - Other supported currencies (CHF, SEK, DKK, NOK, PLN, KRW, CNY)

2. Test various price formats:
   - Symbol before amount (`$100.00`)
   - Symbol after amount (`100.00$`)
   - Code before amount (`USD 100.00`)
   - Code after amount (`100.00 USD`)
   - With/without spaces (`$100` vs `$ 100`)
   - With/without thousands separators (`$1,000.00` vs `$1000.00`)
   - With/without decimal part (`$100` vs `$100.00`)

3. Test edge cases:
   - Very large numbers (`$1,000,000,000.00`)
   - Very small numbers (`$0.01`)
   - Zero (`$0.00`)
   - Prices in context (`Item: $10.99, Total: $21.98`)
   - Similar but invalid formats that shouldn't match
   - Potential false positives in text

## Success Criteria
- All significant currency formats are tested
- Edge cases are properly handled
- No false positives/negatives occur
- Tests fail appropriately when patterns don't match expected behavior

## Execution Plan
1. Create or update test files as needed
2. Group tests logically by functionality
3. Document test purpose and expectations clearly
4. Ensure tests run successfully with the updated code from T039