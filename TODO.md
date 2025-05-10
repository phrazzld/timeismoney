# Jest to Vitest Migration - Consolidated Tasks

This document consolidates all Jest to Vitest migration tasks from multiple TODO files into a single, structured roadmap.

## Current Migration Status

- **Phase 1 (Setup & Initial Tools)**: ✅ COMPLETED
- **Phase 2 (Enhanced Automation)**: ✅ COMPLETED
- **Phase 3 (Batch Migration)**: 🔄 IN PROGRESS
- **Phase 4 (Cleanup & Finalization)**: 🔜 PENDING

## Phase 1: Setup and Configuration ✅

- [x] Create `vitest.setup.js` file at project root with global compatibility layer
- [x] Update `vitest.config.js` to include the setup file in the appropriate test environments
- [x] Add Vitest globals configuration to make `vi` available in test files
- [x] Update CI workflow file to use proper Vitest setup commands
- [x] Create `src/__tests__/setup/vitest-helpers.js` file for shared test utilities
- [x] Implement `resetTestMocks` function with proper Vitest implementation
- [x] Add function to convert Jest mock patterns to Vitest equivalents
- [x] Create import helper for easy test file migration

## Phase 2: Enhanced Automation Tools ✅

- [x] Enhance codemod script to handle complex Jest patterns:
  - [x] Add support for complex `jest.mock()` with factory functions
  - [x] Add support for Performance API mocking
  - [x] Improve timer function transformations
  - [x] Add automatic file renaming capability
  - [x] Add test type detection
  - [x] Add detailed report generation
- [x] Create standardization script for consistent Vitest patterns:
  - [x] Replace direct Vitest imports with imports from helper
  - [x] Add `resetTestMocks` import and setup when needed
  - [x] Ensure proper cleanup in `afterEach` hooks
  - [x] Add lifecycle hook setup and cleanup
- [x] Create batch migration script:
  - [x] Implement batch processing by test category
  - [x] Add support for automated testing after migration
  - [x] Generate detailed migration reports
  - [x] Auto-update TODO.md for completed migrations
- [x] Test the enhanced codemod script on sample files
- [x] Run the test batch migration script to verify workflow

## Phase 3: Batch Migration 🔄

### Preparation

- [x] Create backup branch of current codebase

### Batch 1: Unit Tests (Minimal DOM Interaction)

- [ ] Batch: unit
  ```
  node scripts/batch-migrate-tests.js -v -r -t unit
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 2: Content Tests

- [x] Migrate `src/__tests__/content/amazonHandler.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/dom-conversion.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/domModifier.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/domScanner.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/observer-stress.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/performance.test.js` using the codemod script
- [ ] Migrate remaining Content module tests:
  ```
  node scripts/batch-migrate-tests.js -v -r -t content
  ```
  - [ ] `src/__tests__/content/price-conversion-flow.test.js`
  - [ ] `src/__tests__/content/priceFinder.currency.part2.test.js`
  - [ ] `src/__tests__/content/priceFinder.edge-cases.test.js`
  - [ ] `src/__tests__/content/priceFinder.enhanced.test.js`
  - [ ] `src/__tests__/content/settingsManager.error.test.js`
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 3: DOM Tests (Heavy DOM Interaction)

- [ ] Migrate all DOM tests:
  ```
  node scripts/batch-migrate-tests.js -v -r -t dom
  ```
  - [ ] `src/__tests__/dom/content/domModifier.dom.test.js`
  - [ ] `src/__tests__/dom/content/observer-stress.dom.test.js`
  - [ ] `src/__tests__/dom/content/performance.dom.test.js`
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 4: Integration Tests

- [ ] Migrate all Integration tests:
  ```
  node scripts/batch-migrate-tests.js -v -r -t integration
  ```
  - [ ] `src/__tests__/integration/content/amazonHandler.integration.test.js`
  - [ ] `src/__tests__/integration/content/dom-conversion.integration.test.js`
  - [ ] `src/__tests__/integration/content/domScanner.integration.test.js`
  - [ ] `src/__tests__/integration/content/price-conversion-flow.integration.test.js`
  - [ ] `src/__tests__/integration/content/settingsManager.error.integration.test.js`
  - [ ] `src/__tests__/integration/options/formHandler.xss.integration.test.js`
  - [ ] `src/__tests__/integration/popup/popup.error.integration.test.js`
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 5: Options and Popup Tests

- [ ] Batch: options and popup
  ```
  node scripts/batch-migrate-tests.js -v -r -t options
  node scripts/batch-migrate-tests.js -v -r -t popup
  ```
  - [ ] `src/__tests__/options/formHandler.xss.test.js`
  - [ ] `src/__tests__/popup/popup.error.test.js`
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 6: Utils Tests

- [ ] Batch: utils
  ```
  node scripts/batch-migrate-tests.js -v -r -t utils
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 7: Special Categories

