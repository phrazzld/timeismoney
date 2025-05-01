# Test Migration Guide

This document provides instructions for updating test files to use the new test helpers.

## Background

We've added helper functions to the Jest setup file that improve test reliability and consistency.
These helpers need to be used in each test file.

## Changes Required

In each test file, you need to:

1. Add a `beforeEach` block at the beginning of each test suite
2. Call the global helper functions from within that block

## Example

Here's an example of how to update your test files:

```javascript
// At the top of your test file, inside your describe block:

describe('Your Test Suite', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetTestMocks();
    
    // If your test needs DOM elements, call setupTestDom()
    setupTestDom();
    
    // Add any additional test-specific setup here
  });
  
  // Your test cases continue below
  test('some test', () => {
    // ...
  });
});
```

## Global Helpers Available

The following global helpers are available:

1. `setupTestDom()` - Sets up common DOM elements needed by many tests
2. `resetTestMocks()` - Resets all Jest mocks between tests

## Reference Implementation

See `src/__tests__/test-setup-example.js` for a working example of how to use these helpers.