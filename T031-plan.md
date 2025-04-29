# T031 Plan: Add Performance Timing to processPendingNodes

## Overview
This task is about adding performance monitoring to the `processPendingNodes` function in the `domScanner.js` module. This will help identify performance bottlenecks and ensure the observer callback execution is not causing performance issues.

## Approach

1. Examine the current implementation of `processPendingNodes` in `domScanner.js`
2. Identify the critical sections that should be timed:
   - Overall function execution time
   - Time spent processing pending nodes
   - Time spent processing text nodes
3. Use the logger utility to output performance metrics
4. Ensure timings are only recorded in development/debug mode

## Implementation Steps

1. Locate the `processPendingNodes` function in `domScanner.js`
2. Add performance marks at the start and end of the function
3. Add additional performance marks around the main processing loops
4. Use `performance.measure` to calculate the time spent in each section
5. Log the timing results using the logger utility at debug level
6. Test the implementation to ensure it doesn't impact performance