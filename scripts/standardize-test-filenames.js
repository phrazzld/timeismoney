#!/usr/bin/env node

/**
 * Script to standardize test file naming to follow .vitest.test.js pattern
 *
 * Usage:
 *   node scripts/standardize-test-filenames.js [--dry-run] [--update-imports]
 *
 * Options:
 *   --dry-run        Only print the files that would be renamed, without actually renaming them
 *   --update-imports Look for and update imports in test files that reference renamed files
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
const updateImports = args.includes('--update-imports');

// Define the base directory for tests
const testsDir = path.join(__dirname, '..', 'src', '__tests__');

// Get all test files
const getAllTestFiles = () => {
  // Find all JavaScript files in the tests directory that have 'test' in the name
  const files = execSync(`find ${testsDir} -type f -name "*.js" | grep "test\\.js"`, {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((file) => file); // Filter out any empty lines

  return files;
};

// Determine the standardized file name
const getStandardizedFilename = (filePath) => {
  const dirname = path.dirname(filePath);
  const basename = path.basename(filePath);

  // If the file already follows the .vitest.test.js pattern, return as is
  if (basename.includes('.vitest.test.js')) {
    return filePath;
  }

  // Handle special cases first
  if (basename.includes('.unit.test.js')) {
    return path.join(dirname, basename.replace('.unit.test.js', '.unit.vitest.test.js'));
  }

  if (basename.includes('.integration.test.js')) {
    return path.join(
      dirname,
      basename.replace('.integration.test.js', '.integration.vitest.test.js')
    );
  }

  if (basename.includes('.dom.test.js')) {
    return path.join(dirname, basename.replace('.dom.test.js', '.dom.vitest.test.js'));
  }

  // Standard case: replace .test.js with .vitest.test.js
  return path.join(dirname, basename.replace('.test.js', '.vitest.test.js'));
};

// Find and update imports in test files
const updateImportReferences = (oldPath, newPath) => {
  if (!updateImports) return;

  const oldBasename = path.basename(oldPath);
  const newBasename = path.basename(newPath);

  // Skip if the base name didn't change
  if (oldBasename === newBasename) return;

  // Search files that might import the renamed file
  try {
    const grepCommand = `grep -l "${oldBasename.replace('.js', '')}" $(find ${testsDir} -type f -name "*.js")`;
    const filesWithImports = execSync(grepCommand, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter((file) => file);

    console.log(
      `\nChecking ${filesWithImports.length} files for import references to ${oldBasename}...`
    );

    filesWithImports.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');

      // Look for import statements with the old file name (without extension)
      const oldImportBase = oldBasename.replace('.js', '');
      const newImportBase = newBasename.replace('.js', '');

      // Create a regex that matches imports with the old filename
      const importRegex = new RegExp(`from\\s+['"](.*/)?${oldImportBase}['"]`, 'g');

      if (importRegex.test(content)) {
        console.log(`  - Found import reference in ${file}`);

        if (!dryRun) {
          // Replace the imports with the new filename
          const newContent = content.replace(
            importRegex,
            (match, dirPath) => `from '${dirPath || ''}${newImportBase}'`
          );

          fs.writeFileSync(file, newContent, 'utf8');
          console.log(`    ✓ Updated import in ${file}`);
        } else {
          console.log(`    (dry run) Would update import in ${file}`);
        }
      }
    });
  } catch (error) {
    // Grep returns non-zero exit code if no matches found, which throws an error
    console.log(`\nNo import references found for ${oldBasename}`);
  }
};

// Main function
const standardizeFilenames = () => {
  const testFiles = getAllTestFiles();

  console.log(`Found ${testFiles.length} test files to analyze.`);

  const filesToRename = [];

  testFiles.forEach((filePath) => {
    const standardizedPath = getStandardizedFilename(filePath);

    if (standardizedPath !== filePath) {
      filesToRename.push({
        oldPath: filePath,
        newPath: standardizedPath,
      });
    }
  });

  // Display the files that would be renamed
  console.log(`\nFound ${filesToRename.length} files to rename:`);

  filesToRename.forEach(({ oldPath, newPath }) => {
    console.log(`  - ${path.basename(oldPath)} → ${path.basename(newPath)}`);
  });

  // If not in dry run mode, actually rename the files
  if (!dryRun && filesToRename.length > 0) {
    console.log('\nRenaming files...');

    filesToRename.forEach(({ oldPath, newPath }) => {
      try {
        // Check if the destination file already exists
        if (fs.existsSync(newPath)) {
          console.log(`  ⚠ Skipping: ${newPath} already exists`);
          return;
        }

        // Create the directory if it doesn't exist
        const newDir = path.dirname(newPath);
        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
        }

        // Rename the file
        fs.renameSync(oldPath, newPath);
        console.log(`  ✓ Renamed: ${path.basename(oldPath)} → ${path.basename(newPath)}`);

        // Update imports in other files
        updateImportReferences(oldPath, newPath);
      } catch (error) {
        console.error(`  ✗ Error renaming ${oldPath}:`, error.message);
      }
    });

    console.log(`\nRenamed ${filesToRename.length} files to follow .vitest.test.js pattern.`);
  } else if (dryRun) {
    console.log('\nDry run completed. No files were renamed.');
    console.log('To actually rename these files, run the script without the --dry-run flag.');
  }
};

// Run the script
standardizeFilenames();
