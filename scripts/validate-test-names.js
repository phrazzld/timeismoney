#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Validates that all staged test files follow the correct naming convention.
 * Test files must use the pattern: *.vitest.test.js
 *
 * Special cases:
 * - Files in the __tests__/mocks/ directory are excluded from validation
 *   as they are mock implementations used by tests, not test files themselves.
 */
function validateTestFileNames() {
  try {
    // Get list of staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    // Filter for test files
    const testFiles = stagedFiles.filter(
      (file) =>
        // Include files that are in __tests__ directory but not in the mocks directory,
        // setup directory, or test-pages directory
        (file.includes('__tests__') &&
          !file.includes('__tests__/mocks/') &&
          !file.includes('__tests__/setup/') &&
          !file.includes('__tests__/test-pages/')) ||
        // Or files that explicitly have .test. or .spec. in their name
        file.includes('.test.') ||
        file.includes('.spec.')
    );

    // Check if any test files don't match our pattern
    const invalidTestFiles = testFiles.filter((file) => {
      // Skip non-JS files
      if (!file.endsWith('.js')) return false;

      // Valid pattern is *.vitest.test.js
      return !file.endsWith('.vitest.test.js');
    });

    if (invalidTestFiles.length > 0) {
      console.error('\n❌ Error: Test files must follow the naming convention: *.vitest.test.js\n');
      console.error('Invalid test files:');
      invalidTestFiles.forEach((file) => {
        console.error(`  - ${file}`);
      });
      console.error('\nPlease rename the files to match the pattern: *.vitest.test.js');
      console.error('Example: storage.test.js → storage.vitest.test.js\n');
      process.exit(1);
    }

    // All test files are valid
    if (testFiles.length > 0) {
      console.log('✅ All test files follow the correct naming convention');
    }
  } catch (error) {
    console.error('Error validating test file names:', error.message);
    process.exit(1);
  }
}

// Run the validation
validateTestFileNames();
