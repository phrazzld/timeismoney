# CI Hell: A Complete Analysis

## Overview

This document provides a comprehensive analysis of the persistent CI failures we've been trying to solve in the TimeIsMoney extension project. Despite multiple approaches, we continue to face memory-related issues and test failures.

## Problem Statement

The CI pipeline for PR #50 ("Complete Extension Refactoring and Manifest V3 Migration") consistently fails with two primary classes of errors:

1. **JavaScript heap out of memory errors**:

   - Many Jest worker processes are terminated by `SIGTERM`
   - Fatal JS heap allocation errors (`FATAL ERROR: invalid array length Allocation failed - JavaScript heap out of memory`)

2. **JSDOM related errors**:
   - `TypeError: Cannot read properties of null (reading '_location')`
   - Window location object initialization failures

## Attempted Solutions

### 1. Memory Allocation Increases

**Approach**: Increase Node.js memory limits using `--max-old-space-size=4096`
**Result**: ❌ FAILED - Still encountering memory errors

```yaml
run: NODE_OPTIONS=--max-old-space-size=4096 npm test
```

### 2. JSDOM Window Location Fix

**Approach**: Fix JSDOM window.location initialization in Jest setup
**Result**: ❌ FAILED - Still encountering errors

```javascript
// From:
if (window) {
  // Only do this if we're in a JSDOM environment
  if (window.location === undefined || window.location === null) {
    delete window.location;
    window.location = new URL('http://localhost');
  }
}

// To:
if (typeof window !== 'undefined') {
  // Only do this if we're in a JSDOM environment
  if (window.location === undefined || window.location === null) {
    delete window.location;
    window.location = new URL('http://localhost');
  }
}
```

### 3. Sequential Test Execution in Jest Config

**Approach**: Force Jest to run tests sequentially in CI via maxWorkers config
**Result**: ❌ FAILED - Config change didn't address root issue

```javascript
// In jest.config.cjs
module.exports = {
  // Run sequentially in CI to avoid memory issues
  ...(process.env.CI ? { maxWorkers: 1 } : {}),
};
```

### 4. Using --runInBand with Jest

**Approach**: Run tests in-band (sequentially) with Jest's CLI flag
**Result**: ❌ FAILED - Still having memory issues

```yaml
run: npx jest --config=jest.config.cjs --runInBand --no-cache
```

### 5. Garbage Collection Flags

**Approach**: Add `--expose-gc` flag to Node.js options
**Result**: ❌ FAILED - Flag not allowed in NODE_OPTIONS

```
node: --expose-gc is not allowed in NODE_OPTIONS
```

### 6. Direct Jest Execution

**Approach**: Use npx to run Jest directly rather than through npm script
**Result**: ❌ FAILED - Command not found error

```
/home/runner/work/_temp/9b0be1ad-3422-4ccb-ad24-1d71f89fd392.sh: line 1: jest: command not found
```

## Root Cause Analysis

### 1. Memory Issues

The TimeIsMoney extension tests are memory-intensive for several reasons:

- **Regular Expression Processing**: The price detection logic uses complex RegExp patterns that are repeatedly compiled and executed
- **Test Data**: Large amounts of test data (mock DOM structures, price patterns)
- **Test Splitting**: Files were split (e.g., `priceFinder.currency.part1.test.js`) to avoid worker termination, but this created overhead
- **Parallel Test Execution**: Jest runs tests in parallel by default, multiplying memory consumption

```js
// Example of memory-intensive RegExp code from the tests
const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');
expect('$1,234.56'.match(pattern)).toBeTruthy();
```

### 2. JSDOM Implementation Issues

- **Inconsistent Environment**: JSDOM in CI behaves differently than in development
- **Window Location Issues**: JSDOM doesn't properly initialize window.location, leading to errors in tests
- **Defensive Code Missing**: Some tests assume window.location exists without checking

## The Gordian Knot

The project's CI failures represent a classic Gordian Knot where conventional fixes (increasing memory, running in sequence) don't work because of multiple intertwined issues:

1. **Technical Debt**: Tests were poorly architected with heavy reliance on global state and complex regexp patterns
2. **Environment Discrepancies**: Works locally but fails in CI due to subtle environment differences
3. **Cascading Failures**: One test failure cascades into multiple failures

## Recommended Solution

To truly solve this issue, we need a radical approach rather than incremental fixes:

1. **Rewrite Test Strategy**:

   - Replace regexp-heavy tests with more focused unit tests
   - Avoid testing entire DOM processing chains; test smaller units instead
   - Use simple data fixtures instead of complex DOM structures

2. **Environment Normalization**:

   - Create a standardized test environment that behaves the same in CI and locally
   - Add explicit window.location mocking for all tests that need it

3. **Short-term Workaround**:
   - Add CI compatibility flag to skip problematic tests in CI only
   - Add test categorization to run critical tests first, memory-intensive tests last

## Conclusion

The CI failures we're experiencing are a symptom of deeper architectural issues in the test suite. Continuing to patch the symptoms with memory flags, sequential execution, etc. will not solve the root cause.

Instead, we should either:

1. Commit to a proper refactoring of the test suite
2. Add temporary workarounds to skip problematic tests in CI
3. Run the tests in a much more powerful CI environment (more RAM)
