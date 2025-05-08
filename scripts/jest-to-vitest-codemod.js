#!/usr/bin/env node

/**
 * Codemod to automatically convert simple Jest patterns to Vitest
 *
 * This script uses filesystem operations and regexp-based transformations
 * to convert Jest patterns to their Vitest equivalents, making the
 * Jest to Vitest migration easier and more consistent.
 *
 * Usage:
 *   node scripts/jest-to-vitest-codemod.js [options] <path>
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
  .argument('<path>', 'Path to file or directory to transform')
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
  /\.vitest\.test\.js$/,
  /vitest\.setup\.js$/,
  /vitest\.config\.js$/,
  /vitest-imports\.js$/,
];

// Transformation rules for Jest to Vitest
const transformations = [
  // Replace jest.fn() with vi.fn()
  {
    pattern: /\bjest\.fn\(/g,
    replacement: 'vi.fn(',
  },

  // Replace jest.mock() with vi.mock()
  {
    pattern: /\bjest\.mock\(/g,
    replacement: 'vi.mock(',
  },

  // Replace jest.spyOn() with vi.spyOn()
  {
    pattern: /\bjest\.spyOn\(/g,
    replacement: 'vi.spyOn(',
  },

  // Replace jest.useFakeTimers() with vi.useFakeTimers()
  {
    pattern: /\bjest\.useFakeTimers\(/g,
    replacement: 'vi.useFakeTimers(',
  },

  // Replace jest.useRealTimers() with vi.useRealTimers()
  {
    pattern: /\bjest\.useRealTimers\(/g,
    replacement: 'vi.useRealTimers(',
  },

  // Replace jest.advanceTimersByTime() with vi.advanceTimersByTime()
  {
    pattern: /\bjest\.advanceTimersByTime\(/g,
    replacement: 'vi.advanceTimersByTime(',
  },

  // Replace jest.runAllTimers() with vi.runAllTimers()
  {
    pattern: /\bjest\.runAllTimers\(/g,
    replacement: 'vi.runAllTimers(',
  },

  // Replace jest.runOnlyPendingTimers() with vi.runOnlyPendingTimers()
  {
    pattern: /\bjest\.runOnlyPendingTimers\(/g,
    replacement: 'vi.runOnlyPendingTimers(',
  },

  // Replace jest.clearAllMocks() with resetTestMocks()
  {
    pattern: /\bjest\.clearAllMocks\(\)/g,
    replacement: 'resetTestMocks()',
  },

  // Replace jest.resetAllMocks() with resetTestMocks()
  {
    pattern: /\bjest\.resetAllMocks\(\)/g,
    replacement: 'resetTestMocks()',
  },

  // Replace mockImplementation, mockReturnValue, etc.
  {
    pattern: /\.mockImplementation\(/g,
    replacement: '.mockImplementation(',
  },

  {
    pattern: /\.mockReturnValue\(/g,
    replacement: '.mockReturnValue(',
  },

  {
    pattern: /\.mockResolvedValue\(/g,
    replacement: '.mockResolvedValue(',
  },

  {
    pattern: /\.mockRejectedValue\(/g,
    replacement: '.mockRejectedValue(',
  },
];

// No longer using predefined templates - generating dynamically based on file path

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
 * Check if file has Jest references
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file has Jest references
 */
