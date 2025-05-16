#!/usr/bin/env node

/**
 * Script to consolidate similar test files in the Jest to Vitest migration
 *
 * This script identifies groups of related test files and consolidates them into single
 * comprehensive test files with proper organization using describe blocks.
 *
 * Usage:
 *   node scripts/consolidate-test-files.js [--dry-run] [--group=GROUP_NAME]
 *
 * Options:
 *   --dry-run     Only analyze and report, without making actual changes
 *   --group=NAME  Only process a specific group of test files (e.g., --group=priceFinder-currency)
 *                 Available groups: priceFinder-currency, priceFinder-pattern, priceFinder-features,
 *                                  converter, observer, formHandler, storage, performance
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const groupArg = args.find((arg) => arg.startsWith('--group='));
const targetGroup = groupArg ? groupArg.split('=')[1] : null;

// Define the base directory for tests
const testsDir = path.join(__dirname, '..', 'src', '__tests__');

// Define consolidation groups
const consolidationGroups = {
  'priceFinder-currency': {
    unit: {
      pattern: /priceFinder\.currency\.(part\d+\.)?unit\.vitest\.test\.js$/,
      outputFile: 'priceFinder.currency.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'content'),
    },
    integration: {
      pattern: /^priceFinder\.currency\.(part\d+\.)?vitest\.test\.js$/,
      outputFile: 'priceFinder.currency.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'content'),
    },
  },
  'priceFinder-pattern': {
    unit: {
      pattern: /priceFinder\.pattern\.part\d+\.unit\.vitest\.test\.js$/,
      outputFile: 'priceFinder.pattern.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'content'),
    },
    integration: {
      pattern: /^priceFinder\.pattern\.part\d+\.vitest\.test\.js$/,
      outputFile: 'priceFinder.pattern.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'content'),
    },
  },
  'priceFinder-features': {
    unit: {
      pattern:
        /priceFinder\.(additional-currencies|advanced|basic-patterns|edge-cases|enhanced|findPrices)\.unit\.vitest\.test\.js$/,
      outputFile: 'priceFinder.features.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'content'),
    },
    integration: {
      pattern:
        /^priceFinder\.(additional-currencies|advanced|basic-patterns|edge-cases|enhanced|findPrices)\.vitest\.test\.js$/,
      outputFile: 'priceFinder.features.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'content'),
    },
  },
  converter: {
    unit: {
      pattern: /converter\.(edge|unified)?\.?unit\.vitest\.test\.js$/,
      outputFile: 'converter.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'utils'),
    },
    integration: {
      pattern: /^converter\.(edge|unified)?\.?vitest\.test\.js$/,
      excludePattern: /\.unit\./,
      outputFile: 'converter.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'utils'),
    },
  },
  observer: {
    standard: {
      pattern: /^observer-(callback|stress)\.vitest\.test\.js$/,
      outputFile: 'observer.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'content'),
    },
    dom: {
      pattern: /observer-(callback|stress)\.dom\.vitest\.test\.js$/,
      outputFile: 'observer.consolidated.dom.vitest.test.js',
      baseDir: path.join(testsDir, 'dom', 'content'),
    },
  },
  formHandler: {
    unit: {
      pattern: /formHandler\.(error|storage|storage\.direct|xss)?\.?unit\.vitest\.test\.js$/,
      outputFile: 'formHandler.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'options'),
    },
    integration: {
      pattern: /formHandler\.(error|storage|storage\.direct|xss)?\.integration\.vitest\.test\.js$/,
      outputFile: 'formHandler.consolidated.integration.vitest.test.js',
      baseDir: path.join(testsDir, 'integration', 'options'),
    },
    standard: {
      pattern: /^formHandler\.(error|storage|storage\.direct|xss)?\.?vitest\.test\.js$/,
      excludePattern: /\.unit\.|\.integration\./,
      outputFile: 'formHandler.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'options'),
    },
  },
  storage: {
    unit: {
      pattern: /storage\.(error)?\.?unit\.vitest\.test\.js$/,
      outputFile: 'storage.consolidated.unit.vitest.test.js',
      baseDir: path.join(testsDir, 'unit', 'utils'),
    },
    integration: {
      pattern: /^storage\.(error)?\.?vitest\.test\.js$/,
      excludePattern: /\.unit\./,
      outputFile: 'storage.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'utils'),
    },
  },
  performance: {
    standard: {
      pattern: /^performance\.vitest\.test\.js$/,
      outputFile: 'performance.consolidated.vitest.test.js',
      baseDir: path.join(testsDir, 'content'),
    },
    dom: {
      pattern: /performance\.dom\.vitest\.test\.js$/,
      outputFile: 'performance.consolidated.dom.vitest.test.js',
      baseDir: path.join(testsDir, 'dom', 'content'),
    },
  },
};

// Utility to extract imports from a file
function extractImports(content) {
  const importLines = [];
  const nonImportLines = [];

  const lines = content.split('\n');

  let inMultilineImport = false;

  for (const line of lines) {
    if (inMultilineImport) {
      importLines.push(line);
      if (line.includes(';')) {
        inMultilineImport = false;
      }
    } else if (line.trim().startsWith('import ')) {
      importLines.push(line);
      if (!line.includes(';')) {
        inMultilineImport = true;
      }
    } else {
      nonImportLines.push(line);
    }
  }

  return { importLines, nonImportLines };
}

// Utility to deduplicate an array, preserving order
function deduplicateArray(array) {
  return [...new Set(array)];
}

// Find files matching a pattern in a directory
function findMatchingFiles(directory, pattern, excludePattern = null) {
  try {
    // Get all JavaScript files in the directory
    const files = fs
      .readdirSync(directory)
      .filter((file) => file.endsWith('.js'))
      .filter((file) => pattern.test(file));

    // Apply exclude pattern if provided
    if (excludePattern) {
      return files.filter((file) => !excludePattern.test(file));
    }

    return files;
  } catch (error) {
    console.error(`Error finding files in ${directory}:`, error.message);
    return [];
  }
}

// Merge test files into a single consolidated file
function mergeTestFiles(files, baseDir, outputFile) {
  // Track all imports and content
  let allImports = [];
  let allContent = [];

  // Original file list for metadata comment
  const originalFiles = files.join(', ');

  files.forEach((file) => {
    const filePath = path.join(baseDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { importLines, nonImportLines } = extractImports(content);

      // Add imports to the list
      allImports = [...allImports, ...importLines];

      // Add a separator comment with the original filename
      allContent.push('');
      allContent.push(`// ---------------------- From ${file} ----------------------`);
      allContent.push('');

      // Add the non-import content
      allContent = [...allContent, ...nonImportLines];
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  });

  // Deduplicate imports
  const uniqueImports = deduplicateArray(allImports);

  // Build the consolidated file content
  const header = [
    '/**',
    ' * Consolidated test file generated by consolidate-test-files.js script',
    ' * ',
    ' * Original files: ',
    ` * ${originalFiles}`,
    ' * ',
    ' * Generated: ' + new Date().toISOString(),
    ' */',
    '',
  ];

  const consolidatedContent = [...header, ...uniqueImports, ...allContent].join('\n');

  const outputPath = path.join(baseDir, outputFile);

  if (!dryRun) {
    try {
      fs.writeFileSync(outputPath, consolidatedContent, 'utf8');
      console.log(`  ✓ Created consolidated file: ${outputPath}`);
    } catch (error) {
      console.error(`  ✗ Error writing consolidated file ${outputPath}:`, error.message);
    }
  } else {
    console.log(`  (dry run) Would create consolidated file: ${outputPath}`);
    console.log(`  Would include ${files.length} files: ${files.join(', ')}`);
  }

  return {
    outputPath,
    includedFiles: files.map((file) => path.join(baseDir, file)),
  };
}

