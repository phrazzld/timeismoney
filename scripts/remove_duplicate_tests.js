#!/usr/bin/env node

/**
 * Script to remove duplicate Jest test files that have Vitest counterparts
 *
 * This script identifies test files that have both Jest (.test.js) and Vitest (.vitest.test.js)
 * versions, and removes the Jest versions to clean up the codebase.
 *
 * Usage:
 *   node scripts/remove_duplicate_tests.js [--dry-run]
 *
 * Options:
 *   --dry-run  Only print the files that would be removed, without actually removing them
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Process command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Define the base directory for tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsDir = path.join(__dirname, '..', 'src', '__tests__');

// Get a list of all Jest test files (excluding files with "vitest" in the name)
const jestTestFiles = execSync(`find ${testsDir} -type f -name "*.test.js" | grep -v "vitest"`, {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter((file) => file); // Filter out any empty lines

// Track removed files for reporting
const filesToRemove = [];

// Check each Jest test file for a Vitest counterpart
jestTestFiles.forEach((jestFile) => {
  const vitestFile = jestFile.replace('.test.js', '.vitest.test.js');

  if (fs.existsSync(vitestFile)) {
    filesToRemove.push({ jestFile, vitestFile });
  }
});

// Display the files that would be removed
console.log(`Found ${filesToRemove.length} duplicate test files:`);
filesToRemove.forEach(({ jestFile, vitestFile }) => {
  console.log(`  - ${jestFile} (has Vitest version: ${vitestFile})`);
});

// If not in dry run mode, actually remove the files
if (!dryRun && filesToRemove.length > 0) {
  console.log('\nRemoving Jest test files...');

  filesToRemove.forEach(({ jestFile }) => {
    try {
      fs.unlinkSync(jestFile);
      console.log(`  ✓ Removed: ${jestFile}`);
    } catch (error) {
      console.error(`  ✗ Error removing ${jestFile}:`, error.message);
    }
  });

  console.log(`\nRemoved ${filesToRemove.length} Jest test files.`);
  console.log('Migration to Vitest test files is now cleaner!');
} else if (dryRun) {
  console.log('\nDry run completed. No files were removed.');
  console.log('To actually remove these files, run the script without the --dry-run flag.');
}