- [ ] Batch: performance and observer tests
  ```
  node scripts/batch-migrate-tests.js -v -r -t -p performance
  node scripts/batch-migrate-tests.js -v -r -t observer
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

## Phase 4: Cleanup and Finalization 🔜

### Post-Migration Standardization

- [ ] Run standardization script on all test files
  ```
  node scripts/standardize-vitest-patterns.js src/__tests__
  ```
- [ ] Batch clean up partially migrated files by category:
  - [ ] Content Module Cleanup
  - [ ] DOM Module Cleanup
  - [ ] PriceFinder Unit Tests Cleanup
  - [ ] Utils Module Cleanup
- [ ] Run ESLint to ensure all files follow project standards
  ```
  npm run lint
  ```

### Cleanup Tasks

- [ ] Run migration status script to verify progress
- [ ] Remove duplicate test files where both Jest and Vitest versions exist
- [ ] Standardize file naming to follow `.vitest.test.js` pattern
- [ ] Create script to consolidate similar test files
- [ ] Verify test coverage is maintained or improved
- [ ] Remove Jest dependencies and configuration files
- [ ] Update package.json to remove Jest dependencies
- [ ] Update `MIGRATION-STATUS.md` with final status
- [ ] Update documentation to reflect Vitest usage

### Final Validation

- [ ] Run full test suite to verify all tests pass with Vitest
  ```
  npm test
  ```
- [ ] Measure and document performance improvements compared to Jest
- [ ] Verify CI pipeline successfully runs all tests without errors
- [ ] Create migration completion report with metrics and lessons learned
- [ ] Create release plan for merging all changes to master branch

## Migration Metrics

| Metric               | Before | After | Improvement |
| -------------------- | ------ | ----- | ----------- |
| Test Execution Time  | TBD    | TBD   | TBD         |
| Number of Test Files | TBD    | TBD   | TBD         |
| Test Coverage        | TBD    | TBD   | TBD         |
| CI Build Time        | TBD    | TBD   | TBD         |

## Commands Quick Reference

```bash
# Test codemod script (dry run)
node scripts/jest-to-vitest-codemod.js -d -v path/to/test.js

# Run codemod on a file
node scripts/jest-to-vitest-codemod.js -v -r -p path/to/test.js

# Run batch migration (dry run first)
node scripts/batch-migrate-tests.js -d -v batch-name

# Run batch migration (with file renaming and testing)
node scripts/batch-migrate-tests.js -v -r -t batch-name

# Standardize test files
node scripts/standardize-vitest-patterns.js path/to/directory

# Verify all tests pass
npm test
```

## Troubleshooting

- **Error: Global Performance API mocking issues in CI environment**  
  Solution: Use the `-p` flag with the codemod to add proper Performance API mocking

- **Error: Test fails after migration but passes with Jest**  
  Solution: Check for timer mocking and ensure `vi.useRealTimers()` is called in afterEach

- **Error: resetTestMocks is not defined**  
  Solution: Run the standardize-vitest-patterns.js script to add proper imports

- **Error: Test environment mismatch**  
  Solution: Verify the test environment in vitest.config.js matches the test type (node vs jsdom)

## Migration Implementation Details

### Summary of Changes Made

- Enhanced the Jest compatibility layer in `vitest.setup.js` with additional methods
- Improved performance API mocking to handle edge cases in stress tests
- Added proper cleanup of mocks in resetTestMocks function
- Used safer approach for performance API mocking to avoid read-only issues in CI
- Updated file patterns in `vitest.config.js` to match actual test files
- Fixed import patterns and test exclusions
- Configured workspaces properly for unit, integration, and DOM tests
- Updated GitHub Actions workflow to run tests without specific patterns
- Fixed package.json scripts for consistent test execution
- Fixed issues with read-only Performance API in CI environment
- Fixed mock assertions in various test files
- Enhanced performance API mocks to prevent unhandled promise rejections
- Updated observer-stress tests to use the global mock performance API
- Fixed issues with DOM-based tests in CI environment

### Issues Discovered and Fixed

- Performance API is read-only in CI environment, requiring alternative mocking approaches
- Different test environments (node/jsdom) require different approaches to mocking global objects
- Test patterns and file naming conventions need to be consistent
