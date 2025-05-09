#!/usr/bin/env node

/**
 * Batch migrates Jest tests to Vitest
 *
 * This script automates the Jest to Vitest migration process by:
 * 1. Running the codemod to convert Jest to Vitest syntax
 * 2. Running the standardization script to enforce consistent patterns
 * 3. Running tests to verify the migration
 * 4. Generating a report of the migration results
 *
 * Usage:
 *   node scripts/batch-migrate-tests.js [options] <batch-name>
 *
 * Options:
 *   -d, --dry-run      Show transformations without modifying files
 *   -v, --verbose      Show detailed logs during transformation
 *   -b, --backup       Create backup files before applying transformations
 *   -r, --rename       Rename test files to .vitest.test.js
 *   -t, --test         Run tests after migration
 *   -h, --help         Display help information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { execSync } from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up command line arguments
program
  .argument('<batch-name>', 'Name of the batch to process (unit, dom, integration, etc.)')
  .option('-d, --dry-run', 'Show transformations without modifying files', false)
  .option('-v, --verbose', 'Show detailed logs during transformation', false)
  .option('-b, --backup', 'Create backup files before applying transformations', false)
  .option('-r, --rename', 'Rename test files to .vitest.test.js', false)
  .option('-t, --test', 'Run tests after migration', false)
  .parse(process.argv);

const options = program.opts();
const batchName = program.args[0];

// Define batch configurations
const batchConfigs = {
  unit: {
    pattern: 'src/__tests__/unit/**/*.test.js',
    description: 'Unit tests',
  },
  dom: {
    pattern: 'src/__tests__/dom/**/*.test.js',
    description: 'DOM tests',
  },
  integration: {
    pattern: 'src/__tests__/integration/**/*.test.js',
    description: 'Integration tests',
  },
  content: {
    pattern: 'src/__tests__/content/**/*.test.js',
    description: 'Content module tests',
  },
  options: {
    pattern: 'src/__tests__/options/**/*.test.js',
    description: 'Options module tests',
  },
  popup: {
    pattern: 'src/__tests__/popup/**/*.test.js',
    description: 'Popup module tests',
  },
  utils: {
    pattern: 'src/__tests__/utils/**/*.test.js',
    description: 'Utils module tests',
  },
  pricefinder: {
    pattern: 'src/__tests__/**/priceFinder*.test.js',
    description: 'PriceFinder tests',
  },
  performance: {
    pattern: 'src/__tests__/**/performance*.test.js',
    description: 'Performance tests',
  },
  observer: {
    pattern: 'src/__tests__/**/observer*.test.js',
    description: 'Observer tests',
  },
  // Add more batch configurations as needed
};

// Validate batch name
if (!batchConfigs[batchName]) {
  console.error(`Unknown batch name: ${batchName}`);
  console.log('Available batches:');
  for (const [name, config] of Object.entries(batchConfigs)) {
    console.log(`  ${name}: ${config.description}`);
  }
  process.exit(1);
}

/**
 * Find files matching a glob pattern
 *
 * @param {string} pattern - Glob pattern
 * @returns {string[]} - Matching file paths
 */
function findFiles(pattern) {
  try {
    // Use glob pattern to find files
    const glob = (pattern) => {
      // Simple glob implementation for this script
      const files = [];
      const basePath = pattern.split('*')[0];

      function traverse(dir, currentPath) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            traverse(fullPath, relativePath);
          } else if (entry.isFile() && relativePath.includes('.test.js')) {
            // Check if the relative path matches the pattern
            if (pattern.includes('**') || relativePath.includes(pattern.replace('*', ''))) {
              files.push(fullPath);
            }
          }
        }
      }

      traverse(path.resolve(process.cwd(), basePath), '');
      return files;
    };

    return glob(pattern);
  } catch (error) {
    console.error(`Error finding files matching pattern ${pattern}:`, error);
    return [];
  }
}

/**
 * Run the codemod script on a list of files
 *
 * @param {string[]} files - List of file paths
 * @param {object} options - Command line options
 * @returns {object} - Result of the codemod operation
 */
