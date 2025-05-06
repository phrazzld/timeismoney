# Jest to Vitest Migration Tasks

## Setup and Configuration

- [x] Create `vitest.setup.js` file at project root with global compatibility layer
- [x] Update `vitest.config.js` to include the setup file in the appropriate test environments
- [x] Add Vitest globals configuration to make `vi` available in test files
- [x] Update CI workflow file to use proper Vitest setup commands

## Test Helper Implementation

- [x] Create `src/__tests__/setup/vitest-helpers.js` file for shared test utilities
- [x] Implement `resetTestMocks` function with proper Vitest implementation
- [x] Add function to convert Jest mock patterns to Vitest equivalents
- [x] Create import helper for easy test file migration

## Integration Test Fixes

- [x] Fix `formHandler.storage.integration.test.js` by adding proper Vitest imports
- [x] Fix `formHandler.storage.integration.test.js` by replacing Jest references with `vi`
- [ ] Update `formHandler.xss.integration.test.js` to use Vitest mocking patterns
- [ ] Fix `popup.error.integration.test.js` by replacing Jest global references

## Unit Test Fixes

- [ ] Add `resetTestMocks` import to all priceFinder unit test files
- [x] Fix mock assertions in `priceFinder.vitest.test.js` to match Vitest's argument format
- [x] Update `priceFinder.enhanced.unit.test.js` to fix the NaN value issue
- [ ] Fix Jest references in `options/formHandler.unit.test.js`
- [ ] Fix Jest references in `utils/converter.edge.unit.test.js`
- [ ] Fix Jest references in `utils/storage.error.unit.test.js`
- [ ] Fix Jest references in `utils/storage.unit.test.js`

## Documentation and Standards

- [ ] Create documentation on Jest vs Vitest differences specific to this project
- [ ] Document the preferred pattern for writing new Vitest tests
- [ ] Add ESLint rule to enforce Vitest patterns in new test files
- [ ] Create pull request template with migration checklist for test files

## Optional Automation Tools

- [ ] Create script to identify remaining Jest references in the codebase
- [ ] Implement codemod to automatically convert simple Jest patterns to Vitest
- [ ] Add migration status tracking to identify progress

## Testing and Validation

- [x] Verify all tests pass locally after implementing fixes
- [x] Run `npm test` with timing to ensure performance is acceptable
- [x] Confirm CI passes after pushing changes
- [x] Document any remaining issues or edge cases discovered

## Summary of Changes Made

### Vitest Setup

- Enhanced the Jest compatibility layer in `vitest.setup.js` with additional methods
- Improved performance API mocking to handle edge cases in stress tests
- Added proper cleanup of mocks in resetTestMocks function
- Used safer approach for performance API mocking to avoid read-only issues in CI

### Configuration Updates

- Updated file patterns in `vitest.config.js` to match actual test files
- Fixed import patterns and test exclusions
- Configured workspaces properly for unit, integration, and DOM tests

### CI Improvements

- Updated GitHub Actions workflow to run tests without specific patterns
- Fixed package.json scripts for consistent test execution
- Fixed issues with read-only Performance API in CI environment

### Test Fixes

- Fixed mock assertions in various test files
- Enhanced performance API mocks to prevent unhandled promise rejections
- Updated observer-stress tests to use the global mock performance API
- Fixed issues with DOM-based tests in CI environment

### Issues Discovered and Fixed

- Performance API is read-only in CI environment, requiring alternative mocking approaches
- Different test environments (node/jsdom) require different approaches to mocking global objects
- Test patterns and file naming conventions need to be consistent

### Next Steps

- Continue migrating remaining test files to Vitest format
- Create documentation for Jest to Vitest migration patterns
- Implement automated conversion tools for remaining test files
