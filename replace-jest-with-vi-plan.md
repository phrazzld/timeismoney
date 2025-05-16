# Plan for Replacing Jest References with Vitest

## Task ID: Fix `formHandler.storage.integration.test.js` by replacing Jest references with `vi`

## Current Status

I've analyzed the file `formHandler.storage.integration.vitest.test.js` to identify any remaining Jest references. The file already has many proper Vitest imports and uses many Vitest methods correctly, but there are a few areas where we need to make changes.

### Implementation Approach

1. **Review the file for any remaining Jest references**

   - Though most references have been properly migrated in the imports section, we need to search for any `.mock` or `.spy` methods that might still be using Jest syntax
   - Pay close attention to timer mocks and other testing utilities

2. **Identify specific changes needed**
   - The file is already quite well migrated to Vitest
   - The imports correctly use our vitest-imports.js helper
   - There's proper use of vi.fn(), vi.spyOn(), vi.useFakeTimers(), etc.
   - There is a small inconsistency between using vi.runAllTimersAsync() and vi.advanceTimersByTime()
3. **Make necessary adjustments**
   - Standardize timer usage
   - Ensure all mocking syntax is consistent with Vitest patterns
   - Check for any less obvious Jest patterns that might need to be updated

### Findings and Plan

After reviewing the code, I've found that:

1. The file already uses Vitest's mocking utilities:

   - vi.spyOn() for mocking storage functions
   - vi.fn() for mocking window.close
   - vi.useFakeTimers() and vi.useRealTimers() for timer manipulation

2. There are no direct Jest references remaining in the file!

3. The only potential issue is an inconsistency in using both vi.runAllTimersAsync() and vi.advanceTimersByTime(), but this appears to be intentional and valid Vitest usage.

**Conclusion**: All Jest references have already been replaced with their Vitest equivalents. The task appears to be complete, but I'll double-check to make sure there aren't any subtle Jest-style patterns or references that should be updated to follow Vitest's recommended patterns.

## Implementation Steps

1. Verify there are no Jest references in the code
2. Check for any subtle patterns that should be updated for Vitest best practices
3. Update the TODO.md file to mark the task as complete
4. Commit changes
