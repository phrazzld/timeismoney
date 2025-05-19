# Accelerated Jest to Vitest Migration

This document provides instructions for using the enhanced migration tooling to efficiently migrate the remaining Jest tests to Vitest.

## Overview

Instead of migrating tests one-by-one, this approach uses:

1. **Enhanced Codemod**: Automatically convert Jest syntax to Vitest
2. **Pattern Standardization**: Enforce consistent Vitest patterns
3. **Batch Processing**: Migrate groups of similar files at once
4. **Automated Testing**: Verify migrations immediately

## Setup

Ensure you have checked out the latest code and installed all dependencies:

```bash
git checkout todo-04-scripts-ci
npm install
```

## Available Scripts

### 1. Enhanced Jest-to-Vitest Codemod

The enhanced codemod script automatically converts Jest patterns to Vitest:

```bash
node scripts/jest-to-vitest-codemod.js [options] <path>
```

Options:

- `-d, --dry-run`: Show transformations without modifying files
- `-v, --verbose`: Show detailed logs during transformation
- `-b, --backup`: Create backup files before transformations

Example:

```bash
# Convert a single file (dry run)
node scripts/jest-to-vitest-codemod.js --dry-run src/__tests__/content/price-conversion-flow.test.js

# Convert all content tests
node scripts/jest-to-vitest-codemod.js --backup src/__tests__/content/
```

### 2. Vitest Pattern Standardization

This script enforces consistent patterns in Vitest test files:

```bash
node scripts/standardize-vitest-patterns.js [options] <path>
```

Options:

- `-d, --dry-run`: Show standardizations without modifying files
- `-v, --verbose`: Show detailed logs during standardization
- `-b, --backup`: Create backup files before standardization

Example:

```bash
# Standardize a single Vitest file
node scripts/standardize-vitest-patterns.js src/__tests__/content/performance.vitest.test.js

# Standardize all Vitest files in content directory
node scripts/standardize-vitest-patterns.js src/__tests__/content/
```

### 3. Batch Migration

This script automates the entire migration process for groups of files:

```bash
node scripts/batch-migrate-tests.js [options] <batch-name>
```

Options:

- `-d, --dry-run`: Preview changes without modifying files
- `-v, --verbose`: Show detailed logs during migration
- `-b, --backup`: Create backup files before migration
- `-r, --rename`: Rename test files to .vitest.test.js
- `-t, --test`: Run tests after migration

Available batches:

- `unit`: Unit tests
- `dom`: DOM tests
- `integration`: Integration tests
- `content`: Content module tests
- `options`: Options module tests
- `popup`: Popup module tests
- `utils`: Utils module tests
- `pricefinder`: PriceFinder tests
- `performance`: Performance tests
- `observer`: Observer tests

Example:

```bash
# Migrate content module tests (dry run)
node scripts/batch-migrate-tests.js --dry-run content

# Migrate PriceFinder tests with auto-renaming and testing
node scripts/batch-migrate-tests.js --backup --rename --test pricefinder
```

## Recommended Migration Workflow

1. **Start with a dry run on a small batch**

   ```bash
   node scripts/batch-migrate-tests.js --dry-run --verbose performance
   ```

2. **Migrate a single file as a test**

   ```bash
   node scripts/jest-to-vitest-codemod.js --backup <single-file-path>
   node scripts/standardize-vitest-patterns.js --backup <vitest-file-path>
   npx vitest run <vitest-file-path>
   ```

3. **Proceed with batch migration**

   ```bash
   node scripts/batch-migrate-tests.js --backup --rename --test <batch-name>
   ```

4. **Review the migration report** generated after each batch

5. **Fix any failed migrations** manually

6. **Update migration status**

   ```bash
   node scripts/migration-status.js
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: migrate <batch-name> tests to Vitest"
   ```

## Troubleshooting

### Common Issues

1. **Performance API mocking**: If tests using the Performance API fail, you may need to add performance mocks manually:

   ```javascript
   // Add at the top of your test file
   const originalPerformance = global.performance;
   global.performance = {
     mark: vi.fn(),
     measure: vi.fn(),
     getEntriesByName: vi.fn().mockImplementation((name) => {
       return [{ name, startTime: 0, duration: 10, entryType: 'measure' }];
     }),
     clearMarks: vi.fn(),
     clearMeasures: vi.fn(),
   };

   // Add in afterEach
   afterEach(() => {
     global.performance = originalPerformance;
   });
   ```

2. **Import hoisting**: When using `vi.mock()`, make sure imports are hoisted correctly:

   ```javascript
   // Ensure vi.mock comes before imports of the mocked module
   vi.mock('./myModule');
   import { myFunction } from './myModule';
   ```

3. **Timer functions**: Ensure proper cleanup of timers:
   ```javascript
   afterEach(() => {
     vi.useRealTimers();
   });
   ```

### Getting Help

If you encounter issues not covered here:

1. Check the error messages in the migration report
2. Review the VITEST-PATTERNS.md document for guidance
3. Look at previously migrated files for examples
4. Update this document with any new learnings

## Additional Resources

- [Vitest Documentation](https://vitest.dev/api/)
- [VITEST-PATTERNS.md](./VITEST-PATTERNS.md)
- [JEST-VITEST-MIGRATION.md](./JEST-VITEST-MIGRATION.md)