function runCodemod(files, options) {
  const results = {
    success: 0,
    failure: 0,
    skipped: 0,
    details: {},
  };

  for (const file of files) {
    try {
      console.log(`Running codemod on ${file}...`);

      const codemodOptions = [
        options.dryRun ? '--dry-run' : '',
        options.verbose ? '--verbose' : '',
        options.backup ? '--backup' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const codemodCommand = `node ${path.join(__dirname, 'jest-to-vitest-codemod.js')} ${codemodOptions} "${file}"`;

      const output = execSync(codemodCommand, { encoding: 'utf8' });

      if (output.includes('Error') || output.includes('error')) {
        results.failure++;
        results.details[file] = { status: 'failure', output };
        console.error(`Error running codemod on ${file}:`);
        console.error(output);
      } else {
        results.success++;
        results.details[file] = { status: 'success', output };
        if (options.verbose) {
          console.log(output);
        }
      }
    } catch (error) {
      results.failure++;
      results.details[file] = { status: 'failure', error: error.message };
      console.error(`Error running codemod on ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Run the standardization script on a list of files
 *
 * @param {string[]} files - List of file paths
 * @param {object} options - Command line options
 * @returns {object} - Result of the standardization operation
 */
function runStandardization(files, options) {
  const results = {
    success: 0,
    failure: 0,
    skipped: 0,
    details: {},
  };

  for (const file of files) {
    try {
      console.log(`Running standardization on ${file}...`);

      // If we're renaming files, update the path
      const actualFile = options.rename ? file.replace('.test.js', '.vitest.test.js') : file;

      // Skip if file doesn't exist (wasn't created by codemod)
      if (!fs.existsSync(actualFile)) {
        results.skipped++;
        results.details[actualFile] = { status: 'skipped', reason: 'File does not exist' };
        continue;
      }

      const standardizeOptions = [
        options.dryRun ? '--dry-run' : '',
        options.verbose ? '--verbose' : '',
        options.backup ? '--backup' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const standardizeCommand = `node ${path.join(__dirname, 'standardize-vitest-patterns.js')} ${standardizeOptions} "${actualFile}"`;

      const output = execSync(standardizeCommand, { encoding: 'utf8' });

      if (output.includes('Error') || output.includes('error')) {
        results.failure++;
        results.details[actualFile] = { status: 'failure', output };
        console.error(`Error standardizing ${actualFile}:`);
        console.error(output);
      } else {
        results.success++;
        results.details[actualFile] = { status: 'success', output };
        if (options.verbose) {
          console.log(output);
        }
      }
    } catch (error) {
      results.failure++;
      results.details[file] = { status: 'failure', error: error.message };
      console.error(`Error standardizing ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Rename files from .test.js to .vitest.test.js
 *
 * @param {string[]} files - List of file paths
 * @returns {object} - Result of the rename operation
 */
function renameFiles(files) {
  const results = {
    success: 0,
    failure: 0,
    skipped: 0,
    details: {},
  };

  for (const file of files) {
    try {
      if (!file.endsWith('.test.js') || file.endsWith('.vitest.test.js')) {
        results.skipped++;
        results.details[file] = { status: 'skipped', reason: 'Not a test file or already renamed' };
        continue;
      }

      const newFile = file.replace('.test.js', '.vitest.test.js');

      // Skip if new file already exists
      if (fs.existsSync(newFile)) {
        results.skipped++;
        results.details[file] = { status: 'skipped', reason: 'Target file already exists' };
        continue;
      }

      console.log(`Renaming ${file} to ${newFile}...`);
      fs.renameSync(file, newFile);

      results.success++;
      results.details[file] = { status: 'success', newFile };
    } catch (error) {
      results.failure++;
      results.details[file] = { status: 'failure', error: error.message };
      console.error(`Error renaming ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Run tests for the migrated files
 *
 * @param {string[]} files - List of file paths
 * @param {object} options - Command line options
 * @returns {object} - Result of the test operation
 */
function runTests(files, options) {
  const results = {
    success: 0,
    failure: 0,
    skipped: 0,
    details: {},
  };

  if (options.dryRun) {
    console.log('Skipping tests in dry run mode');
    return {
      success: 0,
      failure: 0,
      skipped: files.length,
      details: Object.fromEntries(
        files.map((file) => [file, { status: 'skipped', reason: 'Dry run' }])
      ),
    };
  }

  for (const file of files) {
    try {
      // If we're renaming files, update the path
      const actualFile = options.rename ? file.replace('.test.js', '.vitest.test.js') : file;

      // Skip if file doesn't exist
      if (!fs.existsSync(actualFile)) {
        results.skipped++;
        results.details[actualFile] = { status: 'skipped', reason: 'File does not exist' };
        continue;
      }

      console.log(`Running tests for ${actualFile}...`);

      // Run vitest for this specific file
      const testCommand = `npx vitest run "${actualFile}"`;

      try {
        const output = execSync(testCommand, { encoding: 'utf8' });
        results.success++;
        results.details[actualFile] = { status: 'success', output };
      } catch (error) {
        results.failure++;
        results.details[actualFile] = { status: 'failure', error: error.stdout || error.message };
        console.error(`Tests failed for ${actualFile}:`);
        console.error(error.stdout || error.message);
      }
    } catch (error) {
      results.failure++;
      results.details[file] = { status: 'failure', error: error.message };
      console.error(`Error running tests for ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Generate a migration report
 *
 * @param {object} results - Migration results
 * @param {string} batchName - Batch name
 */
function generateReport(results, batchName) {
  const timestamp = new Date().toISOString().replace(/[:T.Z]/g, '-');
  const reportPath = path.join(process.cwd(), `migration-report-${batchName}-${timestamp}.md`);

  let report = `# Jest to Vitest Migration Report: ${batchName}\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += '## Summary\n\n';
  report += '| Step | Success | Failure | Skipped |\n';
  report += '|------|---------|---------|--------|\n';

  for (const [step, stepResults] of Object.entries(results)) {
    report += `| ${step} | ${stepResults.success} | ${stepResults.failure} | ${stepResults.skipped} |\n`;
  }

  report += '\n## Details\n\n';

  for (const [step, stepResults] of Object.entries(results)) {
    report += `### ${step}\n\n`;

    if (stepResults.success > 0) {
      report += '#### Success\n\n';
      for (const [file, fileResult] of Object.entries(stepResults.details)) {
        if (fileResult.status === 'success') {
          report += `- ${file}\n`;
        }
      }
      report += '\n';
    }

    if (stepResults.failure > 0) {
      report += '#### Failures\n\n';
      for (const [file, fileResult] of Object.entries(stepResults.details)) {
        if (fileResult.status === 'failure') {
          report += `- ${file}: ${fileResult.error || 'Unknown error'}\n`;
        }
      }
      report += '\n';
    }

    if (stepResults.skipped > 0) {
      report += '#### Skipped\n\n';
      for (const [file, fileResult] of Object.entries(stepResults.details)) {
        if (fileResult.status === 'skipped') {
          report += `- ${file}: ${fileResult.reason || 'Unknown reason'}\n`;
        }
      }
      report += '\n';
    }
  }

  report += '## Next Steps\n\n';

  if (Object.values(results).some((r) => r.failure > 0)) {
    report += '- Review and fix failed migrations\n';
    report += '- Manually inspect standardized files\n';
    report += '- Run tests again to verify fixes\n';
  } else {
    report += '- All migrations successful!\n';
    report += '- Update TODO.md to mark these files as migrated\n';
    report += '- Run the migration status script to update progress\n';
  }

  fs.writeFileSync(reportPath, report);
  console.log(`Migration report written to: ${reportPath}`);
}

/**
 * Update TODO.md to mark migrated files
 *
 * @param {string[]} files - List of successfully migrated files
 */
function updateTodo(files) {
  try {
    const todoPath = path.join(process.cwd(), 'TODO.md');
    if (!fs.existsSync(todoPath)) {
      console.error('TODO.md not found');
      return;
    }

    let todoContent = fs.readFileSync(todoPath, 'utf8');
    let modified = false;

    for (const file of files) {
      // Extract the relative path from the full path
      const relativePath = path.relative(process.cwd(), file);

      // Look for the line with this file
      const regex = new RegExp(`- \\[ \\] Migrate \`${relativePath.replace(/\\/g, '/')}\` .*`, 'g');
      const replacedContent = todoContent.replace(regex, (match) => {
        modified = true;
        return match.replace('- [ ]', '- [x]');
      });

      if (replacedContent !== todoContent) {
        todoContent = replacedContent;
      }
    }

    if (modified) {
      fs.writeFileSync(todoPath, todoContent);
      console.log('Updated TODO.md with completed migrations');
    } else {
      console.log('No updates needed in TODO.md');
    }
  } catch (error) {
    console.error('Error updating TODO.md:', error);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log(`Batch Migration for "${batchName}" (${options.dryRun ? 'Dry Run' : 'Live Run'})`);

  // Get batch configuration
  const batchConfig = batchConfigs[batchName];
  console.log(`Processing ${batchConfig.description}: ${batchConfig.pattern}`);

  // Find files matching the pattern
  const files = findFiles(batchConfig.pattern);
  console.log(`Found ${files.length} files to process`);

  if (files.length === 0) {
    console.log('No files to process, exiting');
    return;
  }

  // Run the migration steps
  const results = {
    codemod: runCodemod(files, options),
  };

  // Rename files if requested
  if (options.rename) {
    results.rename = renameFiles(files);
  }

  // Run standardization
  results.standardize = runStandardization(files, options);

  // Run tests if requested
  if (options.test) {
    results.tests = runTests(files, options);
  }

  // Generate report
  generateReport(results, batchName);

  // Update TODO.md if not in dry run mode and tests pass
  if (!options.dryRun && (!options.test || results.tests.failure === 0)) {
    const successFiles = files.filter(
      (file) =>
        results.codemod.details[file]?.status === 'success' &&
        (!options.standardize || results.standardize.details[file]?.status === 'success') &&
        (!options.test || results.tests.details[file]?.status === 'success')
    );

    if (successFiles.length > 0) {
      updateTodo(successFiles);
    }
  }

  // Print summary
  console.log('\nMigration Summary:');
  console.log('==================');

  for (const [step, stepResults] of Object.entries(results)) {
    console.log(`${step}:`);
    console.log(`  Success: ${stepResults.success}`);
    console.log(`  Failure: ${stepResults.failure}`);
    console.log(`  Skipped: ${stepResults.skipped}`);
  }

  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
  }

  if (Object.values(results).some((r) => r.failure > 0)) {
    console.log('\n⚠️ Migration had failures, check the report for details!');
    process.exit(1);
  } else {
    console.log('\n✅ Migration completed successfully!');
  }
}

// Run the script
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