function hasJestReferences(content) {
  return /\bjest\.\w+\(|\bdescribe\(|\bit\(|\btest\(|\bexpect\(|\bbeforeEach\(|\bafterEach\(/g.test(
    content
  );
}

/**
 * Check if file needs resetTestMocks
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file needs resetTestMocks
 */
function needsResetTestMocks(content) {
  return /\bjest\.clearAllMocks\(|\bjest\.resetAllMocks\(/g.test(content);
}

/**
 * Generate import statements based on file content
 *
 * @param {string} content - File content
 * @param {string} filePath - Path to file
 * @returns {string} - Import statements
 */
function generateImports(content, filePath) {
  // Calculate the relative path to setup helpers based on file location
  const fileDir = path.dirname(filePath);
  const srcDir = path.resolve(path.join(__dirname, '..', 'src'));

  // Get relative path from file to src/__tests__/setup/vitest-imports.js
  let setupPath = path.relative(
    fileDir,
    path.join(srcDir, '__tests__', 'setup', 'vitest-imports.js')
  );
  setupPath = setupPath.startsWith('.') ? setupPath : `./${setupPath}`;

  // Get relative path from file to vitest.setup.js
  let vitestSetupPath = path.relative(fileDir, path.join(srcDir, '..', 'vitest.setup.js'));
  vitestSetupPath = vitestSetupPath.startsWith('.') ? vitestSetupPath : `./${vitestSetupPath}`;

  // Determine if we need resetTestMocks
  const needsReset = needsResetTestMocks(content);

  // Generate import statements
  let imports = `import { describe, it, test, expect, beforeEach, afterEach, vi } from '${setupPath}';\n`;

  if (needsReset) {
    imports += `import { resetTestMocks } from '${vitestSetupPath}';\n`;
  }

  return imports;
}

/**
 * Transform a single file
 *
 * @param {string} filePath - Path to the file
 * @param {object} options - Transformation options
 * @returns {object} - Transformation result
 */
function transformFile(filePath, options) {
  try {
    if (shouldExcludeFile(filePath)) {
      if (options.verbose) {
        console.log(`Skipping excluded file: ${filePath}`);
      }
      return { status: 'skipped', message: 'File excluded by pattern' };
    }

    const source = fs.readFileSync(filePath, 'utf8');

    // Skip if no Jest references
    if (!hasJestReferences(source)) {
      if (options.verbose) {
        console.log(`No Jest references found in: ${filePath}`);
      }
      return { status: 'unchanged', message: 'No Jest references found' };
    }

    // Generate imports
    const imports = generateImports(source, filePath);

    // Apply transformations
    let transformedSource = source;
    let replaced = false;

    // Apply regex-based transformations
    transformations.forEach(({ pattern, replacement }) => {
      const newSource = transformedSource.replace(pattern, replacement);
      if (newSource !== transformedSource) {
        transformedSource = newSource;
        replaced = true;
      }
    });

    // Replace imports if needed
    if (replaced) {
      // Try to find and replace import statements
      const importRegex = /import\s+.*\s+from\s+['"].*['"]/;
      const firstImport = transformedSource.match(importRegex);

      if (firstImport) {
        // Insert our imports before the first import
        transformedSource = transformedSource.replace(
          firstImport[0],
          `${imports}${firstImport[0]}`
        );
      } else {
        // No imports found, add at the beginning
        // But skip any comments or license header
        const headerEnd = transformedSource.indexOf('*/');
        if (headerEnd !== -1) {
          transformedSource =
            transformedSource.substring(0, headerEnd + 2) +
            '\n\n' +
            imports +
            transformedSource.substring(headerEnd + 2);
        } else {
          transformedSource = imports + transformedSource;
        }
      }
    }

    if (!replaced) {
      return { status: 'unchanged', message: 'No transformations applied' };
    }

    if (!options.dryRun) {
      // Create backup if requested
      if (options.backup) {
        const backupPath = `${filePath}.bak`;
        fs.writeFileSync(backupPath, source);
      }

      // Write transformed code back to file
      fs.writeFileSync(filePath, transformedSource);
    }

    return {
      status: 'transformed',
      message: options.dryRun ? 'Transformation preview generated' : 'File transformed',
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Error transforming file: ${error.message}`,
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
    transformed: 0,
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
        results.transformed += subResults.transformed;
        results.unchanged += subResults.unchanged;
        results.skipped += subResults.skipped;
        results.error += subResults.error;
        Object.assign(results.files, subResults.files);
      } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(entry.name))) {
        // Process file
        const result = transformFile(entryPath, options);
        results.files[entryPath] = result;
        results[result.status]++;

        if (
          options.verbose ||
          result.status === 'error' ||
          (result.status === 'transformed' && !options.dryRun)
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
  console.log(`Jest to Vitest Codemod (${options.dryRun ? 'Dry Run' : 'Live Run'})`);
  console.log(`Processing ${targetPath}`);

  let results;

  // Check if target is a file or directory
  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    const result = transformFile(targetPath, options);
    results = {
      transformed: result.status === 'transformed' ? 1 : 0,
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
  console.log('\nTransformation Summary:');
  console.log(`- Files transformed: ${results.transformed}`);
  console.log(`- Files unchanged: ${results.unchanged}`);
  console.log(`- Files skipped: ${results.skipped}`);
  console.log(`- Errors: ${results.error}`);

  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
  }
}

// Run the script
main();
