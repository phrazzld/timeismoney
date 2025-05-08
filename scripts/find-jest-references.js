#!/usr/bin/env node

/**
 * Script to identify remaining Jest references in the codebase
 *
 * This script scans all JavaScript files for Jest-specific patterns
 * and reports files that need to be migrated to Vitest.
 *
 * Usage:
 *   node scripts/find-jest-references.js [directory]
 *
 * If no directory is specified, it scans the src/ directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to scan (default to src/)
const targetDir = process.argv[2] || path.join(__dirname, '..', 'src');

// Patterns to look for
const patterns = [
  // Direct Jest API usage
  { regex: /\bjest\.\w+\(/g, description: 'Direct Jest API call' },

  // Jest globals without proper imports
  {
    regex: /^\s*(describe|it|test|expect|beforeEach|afterEach|beforeAll|afterAll)\(/gm,
    description: 'Possible Jest global usage without imports',
  },

  // Jest-specific imports
  {
    regex: /\bimport\s+.*\bfrom\s+['"]jest['"]|require\(['"]jest['"]\)/g,
    description: 'Import from Jest package',
  },

  // Jest-specific mocking patterns
  {
    regex:
      /\.mockImplementation\(|\.mockReturnValue\(|\.mockResolvedValue\(|\.mockRejectedValue\(/g,
    description: 'Jest mock method without vi import',
  },

  // Jest-specific assertions
  {
    regex: /\btoHaveBeenCalled\(|\btoHaveBeenCalledWith\(|\btoHaveBeenCalledTimes\(/g,
    description: 'Jest assertion method without expect import',
  },
];

// Files and directories to exclude
const excludePatterns = [
  // Node modules and build directories
  /node_modules|dist|coverage/,

  // Files that are properly migrated
  /\.vitest\.test\.js$/,

  // Setup and configuration files
  /vitest\.setup\.js$|vitest\.config\.js$/,

  // Mock files
  /mocks\/.*\.mock\.js$/,
];

// Files to check for proper Vitest imports
const properImportPatterns = [
  // Proper Vitest imports
  /import\s+{\s*.*\b(describe|it|test|expect|vi|beforeEach|afterEach|beforeAll|afterAll)\b.*}\s+from\s+['"]\.\.\/(\.\.\/)*setup\/vitest-imports\.js['"]/,

  // Proper resetTestMocks import
  /import\s+{\s*.*\bresetTestMocks\b.*}\s+from\s+['"]\.\.\/(\.\.\/)*vitest\.setup\.js['"]/,
];

/**
 * Check if a file should be excluded from scanning
 *
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file should be excluded
 */
function shouldExcludeFile(filePath) {
  return excludePatterns.some((pattern) => pattern.test(filePath));
}

/**
 * Check if a file has proper Vitest imports
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file has proper Vitest imports
 */
function hasProperVitestImports(content) {
  return properImportPatterns.some((pattern) => pattern.test(content));
}

/**
 * Scan file for Jest references
 *
 * @param {string} filePath - Path to the file
 * @returns {Array} - Array of findings with pattern, line number, and line content
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  // Skip files with proper Vitest imports
  const isTestFile = filePath.includes('.test.js');
  if (isTestFile && hasProperVitestImports(content)) {
    return findings;
  }

  // Check each pattern
  patterns.forEach(({ regex, description }) => {
    const matches = content.matchAll(new RegExp(regex));
    for (const match of matches) {
      // Find line number for the match
      const matchIndex = match.index;
      let lineNumber = 0;
      let currentIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + 1; // +1 for the newline
        if (currentIndex <= matchIndex && matchIndex < currentIndex + lineLength) {
          lineNumber = i + 1;
          break;
        }
        currentIndex += lineLength;
      }

      // Get line content for context
      const lineContent = lines[lineNumber - 1].trim();

      findings.push({
        pattern: description,
        lineNumber,
        lineContent,
      });
    }
  });

  return findings;
}

/**
 * Recursively scan directory for JavaScript files
 *
 * @param {string} directory - Directory to scan
 * @param {object} results - Object to store results
 */
function scanDirectory(directory, results) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // Skip excluded files and directories
    if (shouldExcludeFile(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const findings = scanFile(fullPath);
      if (findings.length > 0) {
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
        results[relativePath] = findings;
      }
    }
  }
}

/**
 * Format results in a readable way
 *
 * @param {object} results - Object with scan results
 * @returns {string} - Formatted results
 */
function formatResults(results) {
  const fileCount = Object.keys(results).length;
  if (fileCount === 0) {
    return 'No Jest references found! 🎉';
  }

  let output = `Found Jest references in ${fileCount} file(s):\n\n`;

  for (const [filePath, findings] of Object.entries(results)) {
    output += `${filePath}:\n`;
    findings.forEach(({ pattern, lineNumber, lineContent }) => {
      output += `  Line ${lineNumber}: ${pattern}\n`;
      output += `    ${lineContent}\n`;
    });
    output += '\n';
  }

  output += 'To migrate these files, follow the patterns in JEST-VITEST-MIGRATION.md\n';
  return output;
}

// Main execution
console.log(`Scanning ${targetDir} for Jest references...`);
const results = {};
scanDirectory(targetDir, results);
console.log(formatResults(results));
