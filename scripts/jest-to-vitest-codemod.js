#!/usr/bin/env node

/**
 * Codemod to automatically convert Jest patterns to Vitest
 *
 * This enhanced script handles complex Jest to Vitest transformations including:
 * - Complex mock patterns with factory functions
 * - Performance API mocking for tests using performance metrics
 * - Advanced timer functions and lifecycle hooks
 * - Automatic file renaming and structure detection
 *
 * Usage:
 *   node scripts/jest-to-vitest-codemod.js [options] <path>
 *
 * Options:
 *   -d, --dry-run       Show transformations without modifying files
 *   -v, --verbose       Show detailed logs during transformation
 *   -b, --backup        Create backup files before applying transformations
 *   -r, --rename        Rename .test.js files to .vitest.test.js
 *   -p, --perf-mocks    Add Performance API mocks for tests using performance metrics
 *   -a, --add-hooks     Add beforeEach/afterEach hooks for test cleanup
 *   -h, --help          Display help information
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
  .option('-r, --rename', 'Rename .test.js files to .vitest.test.js', false)
  .option(
    '-p, --perf-mocks',
    'Add Performance API mocks for tests using performance metrics',
    false
  )
  .option('-a, --add-hooks', 'Add beforeEach/afterEach hooks for test cleanup', false)
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

  // Advanced timer functions
  {
    pattern: /jest\.advanceTimersByTime\((\d+)\)/g,
    replacement: 'vi.advanceTimersByTime($1)',
  },

  {
    pattern: /jest\.runAllTicks\(\)/g,
    replacement: 'vi.runAllTicks()',
  },

  {
    pattern: /jest\.runOnlyPendingTimers\(\)/g,
    replacement: 'vi.runOnlyPendingTimers()',
  },

  {
    pattern: /jest\.runTimersToTime\((\d+)\)/g,
    replacement: 'vi.advanceTimersByTime($1)',
  },

  // Complex mock pattern with factory function
  {
    pattern: /jest\.mock\(['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\{([^}]+)\}\)/g,
    replacement: "vi.mock('$1', () => {$2})",
  },

  // Specific mock returns
  {
    pattern: /jest\.mock\(['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\(([^)]+)\)\)/g,
    replacement: "vi.mock('$1', () => ($2))",
  },

  // Transform global jest references
  {
    pattern: /\/\*\s*global\s*(.*?)jest(.*?)\*\//g,
    replacement: '/* global $1vi$2*/',
  },

  // Replace jest import comment with vi (for eslint)
  {
    pattern: /\/\*\s*eslint-env\s+(.*?)jest(.*?)\*\//g,
    replacement: '/* eslint-env $1vitest$2*/',
  },

  // More specific mock related patterns based on our project
  {
    pattern: /mockBuildMatchPattern/g,
    replacement: 'mockBuildMatchPattern',
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
  // Check for explicit Jest usage
  const hasExplicitJest = /\bjest\.\w+\(/g.test(content);

  // Check for Jest imports
  const hasJestImports = /\bimport.*from\s+['"]jest['"]/g.test(content);

  // Check for global Jest references
  const hasGlobalJest = /\/\*\s*global\s+.*jest.*\*\//g.test(content);

  // Check for jest mock function calls
  const hasMockCalls = /(mock\w+|jest\.fn)/g.test(content);

  // Check for resetTestMocks calls (likely from Jest)
  const hasResetMocks = /resetTestMocks\(\)/g.test(content) && !content.includes('vi.');

  console.log('Checking for Jest references:', {
    hasExplicitJest,
    hasJestImports,
    hasGlobalJest,
    hasMockCalls,
    hasResetMocks,
  });

  // If file is a test file but doesn't use vi.* functions, it's probably a Jest file
  const isTestButNotVitest =
    content.includes('test(') && !content.includes('vi.') && !content.includes("from 'vitest'");

  // File needs conversion if any Jest reference exists or if it's a test file without Vitest
  return (
    hasExplicitJest ||
    hasJestImports ||
    hasGlobalJest ||
    hasMockCalls ||
    hasResetMocks ||
    isTestButNotVitest
  );
}

/**
 * Check if file needs resetTestMocks
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file needs resetTestMocks
 */
function needsResetTestMocks(content) {
  return /\bjest\.clearAllMocks\(|\bjest\.resetAllMocks\(|\bjest\.fn\(|\bjest\.spyOn\(|\bjest\.mock\(/g.test(
    content
  );
}

/**
 * Detect test type based on path and content
 *
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @returns {string} - Test type: 'unit', 'integration', 'dom', or 'unknown'
 */
function detectTestType(filePath, content) {
  // Check path patterns first
  if (filePath.includes('/dom/')) return 'dom';
  if (filePath.includes('/integration/')) return 'integration';
  if (filePath.includes('/unit/')) return 'unit';

  // Check content for DOM-specific patterns
  if (
    content.includes('document.') ||
    content.includes('window.') ||
    content.includes('HTMLElement') ||
    content.includes('querySelector')
  ) {
    return 'dom';
  }

  // Check for integration patterns
  if (content.includes('chrome.storage') || content.includes('browser.storage')) {
    return 'integration';
  }

  // Default to unit if no special patterns detected
  return 'unit';
}

/**
 * Check if file uses Performance API
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file uses Performance API
 */
function usesPerformanceAPI(content) {
  return /performance\.mark|performance\.measure|performance\.getEntriesByName/g.test(content);
}

/**
 * Generate Performance API mock template
 *
 * @returns {string} - Performance API mock code
 */
function generatePerformanceAPIMock() {
  return `
// Mock Performance API
const originalPerformance = global.performance;
global.performance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockImplementation((name) => {
    // Handle special cases for error measures
    if (name === 'Total Processing Error' || name === 'Total Processing Time (Error)') {
      return [{ name, startTime: 0, duration: 5, entryType: 'measure' }];
    }
    
    // Map of common performance measures
    const commonMeasures = {
      'batch-processing': [
        { name: 'batch-processing', startTime: 0, duration: 10, entryType: 'measure' },
      ],
      'Total Processing Time': [
        { name: 'Total Processing Time', startTime: 0, duration: 10, entryType: 'measure' },
      ],
      processPendingNodes: [
        { name: 'processPendingNodes', startTime: 0, duration: 10, entryType: 'measure' },
      ],
    };
    
    // Return the common measure if it exists, otherwise a default
    return commonMeasures[name] || [{ name, startTime: 0, duration: 10, entryType: 'measure' }];
  }),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

beforeEach(() => {
  // Reset performance mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore original performance API
  global.performance = originalPerformance;
});
`;
}

/**
 * Generate lifecycle hooks based on content
 *
 * @param {string} content - File content
 * @param {boolean} needsReset - Whether file needs resetTestMocks
 * @returns {string} - Lifecycle hooks code
 */
function generateLifecycleHooks(content, needsReset) {
  let hooks = '';

  // Add beforeEach if needed
  if (needsReset && !content.includes('beforeEach')) {
    hooks += `
beforeEach(() => {
  resetTestMocks();
});
`;
  }

  // Add afterEach for timer cleanup if needed
  if (content.includes('useFakeTimers') && !content.includes('afterEach')) {
    hooks += `
afterEach(() => {
  vi.useRealTimers();
});
`;
  }

  return hooks;
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

    // Detect test type
    const testType = detectTestType(filePath, transformedSource);
    if (options.verbose) {
      console.log(`Detected test type: ${testType}`);
    }

    // Add Performance API mocks if needed and requested
    if (options.perfMocks && usesPerformanceAPI(transformedSource)) {
      const perfMock = generatePerformanceAPIMock();

      // Find a good insertion point after imports
      const lastImportIndex = Math.max(
        transformedSource.lastIndexOf('import'),
        transformedSource.lastIndexOf('from')
      );

      if (lastImportIndex > 0) {
        const importEndIndex = transformedSource.indexOf(';', lastImportIndex) + 1;
        transformedSource =
          transformedSource.slice(0, importEndIndex) +
          '\n' +
          perfMock +
          transformedSource.slice(importEndIndex);
        replaced = true;
      }
    }

    // Add lifecycle hooks if requested
    if (options.addHooks) {
      const needsReset = needsResetTestMocks(transformedSource);
      const hooks = generateLifecycleHooks(transformedSource, needsReset);

      if (hooks) {
        // Find a good insertion point after imports but before tests
        const describeIndex = transformedSource.indexOf('describe(');
        if (describeIndex > 0) {
          transformedSource =
            transformedSource.slice(0, describeIndex) +
            hooks +
            transformedSource.slice(describeIndex);
          replaced = true;
        } else {
          // If no describe found, add at the end
          transformedSource += '\n' + hooks;
          replaced = true;
        }
      }
    }

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

      // Rename file if requested
      if (
        options.rename &&
        filePath.endsWith('.test.js') &&
        !filePath.endsWith('.vitest.test.js')
      ) {
        const newFilePath = filePath.replace('.test.js', '.vitest.test.js');
        if (!fs.existsSync(newFilePath)) {
          fs.renameSync(filePath, newFilePath);
          if (options.verbose) {
            console.log(`Renamed: ${filePath} -> ${newFilePath}`);
          }
          // Update the file path for the return status
          filePath = newFilePath;
        } else {
          console.warn(`Warning: Could not rename ${filePath} - target file already exists`);
        }
      }
    }

    return {
      status: 'transformed',
      message: options.dryRun ? 'Transformation preview generated' : 'File transformed',
      filePath: filePath, // Return the potentially updated file path
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
 * Generate a detailed report of transformations
 *
 * @param {object} results - Processing results
 * @returns {string} - Path to the generated report file
 */
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/[:T.Z]/g, '-');
  const reportPath = path.join(process.cwd(), `codemod-report-${timestamp}.md`);

  let report = '# Jest to Vitest Codemod Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += '## Summary\n\n';
  report += `- Files processed: ${results.transformed + results.unchanged + results.skipped + results.error}\n`;
  report += `- Files transformed: ${results.transformed}\n`;
  report += `- Files unchanged: ${results.unchanged}\n`;
  report += `- Files skipped: ${results.skipped}\n`;
  report += `- Errors: ${results.error}\n\n`;

  report += '## Transformed Files\n\n';
  for (const [filePath, result] of Object.entries(results.files)) {
    if (result.status === 'transformed') {
      report += `- ${result.filePath || filePath}\n`;
    }
  }

  report += '\n## Errors\n\n';
  for (const [filePath, result] of Object.entries(results.files)) {
    if (result.status === 'error') {
      report += `- ${filePath}: ${result.message}\n`;
    }
  }

  fs.writeFileSync(reportPath, report);
  return reportPath;
}

/**
 * Main execution function
 */
function main() {
  console.log(`Jest to Vitest Codemod (${options.dryRun ? 'Dry Run' : 'Live Run'})`);
  console.log(`Processing ${targetPath}`);

  // Log active options
  console.log('Active options:');
  console.log(`- Rename files: ${options.rename ? 'Yes' : 'No'}`);
  console.log(`- Add Performance API mocks: ${options.perfMocks ? 'Yes' : 'No'}`);
  console.log(`- Add lifecycle hooks: ${options.addHooks ? 'Yes' : 'No'}`);
  console.log(`- Create backups: ${options.backup ? 'Yes' : 'No'}`);

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
  } else {
    // Generate detailed report
    const reportPath = generateReport(results);
    console.log(`\nDetailed report written to: ${reportPath}`);
  }
}

// Run the script
main();
