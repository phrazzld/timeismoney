/**
 * Script to find test files with global-level hooks
 *
 * This script scans test files to identify those with hooks like beforeEach and afterEach
 * at the global scope, which need to be moved inside describe blocks.
 *
 * Usage:
 * node scripts/find-global-hooks.js [path]
 *
 * If path is not provided, it defaults to 'src/__tests__'
 */

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Get file location equivalent in ESM (removed for now as it's unused)

// Patterns to look for to identify global hooks
const GLOBAL_HOOK_PATTERNS = [
  /^beforeEach\s*\(/m,
  /^afterEach\s*\(/m,
  /^beforeAll\s*\(/m,
  /^afterAll\s*\(/m,
];

/**
 * Check if a file contains global-level hooks
 *
 * @param {string} filePath - Path to the file to check
 * @returns {object} Object with file info and detected hooks
 */
function checkForGlobalHooks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hooks = [];

    // Check for each hook pattern
    for (const pattern of GLOBAL_HOOK_PATTERNS) {
      if (pattern.test(content)) {
        const hookName = pattern.toString().match(/^([a-zA-Z]+)/)[1];
        hooks.push(hookName);
      }
    }

    // Only return files that have hooks
    if (hooks.length > 0) {
      return {
        filePath,
        hooks,
        hasDescribe: /describe\s*\(/.test(content),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Find all test files with global hooks
 *
 * @param {string} searchPath - Base path to search in
 * @returns {Promise<Array>} Array of file info objects
 */
function findFilesWithGlobalHooks(searchPath) {
  try {
    // Find all Vitest test files
    const pattern = path.join(searchPath, '**/*.vitest.test.js');
    const files = globSync(pattern);

    // Check each file for global hooks
    const results = [];
    for (const file of files) {
      const result = checkForGlobalHooks(file);
      if (result) {
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
}

/**
 * Main function to run the script
 */
function main() {
  const searchPath = process.argv[2] || 'src/__tests__';
  console.log(`Searching for files with global hooks in: ${searchPath}\n`);

  const filesWithHooks = findFilesWithGlobalHooks(searchPath);

  if (filesWithHooks.length === 0) {
    console.log('No files found with global hooks.');
    return;
  }

  console.log(`Found ${filesWithHooks.length} files with global hooks:\n`);

  // Group by category
  const byCategory = {};
  for (const file of filesWithHooks) {
    const category = path.dirname(file.filePath).split(path.sep).slice(-2).join('/');
    byCategory[category] = byCategory[category] || [];
    byCategory[category].push(file);
  }

  // Print results by category
  for (const [category, files] of Object.entries(byCategory)) {
    console.log(`\n=== ${category} (${files.length} files) ===`);
    for (const file of files) {
      console.log(`- ${path.basename(file.filePath)}`);
      console.log(`  Hooks: ${file.hooks.join(', ')}`);
      console.log(`  Has describe block: ${file.hasDescribe ? 'Yes' : 'No'}`);
    }
  }

  // Output summary
  console.log('\n=== Summary ===');
  console.log(`Total files with global hooks: ${filesWithHooks.length}`);
  const byHook = {};
  for (const file of filesWithHooks) {
    for (const hook of file.hooks) {
      byHook[hook] = (byHook[hook] || 0) + 1;
    }
  }
  for (const [hook, count] of Object.entries(byHook)) {
    console.log(`${hook}: ${count} files`);
  }
}

// Run the script
try {
  main();
} catch (error) {
  console.error('Script error:', error);
  process.exit(1);
}
