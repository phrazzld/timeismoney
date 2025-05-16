#!/usr/bin/env node

/**
 * Script to standardize Vitest patterns across test files
 *
 * This tool enforces consistent patterns in Vitest test files by:
 * 1. Replacing direct Vitest imports with imports from our helper
 * 2. Adding resetTestMocks import and setup when needed
 * 3. Ensuring consistent file naming and formatting
 * 4. Adding proper mock cleanup in afterEach hooks
 *
 * Usage:
 *   node scripts/standardize-vitest-patterns.js [options] <path>
 *
 * Options:
 *   -d, --dry-run     Show transformations without modifying files
 *   -v, --verbose     Show detailed logs during transformation
 *   -h, --help        Display help information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up command line arguments
program
  .argument('<path>', 'Path to file or directory to standardize')
  .option('-d, --dry-run', 'Show transformations without modifying files', false)
  .option('-v, --verbose', 'Show detailed logs during transformation', false)
  .option('-b, --backup', 'Create backup files before applying transformations', false)
  .parse(process.argv);

const options = program.opts();
const targetPath = program.args[0] || path.join(__dirname, '..', 'src/__tests__');

// File extensions to process
const FILE_EXTENSIONS = ['.js', '.jsx'];

// Files to exclude from processing
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /vitest\.setup\.js$/,
  /vitest\.config\.js$/,
  /vitest-imports\.js$/,
];

// Path to our Vitest imports helper
const VITEST_IMPORTS_PATH = 'src/__tests__/setup/vitest-imports.js';
const VITEST_SETUP_PATH = 'vitest.setup.js';

/**
 * Check if a file should be excluded from processing
 *
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file should be excluded
 */
function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Check if file has Vitest references
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file has Vitest references
 */