// Create backup of files to be consolidated
function createBackups(files) {
  if (dryRun) return;

  console.log('\nCreating backups of files to be consolidated...');

  files.forEach((filePath) => {
    try {
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`  ✓ Created backup: ${backupPath}`);
    } catch (error) {
      console.error(`  ✗ Error creating backup of ${filePath}:`, error.message);
    }
  });
}

// Process a specific consolidation group
function processConsolidationGroup(groupName, group) {
  console.log(`\nProcessing group: ${groupName}`);

  const results = [];

  // Process each subgroup
  for (const [subgroupName, subgroup] of Object.entries(group)) {
    console.log(`\nSubgroup: ${subgroupName}`);

    const { pattern, excludePattern, outputFile, baseDir } = subgroup;

    // Find files to consolidate
    const files = findMatchingFiles(baseDir, pattern, excludePattern);

    if (files.length <= 1) {
      console.log(`  No files to consolidate in ${baseDir} matching ${pattern}`);
      continue;
    }

    console.log(`  Found ${files.length} files to consolidate into ${outputFile}`);

    // Create backups before making any changes
    const filePaths = files.map((file) => path.join(baseDir, file));
    createBackups(filePaths);

    // Merge files into consolidated output
    const result = mergeTestFiles(files, baseDir, outputFile);
    results.push(result);

    // Log which files would be removed after consolidation
    if (!dryRun) {
      console.log('\n  Files to be cleaned up (run with --cleanup to remove):');
      files.forEach((file) => {
        console.log(`  - ${path.join(baseDir, file)}`);
      });
    }
  }

  return results;
}

