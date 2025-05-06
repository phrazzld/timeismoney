# Task Plan: Create Import Helper for Easy Test File Migration

## Task Description

Create a helper module for easily importing Vitest testing functions in test files. This will simplify the migration process from Jest to Vitest by providing a standardized way to import the necessary testing functions.

## Current Approach

Currently, test files have inconsistent approaches to importing test functions:

1. Some files rely on global Jest functions
2. Some files import Vitest functions individually (`import { describe, it, expect } from 'vitest'`)
3. Some files use the compatibility layer in vitest.setup.js

## Proposed Solution

Create a centralized import helper that:

1. Provides all necessary Vitest functions through a single import
2. Includes type definitions for better IDE support
3. Uses consistent naming conventions

## Implementation Steps

1. Create a new file `src/__tests__/setup/vitest-imports.js`
2. Export all commonly used Vitest functions and utilities
3. Add JSDoc comments for better documentation
4. Add example usage in the file's header comment

## Benefits

- Consistent import pattern across all test files
- Single line to import all needed functions
- Improved IDE support through JSDoc
- Easier migration path for remaining Jest files
- Reduced boilerplate in test files

## Usage Example

```javascript
// Old approach
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// New approach
import { describe, it, expect, vi, beforeEach, afterEach } from '../../setup/vitest-imports.js';
```

## Testing

Will verify the helper works by:

1. Creating the helper file
2. Updating one test file to use the new import pattern
3. Running tests to confirm everything works as expected
