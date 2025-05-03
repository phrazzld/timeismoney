# Test Refactoring Examples

This directory contains example files demonstrating the new test patterns to use when refactoring tests to align with the new mocking strategy. These are reference implementations and not actual test files.

## Key Principles

1. **No Internal Module Mocks**

   - Import and use actual implementation of internal modules
   - Focus on testing the contract/API, not implementation details

2. **Centralized External Mocks**

   - Use `chrome-api.mock.js` for Chrome Extension API mocks
   - Use `browser-api.mock.js` for standard browser API mocks
   - Configure mock behavior specific to each test in the `beforeEach` setup

3. **Proper Test Isolation**

   - Each test should set up its required state in `beforeEach`
   - Clean up in `afterEach` using helpers like `resetAllMocks`
   - Avoid test interdependencies

4. **Testing Philosophy**
   - Unit tests: Focus on logic without DOM dependencies
   - Integration tests: Test interactions between modules
   - DOM tests: Test DOM manipulation and observation logic

## Example Files

- **converter.unit.example.js**: Unit test example showing removal of internal module mocks
- **storage.integration.example.js**: Integration test example showing use of centralized Chrome API mocks
- **observer-callback.dom.example.js**: DOM test example showing comprehensive mock setup

## How to Use These Examples

When refactoring existing test files:

1. Review the appropriate example for your test type (unit, integration, DOM)
2. Update imports to use the new mock helpers
3. Replace internal module mocks with direct imports
4. Replace inline external mocks with centralized mock usage
5. Ensure proper setup/teardown in beforeEach/afterEach

Remember that these examples are templates - adapt them to your specific test cases.