// Run test for consolidated files
function runTestsForConsolidatedFile(outputPath) {
  if (dryRun) return true;

  try {
    console.log(`\nRunning tests for consolidated file: ${outputPath}`);
    execSync(`npx vitest run ${outputPath}`, { stdio: 'inherit' });
    console.log(`  ✓ Tests passed for ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Tests failed for ${outputPath}`);
    return false;
  }
}

// Main function
function main() {
  console.log(`Jest to Vitest - Consolidate Test Files Tool`);
  console.log(`Mode: ${dryRun ? 'Dry Run (analysis only)' : 'Active (making changes)'}`);

  const groupsToProcess = targetGroup
    ? { [targetGroup]: consolidationGroups[targetGroup] }
    : consolidationGroups;

  if (targetGroup && !consolidationGroups[targetGroup]) {
    console.error(`Error: Group '${targetGroup}' not found`);
    console.log('Available groups:', Object.keys(consolidationGroups).join(', '));
    process.exit(1);
  }

  // Process each specified group
  const results = [];
  for (const [groupName, group] of Object.entries(groupsToProcess)) {
    const groupResults = processConsolidationGroup(groupName, group);
    results.push(...groupResults);
  }

  // Run tests for consolidated files
  let allTestsPassed = true;
  if (!dryRun) {
    for (const result of results) {
      const testsPassed = runTestsForConsolidatedFile(result.outputPath);
      if (!testsPassed) {
        allTestsPassed = false;
        console.log(
          '\n⚠️ Some tests failed for the consolidated file. Original files are preserved.'
        );
      }
    }
  }

  // Print summary
  console.log('\n=== Consolidation Summary ===');
  console.log(`Total groups processed: ${Object.keys(groupsToProcess).length}`);
  console.log(`Total consolidated files created: ${results.length}`);

  if (!dryRun) {
    console.log(
      `Overall test status: ${allTestsPassed ? '✅ All tests passed' : '❌ Some tests failed'}`
    );
    console.log(
      '\nTo cleanup original files after confirming the consolidated files work correctly:'
    );
    console.log('1. Run tests on all consolidated files: npm test');
    console.log('2. If all tests pass, you can safely delete the original files');
  } else {
    console.log('\nTo apply these changes, run the script without the --dry-run flag');
  }

  console.log('\nAvailable groups for targeted consolidation:');
  console.log(Object.keys(consolidationGroups).join(', '));
}

// Run the script
main();