function hasVitestReferences(content) {
  return /\bvi\.\w+\(|\bdescribe\(|\bit\(|\btest\(|\bexpect\(|\bbeforeEach\(|\bafterEach\(/g.test(
    content
  );
}

/**
 * Generate relative import path
 *
 * @param {string} fromPath - Source file path
 * @param {string} toPath - Target module path
 * @returns {string} - Relative import path
 */
function generateRelativeImportPath(fromPath, toPath) {
  const projectRoot = path.resolve(__dirname, '..');
  const absoluteToPath = path.join(projectRoot, toPath);
  const fileDir = path.dirname(path.resolve(fromPath));

  let relativePath = path.relative(fileDir, absoluteToPath);
  relativePath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

  // Convert Windows backslashes to forward slashes for import statements
  return relativePath.replace(/\\/g, '/');
}

/**
 * Standardize imports in a file
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to the file
 * @returns {string} - Standardized content
 */
function standardizeImports(content, filePath) {
  // Generate relative import paths
  const vitestImportsPath = generateRelativeImportPath(filePath, VITEST_IMPORTS_PATH);
  const vitestSetupPath = generateRelativeImportPath(filePath, VITEST_SETUP_PATH);

  // Replace direct Vitest imports
  const directImportRegex = /import\s+{([^}]+)}\s+from\s+['"]vitest['"]/g;

  let standardizedContent = content.replace(directImportRegex, (match, importNames) => {
    return `import {${importNames}} from '${vitestImportsPath}'`;
  });

  // Check if we need resetTestMocks
  const needsResetTestMocks =
    /vi\.fn\(|vi\.spyOn\(|vi\.mock\(/.test(standardizedContent) &&
    !/resetTestMocks/.test(standardizedContent);

  if (needsResetTestMocks) {
    // Try to find existing imports to append to
    const lastImportIndex = standardizedContent.lastIndexOf('import ');

    if (lastImportIndex !== -1) {
      const importEndIndex = standardizedContent.indexOf(';', lastImportIndex) + 1;
      standardizedContent =
        standardizedContent.slice(0, importEndIndex) +
        `\nimport { resetTestMocks } from '${vitestSetupPath}';` +
        standardizedContent.slice(importEndIndex);
    } else {
      // No imports found, add at the beginning
      standardizedContent = `import { resetTestMocks } from '${vitestSetupPath}';\n\n${standardizedContent}`;
    }
  }

  return standardizedContent;
}

/**
 * Add beforeEach hook with resetTestMocks if needed
 *
 * @param {string} content - File content
 * @returns {string} - Content with beforeEach hook
 */
function addResetTestMocksHook(content) {
  // Check if we need resetTestMocks and it's imported
  const needsResetTestMocks =
    /vi\.fn\(|vi\.spyOn\(|vi\.mock\(/.test(content) && /resetTestMocks/.test(content);

  if (!needsResetTestMocks) {
    return content;
  }

  // Check if hook already exists
  const hookExists = /beforeEach\(\s*\(\)\s*=>\s*{\s*resetTestMocks\(\);?\s*}\);/.test(content);

  if (hookExists) {
    return content;
  }

  const hook = '\nbeforeEach(() => {\n  resetTestMocks();\n});\n\n';

  // Try to find a good insertion point
  const lastImportIndex = content.lastIndexOf('import ');

  if (lastImportIndex !== -1) {
    const importEndIndex = content.indexOf(';', lastImportIndex) + 1;
    const nextLineIndex = content.indexOf('\n', importEndIndex);

    if (nextLineIndex !== -1) {
      return content.slice(0, nextLineIndex + 1) + hook + content.slice(nextLineIndex + 1);
    }
  }

  // Fallback: find first test block
  const describeIndex = content.indexOf('describe(');

  if (describeIndex !== -1) {
    return content.slice(0, describeIndex) + hook + content.slice(describeIndex);
  }

  // Last resort: add to the end
  return content + '\n' + hook;
}

/**
 * Standardize afterEach cleanup
 *
 * @param {string} content - File content
 * @returns {string} - Content with standardized afterEach
 */
function standardizeAfterEach(content) {
  // Check if file uses timers or mocks
  const usesTimers = /vi\.useFakeTimers\(/.test(content);
  const usesMocks = /vi\.fn\(|vi\.spyOn\(|vi\.mock\(/.test(content);

  if (!usesTimers && !usesMocks) {
    return content;
  }

  // Check if afterEach already exists
  const hasAfterEach = /afterEach\(/.test(content);

  if (hasAfterEach) {
    // Enhance existing afterEach
    return content.replace(/afterEach\(\s*\(\)\s*=>\s*{([^}]*)}\);/g, (match, body) => {
      let newBody = body;

      if (usesTimers && !body.includes('useRealTimers')) {
        newBody += '\n  vi.useRealTimers();';
      }

      if (usesMocks && !body.includes('resetTestMocks')) {
        newBody += '\n  resetTestMocks();';
      }

      return `afterEach(() => {${newBody}\n});`;
    });
  } else {
    // Create new afterEach
    let afterEachBody = '';

    if (usesTimers) {
      afterEachBody += '\n  vi.useRealTimers();';
    }

    if (usesMocks) {
      afterEachBody += '\n  resetTestMocks();';
    }

    const afterEachHook = `\nafterEach(() => {${afterEachBody}\n});\n\n`;

    // Find insertion point after beforeEach or before first test
    const beforeEachIndex = content.indexOf('beforeEach(');

    if (beforeEachIndex !== -1) {
      const beforeEachEnd = content.indexOf('});', beforeEachIndex) + 3;
      return content.slice(0, beforeEachEnd) + afterEachHook + content.slice(beforeEachEnd);
    }

    // Find first test
    const describeIndex = content.indexOf('describe(');

    if (describeIndex !== -1) {
      return content.slice(0, describeIndex) + afterEachHook + content.slice(describeIndex);
    }

    // Add to the end
    return content + '\n' + afterEachHook;
  }
}

/**
 * Standardize a single file
 *
 * @param {string} filePath - Path to the file
 * @param {object} options - Standardization options
 * @returns {object} - Standardization result
 */
function standardizeFile(filePath, options) {
  try {
    if (shouldExcludeFile(filePath)) {
      if (options.verbose) {
        console.log(`Skipping excluded file: ${filePath}`);
      }
      return { status: 'skipped', message: 'File excluded by pattern' };
    }

    // Check if file is a Vitest test
    if (!filePath.endsWith('.vitest.test.js') && !filePath.endsWith('.test.js')) {
      if (options.verbose) {
        console.log(`Not a test file: ${filePath}`);
      }
      return { status: 'skipped', message: 'Not a test file' };
    }

    const source = fs.readFileSync(filePath, 'utf8');

    // Skip if no Vitest references
    if (!hasVitestReferences(source)) {
      if (options.verbose) {
        console.log(`No Vitest references found in: ${filePath}`);
      }
      return { status: 'skipped', message: 'No Vitest references found' };
    }

    // Apply standardizations
    let standardizedContent = source;
    standardizedContent = standardizeImports(standardizedContent, filePath);
    standardizedContent = addResetTestMocksHook(standardizedContent);
    standardizedContent = standardizeAfterEach(standardizedContent);

    // Check if anything changed
    if (standardizedContent === source) {
      return { status: 'unchanged', message: 'No standardizations needed' };
    }

    if (!options.dryRun) {
      // Create backup if requested
      if (options.backup) {
        const backupPath = `${filePath}.bak`;
        fs.writeFileSync(backupPath, source);
      }

      // Write standardized code back to file
      fs.writeFileSync(filePath, standardizedContent);
    }

    return {
      status: 'standardized',
      message: options.dryRun ? 'Standardization preview generated' : 'File standardized',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error standardizing file: ${error.message}`,
    };
  }
}

/**
 * Recursively process files in a directory
 *
 * @param {string} dirPath - Path to the directory
 * @param {object} options - Processing options
 * @returns {object} - Processing results
 */
function processDirectory(dirPath, options) {
  const results = {
    standardized: 0,
    unchanged: 0,
    skipped: 0,
    error: 0,
    files: {},
  };

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Process subdirectory
        const subResults = processDirectory(entryPath, options);

        // Aggregate results
        results.standardized += subResults.standardized;
        results.unchanged += subResults.unchanged;
        results.skipped += subResults.skipped;
        results.error += subResults.error;
        Object.assign(results.files, subResults.files);
      } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(entry.name))) {
        // Process file
        const result = standardizeFile(entryPath, options);
        results.files[entryPath] = result;
        results[result.status]++;

        if (
          options.verbose ||
          result.status === 'error' ||
          (result.status === 'standardized' && !options.dryRun)
        ) {
          console.log(`${entryPath}: ${result.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dirPath}: ${error.message}`);
    results.error++;
  }

  return results;
}

/**
 * Main execution function
 */
function main() {
  console.log(`Vitest Pattern Standardizer (${options.dryRun ? 'Dry Run' : 'Live Run'})`);
  console.log(`Processing ${targetPath}`);

  let results;

  // Check if target is a file or directory
  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    const result = standardizeFile(targetPath, options);
    results = {
      standardized: result.status === 'standardized' ? 1 : 0,
      unchanged: result.status === 'unchanged' ? 1 : 0,
      skipped: result.status === 'skipped' ? 1 : 0,
      error: result.status === 'error' ? 1 : 0,
      files: { [targetPath]: result },
    };

    console.log(`${targetPath}: ${result.message}`);
  } else if (stats.isDirectory()) {
    results = processDirectory(targetPath, options);
  } else {
    console.error(`Invalid path: ${targetPath}`);
    process.exit(1);
  }

  // Print summary
  console.log('\nStandardization Summary:');
  console.log(`- Files standardized: ${results.standardized}`);
  console.log(`- Files unchanged: ${results.unchanged}`);
  console.log(`- Files skipped: ${results.skipped}`);
  console.log(`- Errors: ${results.error}`);

  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
  }
}

// Run the script
main();
