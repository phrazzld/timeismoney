#!/usr/bin/env node

/**
 * Migration Status Tracker
 *
 * This script analyzes the codebase to track the progress of Jest to Vitest migration.
 * It identifies which files have been migrated, which still need migration, and provides
 * statistics about the migration status.
 *
 * Usage:
 *   node scripts/migration-status.js [directory]
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

// Files to check for Jest and Vitest patterns
const jestPatterns = [
  // Direct Jest API usage
  /\bjest\.\w+\(/g,
  // Jest globals without proper imports
  /^\s*(describe|it|test|expect|beforeEach|afterEach|beforeAll|afterAll)\(/gm,
  // Jest-specific imports
  /\bimport\s+.*\bfrom\s+['"]jest['"]|require\(['"]jest['"]\)/g,
  // Jest-specific mocking patterns
  /\.mockImplementation\(|\.mockReturnValue\(|\.mockResolvedValue\(|\.mockRejectedValue\(/g,
  // Jest-specific assertions
  /\btoHaveBeenCalled\(|\btoHaveBeenCalledWith\(|\btoHaveBeenCalledTimes\(/g,
];

// Files and directories to exclude
const excludePatterns = [
  // Node modules and build directories
  /node_modules|dist|coverage/,
  // Setup and configuration files
  /vitest\.setup\.js$|vitest\.config\.js$/,
  // Mock files
  /mocks\/.*\.mock\.js$/,
];

// Patterns to identify Vitest usage
const vitestPatterns = [
  // Vitest imports
  /import\s+{\s*.*\b(describe|it|test|expect|vi|beforeEach|afterEach|beforeAll|afterAll)\b.*}\s+from\s+['"]\.\.\/(\.\.\/)*setup\/vitest-imports\.js['"]/,
  // Direct Vitest imports (should be avoided but still check)
  /import\s+.*\bfrom\s+['"]vitest['"]/,
  // Vitest vi object usage
  /\bvi\.\w+\(/g,
  // resetTestMocks usage
  /resetTestMocks\(\)/g,
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
 * Check if a file has Jest patterns
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file has Jest patterns
 */
function hasJestPatterns(content) {
  return jestPatterns.some((pattern) => pattern.test(content));
}

/**
 * Check if a file has Vitest patterns
 *
 * @param {string} content - File content
 * @returns {boolean} - True if file has Vitest patterns
 */
function hasVitestPatterns(content) {
  return vitestPatterns.some((pattern) => pattern.test(content));
}

/**
 * Determine the migration status of a file
 *
 * @param {string} content - File content
 * @returns {string} - Migration status (migrated, mixed, unmigrated)
 */
function getMigrationStatus(content) {
  const hasJest = hasJestPatterns(content);
  const hasVitest = hasVitestPatterns(content);

  if (hasVitest && !hasJest) {
    return 'migrated';
  } else if (hasVitest && hasJest) {
    return 'mixed';
  } else if (hasJest && !hasVitest) {
    return 'unmigrated';
  } else {
    return 'unknown'; // Not a test file or no test patterns found
  }
}

/**
 * Scan a single file to determine its migration status
 *
 * @param {string} filePath - Path to the file
 * @returns {object} - Object with file path and migration status
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const status = getMigrationStatus(content);

  return {
    path: filePath,
    status,
  };
}

/**
 * Recursively scan directory for JavaScript files
 *
 * @param {string} directory - Directory to scan
 * @returns {Array} - Array of file scan results
 */
function scanDirectory(directory) {
  const results = [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    // Skip excluded files and directories
    if (shouldExcludeFile(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      results.push(...scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      // Only scan test files
      const scanResult = scanFile(fullPath);
      results.push(scanResult);
    }
  }

  return results;
}

/**
 * Format the migration status results as a report
 *
 * @param {Array} results - Array of file scan results
 * @returns {string} - Formatted report
 */
function formatResults(results) {
  // Count files by status
  const counts = results.reduce((acc, { status }) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalFiles = results.length;
  const migratedCount = counts.migrated || 0;
  const mixedCount = counts.mixed || 0;
  const unmigratedCount = counts.unmigrated || 0;
  const unknownCount = counts.unknown || 0;

  // Calculate percentages
  const migratedPercent = totalFiles ? ((migratedCount / totalFiles) * 100).toFixed(2) : 0;
  const mixedPercent = totalFiles ? ((mixedCount / totalFiles) * 100).toFixed(2) : 0;
  const unmigratedPercent = totalFiles ? ((unmigratedCount / totalFiles) * 100).toFixed(2) : 0;

  // Create the report
  let report = '# Jest to Vitest Migration Status\n\n';

  report += `## Summary\n\n`;
  report += `- Total test files: ${totalFiles}\n`;
  report += `- Fully migrated: ${migratedCount} (${migratedPercent}%)\n`;
  report += `- Partially migrated: ${mixedCount} (${mixedPercent}%)\n`;
  report += `- Not migrated: ${unmigratedCount} (${unmigratedPercent}%)\n`;
  if (unknownCount > 0) {
    report += `- Unknown status: ${unknownCount}\n`;
  }

  report += `\n## Migration Progress\n\n`;
  report += `[${'='.repeat(Math.floor(migratedPercent / 2))}${'-'.repeat(Math.floor(mixedPercent / 2))}${' '.repeat(Math.floor(unmigratedPercent / 2))}] ${migratedPercent}%\n\n`;

  // List files by status
  if (migratedCount > 0) {
    report += `## Fully Migrated Files\n\n`;
    results
      .filter((result) => result.status === 'migrated')
      .forEach((result) => {
        const relativePath = path.relative(path.join(__dirname, '..'), result.path);
        report += `- ${relativePath}\n`;
      });
    report += '\n';
  }

  if (mixedCount > 0) {
    report += `## Partially Migrated Files\n\n`;
    report += 'These files contain both Jest and Vitest patterns and should be cleaned up:\n\n';
    results
      .filter((result) => result.status === 'mixed')
      .forEach((result) => {
        const relativePath = path.relative(path.join(__dirname, '..'), result.path);
        report += `- ${relativePath}\n`;
      });
    report += '\n';
  }

  if (unmigratedCount > 0) {
    report += `## Unmigrated Files\n\n`;
    results
      .filter((result) => result.status === 'unmigrated')
      .forEach((result) => {
        const relativePath = path.relative(path.join(__dirname, '..'), result.path);
        report += `- ${relativePath}\n`;
      });
    report += '\n';
  }

  report += `## Next Steps\n\n`;
  report += `1. Use the \`jest-to-vitest-codemod.js\` script to automatically convert the unmigrated files:\n`;
  report += `   \`\`\`\n   node scripts/jest-to-vitest-codemod.js --backup <file_path>\n   \`\`\`\n\n`;
  report += `2. Clean up any partially migrated files by ensuring they only use Vitest patterns\n\n`;
  report += `3. Run the migration status script again to verify progress:\n`;
  report += `   \`\`\`\n   node scripts/migration-status.js\n   \`\`\`\n`;

  return report;
}

/**
 * Main execution function
 */
function main() {
  console.log(`Analyzing Jest to Vitest migration status in ${targetDir}...`);

  // Scan the directory
  const results = scanDirectory(targetDir);

  // Generate the report
  const report = formatResults(results);

  // Write the report to a file
  const reportPath = path.join(__dirname, '..', 'MIGRATION-STATUS.md');
  fs.writeFileSync(reportPath, report);

  console.log(`Migration status report generated: ${reportPath}`);

  // Also display a summary in the console
  const summary = report.split('## Migration Progress')[0];
  console.log('\n' + summary);
}

// Run the script
main();
