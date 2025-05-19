# Jest to Vitest Migration Tools

This directory contains tools to automate the migration of Jest tests to Vitest. These tools are designed to work together to provide a streamlined migration workflow.

## Overview

The migration process is divided into the following steps:

1. **Codemod**: Transform Jest syntax to Vitest syntax
2. **Standardization**: Enforce consistent patterns across migrated files
3. **Testing**: Verify migrated tests pass
4. **Reporting**: Generate detailed reports on migration progress

## Tools

### 1. `jest-to-vitest-codemod.js`

This script automatically transforms Jest code patterns to Vitest patterns in test files.

```bash
node scripts/jest-to-vitest-codemod.js [options] <path>
```

**Options:**

- `-d, --dry-run`: Show transformations without modifying files
- `-v, --verbose`: Show detailed logs during transformation
- `-b, --backup`: Create backup files before applying transformations
- `-r, --rename`: Rename .test.js files to .vitest.test.js
- `-p, --perf-mocks`: Add Performance API mocks for tests using performance metrics
- `-a, --add-hooks`: Add beforeEach/afterEach hooks for test cleanup
- `-h, --help`: Display help information

**Examples:**

```bash
# Dry run on a single file
node scripts/jest-to-vitest-codemod.js -d -v src/__tests__/unit/utils/converter.test.js

# Transform all tests in a directory with backups
node scripts/jest-to-vitest-codemod.js -v -b -r src/__tests__/unit/

# Add Performance API mocks to performance tests
node scripts/jest-to-vitest-codemod.js -v -p src/__tests__/content/performance.test.js
```

### 2. `standardize-vitest-patterns.js`

This script enforces consistent patterns in Vitest test files, focusing on imports, lifecycle hooks, and cleanup.

```bash
node scripts/standardize-vitest-patterns.js [options] <path>
```

**Options:**

- `-d, --dry-run`: Show standardizations without modifying files
- `-v, --verbose`: Show detailed logs during standardization
- `-b, --backup`: Create backup files before applying standardizations
- `-h, --help`: Display help information

**Examples:**

```bash
# Dry run on a single file
node scripts/standardize-vitest-patterns.js -d -v src/__tests__/unit/utils/converter.vitest.test.js

# Standardize all tests in a directory
node scripts/standardize-vitest-patterns.js -v src/__tests__/unit/
```

### 3. `batch-migrate-tests.js`

This script automates the entire migration process for batches of files based on test type.

```bash
node scripts/batch-migrate-tests.js [options] <batch-name> [file-path]
```

**Arguments:**

- `batch-name`: Name of the batch to process (unit, dom, integration, etc.)
- `file-path`: Optional specific file path to process instead of the entire batch

**Options:**

- `-d, --dry-run`: Show transformations without modifying files
- `-v, --verbose`: Show detailed logs during migration
- `-b, --backup`: Create backup files before applying transformations
- `-r, --rename`: Rename test files to .vitest.test.js
- `-t, --test`: Run tests after migration
- `-h, --help`: Display help information

**Available batches:**

- `unit`: Unit tests
- `dom`: DOM tests
- `integration`: Integration tests
- `content`: Content module tests
- `options`: Options module tests
- `popup`: Popup module tests
- `utils`: Utils module tests
- `performance`: Performance tests
- `observer`: Observer tests
- `sample`: Sample test files (for testing the migration script)

**Examples:**

```bash
# Dry run on unit tests
node scripts/batch-migrate-tests.js -d -v unit

# Migrate content tests with renaming and testing
node scripts/batch-migrate-tests.js -v -r -t content

# Migrate a specific test file as part of the performance batch
node scripts/batch-migrate-tests.js -v -r -t performance src/__tests__/content/performance.test.js

# Test the migration on a sample file
node scripts/batch-migrate-tests.js -d -v sample path/to/sample.test.js
```

### 4. `test-batch-migration.js`

This script tests the migration workflow on a sample test file without modifying the actual codebase.

```bash
node scripts/test-batch-migration.js
```

## Migration Workflow

For a successful migration, follow these steps:

1. **Preparation**:

   - Create a backup branch of the current codebase
   - Run the test script to verify the workflow

   ```bash
   node scripts/test-batch-migration.js
   ```

2. **Batch Migration**:

   - Start with simple test types (unit tests)
   - Run a dry run first

   ```bash
   node scripts/batch-migrate-tests.js -d -v unit
   ```

   - If dry run looks good, run the actual migration

   ```bash
   node scripts/batch-migrate-tests.js -v -r -t unit
   ```

   - Check the generated report and fix any issues
   - Continue with other test types

3. **Cleanup**:

   - Run standardization on all test files

   ```bash
   node scripts/standardize-vitest-patterns.js src/__tests__
   ```

   - Run ESLint to ensure all files follow project standards

   ```bash
   npm run lint
   ```

4. **Validation**:
   - Run the full test suite
   ```bash
   npm test
   ```

## Troubleshooting

### Common Issues

#### Error: Performance API mocking issues

- **Solution**: Use the `-p` flag with the codemod to add proper Performance API mocking

```bash
node scripts/jest-to-vitest-codemod.js -v -p path/to/file.test.js
```

#### Error: Test environment mismatch

- **Solution**: Check vitest.config.js to ensure the test environment matches the test type

```javascript
// Unit tests should use node environment
test: {
  environment: 'node';
}

// DOM tests should use jsdom environment
test: {
  environment: 'jsdom';
}
```

#### Error: resetTestMocks is not defined

- **Solution**: Run the standardization script to add proper imports

```bash
node scripts/standardize-vitest-patterns.js path/to/file.vitest.test.js
```

## See Also

- [TODO-ACCELERATED.md](../TODO-ACCELERATED.md): Detailed migration plan with tasks and status
- [VITEST-PATTERNS.md](../VITEST-PATTERNS.md): Documentation on Vitest patterns specific to this project
- [JEST-VITEST-MIGRATION.md](../JEST-VITEST-MIGRATION.md): Comprehensive migration guide
