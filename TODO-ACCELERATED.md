# Jest to Vitest Migration - Accelerated Approach

## Phase 1: Enhanced Automation Tools (CURRENT)

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

## Phase 2: Batch Migration

### Preparation

- [ ] Create backup branch of current codebase
- [ ] Test the enhanced codemod script on sample files
- [x] Run the test batch migration script to verify workflow

### Batch 1: Unit Tests (Minimal DOM Interaction)

- [ ] Batch: unit
  ```
  node scripts/batch-migrate-tests.js -v -r -t unit
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 2: Content Tests

- [ ] Batch: content
  ```
  node scripts/batch-migrate-tests.js -v -r -t content
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 3: DOM Tests (Heavy DOM Interaction)

- [ ] Batch: dom
  ```
  node scripts/batch-migrate-tests.js -v -r -t dom
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 4: Integration Tests

- [ ] Batch: integration
  ```
  node scripts/batch-migrate-tests.js -v -r -t integration
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

### Batch 5: Options and Popup Tests

- [ ] Batch: options
  ```
  node scripts/batch-migrate-tests.js -v -r -t options
  ```
- [ ] Batch: popup
  ```
  node scripts/batch-migrate-tests.js -v -r -t popup
  ```
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

- [ ] Batch: performance
  ```
  node scripts/batch-migrate-tests.js -v -r -t -p performance
  ```
- [ ] Batch: observer
  ```
  node scripts/batch-migrate-tests.js -v -r -t observer
  ```
- [ ] Verify tests pass and fix any issues
- [ ] Commit migration changes

## Phase 3: Cleanup and Finalization

### Post-Migration Standardization

- [ ] Run standardize-vitest-patterns.js on all test files
  ```
  node scripts/standardize-vitest-patterns.js src/__tests__
  ```
- [ ] Run ESLint to ensure all files follow project standards
  ```
  npm run lint
  ```
- [ ] Run full test suite to verify all tests pass
  ```
  npm test
  ```

### Cleanup Tasks

- [ ] Remove duplicate test files where both Jest and Vitest versions exist
- [ ] Update package.json to remove Jest dependencies
- [ ] Update documentation to reflect Vitest usage
- [ ] Create migration completion report with metrics and lessons learned

### Final Validation

- [ ] Run full test suite to verify all tests pass with Vitest
- [ ] Measure and document performance improvements compared to Jest
- [ ] Verify CI pipeline successfully runs all tests without errors

## Migration Metrics

| Metric               | Before | After | Improvement |
| -------------------- | ------ | ----- | ----------- |
| Test Execution Time  | TBD    | TBD   | TBD         |
| Number of Test Files | TBD    | TBD   | TBD         |
| Test Coverage        | TBD    | TBD   | TBD         |
| CI Build Time        | TBD    | TBD   | TBD         |

## Commands Quick Reference

```bash
# Test our enhanced codemod script (dry run)
node scripts/jest-to-vitest-codemod.js -d -v path/to/test.js

# Run the codemod on a file
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
