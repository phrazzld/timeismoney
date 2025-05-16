# Codemod Testing Plan

This document outlines the approach for testing the enhanced Jest to Vitest codemod script on various sample files.

## Objectives

1. Test the enhanced codemod script against different Jest patterns
2. Verify all supported transformations work correctly
3. Identify any edge cases or limitations
4. Ensure the script is ready for batch migration

## Test Categories

We'll test the codemod against files containing the following Jest patterns:

1. **Basic Patterns**

   - jest.fn()
   - jest.spyOn()
   - jest.mock()
   - expect() assertions

2. **Timer Functions**

   - jest.useFakeTimers()
   - jest.useRealTimers()
   - jest.advanceTimersByTime()
   - jest.runAllTimers()

3. **Complex Mocks**

   - jest.mock() with factory functions
   - Complex mock implementation patterns

4. **Performance API**

   - Files using performance.mark / measure
   - Files needing Performance API mocking

5. **Edge Cases**
   - Files with mixed Jest/Vitest patterns
   - Files with unusual imports
   - Files with multiple test sections

## Test Files

We'll use the following approach to test files:

1. Create sample test files in a temporary directory
2. Use real project files that have different patterns
3. Apply the codemod with different options

## Test Matrix

| Test Case         | Options to Test | Expected Outcome                           |
| ----------------- | --------------- | ------------------------------------------ |
| Basic mocks       | Default options | Basic transformations applied              |
| Timer functions   | Default options | Timer functions transformed                |
| Factory mocks     | Default options | Complex mocks properly transformed         |
| Performance tests | With -p flag    | Performance API mocks added                |
| Mixed patterns    | Default options | Only Jest patterns transformed             |
| File renaming     | With -r flag    | File renamed to .vitest.test.js            |
| Test with hooks   | With -a flag    | Lifecycle hooks added                      |
| Backup creation   | With -b flag    | Backup files created                       |
| Dry run           | With -d flag    | No files modified but transformation shown |

## Execution Steps

1. Create or identify suitable sample files
2. Run the codemod with different option combinations
3. Verify the transformations
4. Document any issues or limitations

## Success Criteria

The codemod will be considered ready for batch migration when:

1. All supported Jest patterns are correctly transformed
2. Options like file renaming and backup creation work as expected
3. Performance API mocking is properly added when needed
4. The script handles edge cases gracefully

## Post-Test Actions

1. Update the codemod script if any issues are found
2. Document any limitations or edge cases
3. Mark the task as completed in TODO-ACCELERATED.md
4. Proceed to the first batch migration (unit tests)
