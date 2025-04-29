# T034 Plan: Ensure Observer Callback Logic is Unit-Testable

## Overview
This task requires refactoring the callback logic in the `domScanner.js` module so that the `processPendingNodes` function can be tested independently from the MutationObserver. This will make the code more testable and allow for more comprehensive unit tests.

## Current State
Currently, the `processPendingNodes` function is:
1. A private function (not exported)
2. Tightly coupled with the MutationObserver implementation
3. Not directly accessible for unit tests
4. Difficult to test in isolation

## Approach
1. Make `processPendingNodes` an exported function so it can be invoked directly in tests
2. Create a separate function to process MutationRecords and add nodes to the pending queues
3. Make sure the state objects are properly structured and passed between functions
4. Add an example test to demonstrate how to test the function in isolation

## Implementation Steps

### 1. Export `processPendingNodes`
- Add export to the function signature so it can be imported in tests
- Update the JSDoc to clarify this is part of the public API

### 2. Create a `processMutations` Function
- Extract the logic that processes MutationRecords from the observer callback
- Make it handle an array of MutationRecords and update the state accordingly
- Export this function so it can be tested independently

### 3. Update the MutationObserver Callback
- Use the new `processMutations` function inside the observer callback
- Pass the mutations array and state to the function

### 4. Create an Example Test
- Demonstrate how to call `processMutations` directly with mock MutationRecords
- Show how to test `processPendingNodes` with various test scenarios

## Benefits
- Better separation of concerns
- Improved testability of individual components
- Ability to test edge cases more effectively
- Easier debugging and maintenance