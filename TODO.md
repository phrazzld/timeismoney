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
- [x] Update `formHandler.xss.integration.test.js` to use Vitest mocking patterns
- [x] Fix `popup.error.integration.test.js` by replacing Jest global references

## Unit Test Fixes

- [x] Add `resetTestMocks` import to all priceFinder unit test files
- [x] Fix mock assertions in `priceFinder.vitest.test.js` to match Vitest's argument format
- [x] Update `priceFinder.enhanced.unit.test.js` to fix the NaN value issue
- [x] Fix Jest references in `options/formHandler.unit.test.js`
- [x] Fix Jest references in `utils/converter.edge.unit.test.js`
- [x] Fix Jest references in `utils/storage.error.unit.test.js`
- [x] Fix Jest references in `utils/storage.unit.test.js`

## Documentation and Standards

- [x] Create documentation on Jest vs Vitest differences specific to this project
- [x] Document the preferred pattern for writing new Vitest tests
- [x] Add ESLint rule to enforce Vitest patterns in new test files
- [x] Create pull request template with migration checklist for test files

## Optional Automation Tools

- [x] Create script to identify remaining Jest references in the codebase
- [x] Implement codemod to automatically convert simple Jest patterns to Vitest
- [x] Add migration status tracking to identify progress

## Testing and Validation

- [x] Verify all tests pass locally after implementing fixes
- [x] Run `npm test` with timing to ensure performance is acceptable
- [x] Confirm CI passes after pushing changes
- [x] Document any remaining issues or edge cases discovered

## Complete File Migration

### Content Module Tests (Unmigrated)

- [x] Migrate `src/__tests__/content/amazonHandler.test.js` using the codemod script
- [x] Migrate `src/__tests__/content/dom-conversion.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/domModifier.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/domScanner.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/observer-stress.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/performance.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/price-conversion-flow.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/priceFinder.currency.part2.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/priceFinder.edge-cases.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/priceFinder.enhanced.test.js` using the codemod script
- [ ] Migrate `src/__tests__/content/settingsManager.error.test.js` using the codemod script

### DOM Tests (Unmigrated)

- [ ] Migrate `src/__tests__/dom/content/domModifier.dom.test.js` using the codemod script
- [ ] Migrate `src/__tests__/dom/content/observer-stress.dom.test.js` using the codemod script
- [ ] Migrate `src/__tests__/dom/content/performance.dom.test.js` using the codemod script

### Integration Tests (Unmigrated)

- [ ] Migrate `src/__tests__/integration/content/amazonHandler.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/content/dom-conversion.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/content/domScanner.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/content/price-conversion-flow.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/content/settingsManager.error.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/options/formHandler.xss.integration.test.js` using the codemod script
- [ ] Migrate `src/__tests__/integration/popup/popup.error.integration.test.js` using the codemod script

### Options and Popup Tests (Unmigrated)

- [ ] Migrate `src/__tests__/options/formHandler.xss.test.js` using the codemod script
- [ ] Migrate `src/__tests__/popup/popup.error.test.js` using the codemod script

### Utils Tests (Unmigrated)

- [ ] Migrate `src/__tests__/unit/utils/converter.edge.refactored.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/converter.edge.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/converter.unified.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/converter.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/parser.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/storage.error.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/unit/utils/storage.unit.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/converter.edge.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/converter.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/converter.unified.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/parser.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/storage.error.test.js` using the codemod script
- [ ] Migrate `src/__tests__/utils/storage.test.js` using the codemod script

## Clean Up Partially Migrated Files

### Content Module Cleanup

- [ ] Clean up `src/__tests__/content/observer-callback.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.additional-currencies.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.basic-patterns.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.currency.part1.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.currency.part3.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.currency.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.findPrices.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.pattern.part1.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.pattern.part2.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/content/priceFinder.test.js` to use only Vitest patterns

### DOM Module Cleanup

- [ ] Clean up `src/__tests__/dom/content/domModifier.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/dom/content/observer-callback.dom.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/dom/content/observer-callback.refactored.dom.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/dom/content/observer-callback.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/dom/content/observer-stress.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/dom/content/performance.vitest.test.js` to use only Vitest patterns

### PriceFinder Unit Tests Cleanup

- [ ] Clean up `src/__tests__/unit/content/priceFinder.additional-currencies.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.advanced.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.basic-patterns.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.currency.part1.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.currency.part2.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.currency.part3.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.currency.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.edge-cases.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.enhanced.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.findPrices.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.pattern.part1.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.pattern.part2.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.simple.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.unit.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/content/priceFinder.vitest.test.js` to use only Vitest patterns

### Other Modules Cleanup

- [ ] Clean up `src/__tests__/unit/options/formHandler.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/options/formHandler.unit.vitest.test.js` to use only Vitest patterns

### Utils Module Cleanup

- [ ] Clean up `src/__tests__/unit/utils/converter.edge.unit.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/converter.edge.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/converter.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/parser.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/storage.error.unit.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/storage.error.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/storage.refactored.unit.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/storage.unit.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/storage.vitest.test.js` to use only Vitest patterns
- [ ] Clean up `src/__tests__/unit/utils/test-eslint-vitest-fixed.vitest.test.js` to use only Vitest patterns

## Post-Migration Cleanup

- [ ] Run migration status script to verify progress and identify any missed files
- [ ] Remove duplicate test files where both Jest and Vitest versions exist
- [ ] Standardize file naming to follow `.vitest.test.js` or consistent pattern
- [ ] Create script to consolidate similar test files that were split for Jest performance reasons
- [ ] Verify test coverage is maintained or improved compared to Jest baseline
- [ ] Remove Jest dependencies and configuration files from package.json
- [ ] Update `MIGRATION-STATUS.md` with final status and completion metrics
- [ ] Create release plan for merging all changes to master branch

## Final Validation

- [ ] Run full test suite to verify all tests pass with Vitest
- [ ] Measure and document performance improvements compared to Jest
- [ ] Verify CI pipeline successfully runs all tests without errors
- [ ] Create migration completion report with metrics and lessons learned
- [ ] Update all documentation to remove Jest references

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
