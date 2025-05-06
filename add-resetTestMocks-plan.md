# Plan for Adding resetTestMocks to All priceFinder Unit Test Files

## Task ID

Add `resetTestMocks` import to all priceFinder unit test files

## Current Status

Currently, the priceFinder unit test files are using the global `resetTestMocks` function without explicitly importing it. While this works (since it's defined as a global in the vitest.setup.js file), we need to follow the project's migration pattern and import it explicitly from the vitest-imports.js helper.

## Analysis of Test Files

Based on the glob pattern search, I found the following priceFinder unit test files:

1. priceFinder.additional-currencies.unit.test.js
2. priceFinder.advanced.unit.test.js
3. priceFinder.basic-patterns.unit.test.js
4. priceFinder.currency.part1.unit.test.js
5. priceFinder.currency.part2.unit.test.js
6. priceFinder.currency.part3.unit.test.js
7. priceFinder.currency.unit.test.js
8. priceFinder.edge-cases.unit.test.js
9. priceFinder.enhanced.unit.test.js
10. priceFinder.findPrices.unit.test.js
11. priceFinder.pattern.part1.unit.test.js
12. priceFinder.pattern.part2.unit.test.js
13. priceFinder.simple.vitest.test.js
14. priceFinder.unit.test.js
15. priceFinder.vitest.test.js

Some of these files already use the Vitest import pattern, like priceFinder.vitest.test.js, while others use a global reference to resetTestMocks as indicated by the comment `/* global setupTestDom, resetTestMocks */` in priceFinder.unit.test.js.

## Implementation Approach

This is a simple task that involves updating import statements and removing global declarations. For each file, I will:

1. Check if the file is already using the Vitest import pattern
2. If not, modify the imports to include resetTestMocks from vitest-imports.js
3. Remove the `/* global ... resetTestMocks */` comment if present
4. Test the files to ensure they still work properly

## Changes Needed

For each file that doesn't already have the proper import, I'll need to make the following changes:

1. **Current Pattern (with globals):**

```javascript
/* global setupTestDom, resetTestMocks */

describe('Match Pattern Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  // Tests...
});
```

2. **New Pattern (with explicit imports):**

```javascript
import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';

describe('Match Pattern Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  // Tests...
});
```

## Special Cases

1. Some files might already have imports but not include resetTestMocks
2. Some files might not use resetTestMocks at all
3. Vitest-specific files might already have the correct imports

## Implementation Steps

1. Create a script to help batch-process the files (or use the Batch tool for multiple reads/edits)
2. For each file:
   a. Check if it uses resetTestMocks
   b. Update the imports as needed
   c. Remove global declarations
3. Run tests to verify changes
4. Update TODO.md to mark the task as complete
5. Commit the changes

## Testing

I'll run the tests for each file after making changes to ensure they still pass:

```bash
npx vitest src/__tests__/unit/content/priceFinder.*.test.js
```
