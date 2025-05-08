# Plan for Creating a Script to Identify Remaining Jest References

## Overview

This task involves creating a Node.js script that scans the codebase for any remaining Jest references that need to be migrated to Vitest. The script will help identify files that still use Jest APIs but haven't been fully migrated yet.

## Approach

1. Create a Node.js script that uses filesystem operations to search through JavaScript files
2. Define a list of common Jest patterns to look for:
   - `jest.` references
   - Jest global functions without imports (like `test`, `describe`, `it`, etc.)
   - Jest-specific mock patterns
   - Import statements from 'jest' packages
3. Exclude files that are properly using Vitest imports
4. Generate a report of files with Jest references that need migration

## Implementation Plan

1. Create a script in the `scripts` directory named `find-jest-references.js`
2. Use Node.js built-in modules for file operations:
   - `fs` for reading files
   - `path` for path manipulation
   - `process` for handling command line arguments
3. Implement a function to recursively scan directories for JavaScript files
4. Define regex patterns to detect Jest references
5. Filter out files that are already properly migrated
6. Output a report with file paths, line numbers, and the type of Jest reference found

## Expected Outcome

The script will output a list of files that still contain Jest references, making it easier to track migration progress and identify files that need attention. This will help ensure a complete migration to Vitest.

## Testing

The script should be tested on:

1. A file that uses Jest references
2. A file that properly uses Vitest imports
3. A file that has been migrated but might have missed some Jest references

## Success Criteria

The script successfully identifies:

1. Direct Jest API calls (`jest.fn()`, `jest.mock()`, etc.)
2. Implicit Jest globals usage without proper imports
3. Imports from Jest packages
4. Files that mix Jest and Vitest patterns

The script should not flag:

1. Files that properly import from Vitest
2. Files that use the compatibility layer provided in the setup files
