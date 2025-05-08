# Plan for Implementing Codemod for Jest to Vitest Migration

## Overview

This task involves creating a codemod script that can automatically convert simple Jest patterns to Vitest patterns. The goal is to automate the migration process for test files that follow predictable patterns, reducing manual work and ensuring consistency.

## Approach

1. Create a Node.js script that uses AST (Abstract Syntax Tree) manipulation to transform Jest patterns into their Vitest equivalents
2. Leverage a JavaScript parser (like Babel, Recast, or jscodeshift) to parse, modify, and generate code
3. Implement transformation rules for common Jest to Vitest migrations
4. Provide a command-line interface to run the codemod on specific files or directories

## Implementation Plan

1. Create a new script in the `scripts` directory named `jest-to-vitest-codemod.js`
2. Add necessary dependencies:
   - jscodeshift (for AST manipulation)
   - commander (for CLI argument parsing)
3. Implement transformations for common patterns:
   - Replace `jest.fn()` with `vi.fn()`
   - Replace `jest.mock()` with `vi.mock()`
   - Replace `jest.spyOn()` with `vi.spyOn()`
   - Replace direct Jest globals with imports from vitest-imports.js
   - Replace Jest timer mocks with their Vitest equivalents
   - Update assertion syntax where needed
4. Add support for updating import statements to import from the project's helper files
5. Implement a safety mechanism to detect complex patterns that need manual intervention
6. Add a dry-run mode to preview changes without modifying files

## Transformation Rules

1. **Import Transformations**:

   - Add import from vitest-imports.js for test functions
   - Add import for resetTestMocks if mock functions are used
   - Remove direct imports from 'jest'

2. **API Transformations**:

   - `jest.fn()` → `vi.fn()`
   - `jest.mock()` → `vi.mock()`
   - `jest.spyOn()` → `vi.spyOn()`
   - `jest.useFakeTimers()` → `vi.useFakeTimers()`
   - `jest.useRealTimers()` → `vi.useRealTimers()`
   - `jest.advanceTimersByTime()` → `vi.advanceTimersByTime()`
   - `jest.runAllTimers()` → `vi.runAllTimers()`
   - `jest.clearAllMocks()` → `resetTestMocks()`
   - `jest.resetAllMocks()` → `resetTestMocks()`

3. **ESLint Update**:
   - Add eslint-disable comments for eslint rules that need to be suppressed

## Expected Outcome

The script should be able to:

1. Process test files and convert simple Jest patterns to their Vitest equivalents
2. Handle the project's specific patterns (like importing from vitest-imports.js)
3. Create backup files before modifications
4. Report statistics on conversions performed
5. Flag files with complex patterns that need manual review

## Testing

Test the codemod on:

1. Simple test files with basic Jest patterns
2. Files with mixed Jest and Vitest patterns
3. Files with complex patterns to ensure they're flagged properly

## Success Criteria

1. The codemod successfully converts at least 80% of Jest patterns automatically
2. Converted files pass ESLint checks and tests
3. The codemod identifies and reports complex patterns that need manual intervention
4. The migration process is significantly faster with the codemod than manual conversion
