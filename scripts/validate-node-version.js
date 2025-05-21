/**
 * Node.js Version Validation Script for CI Workflows
 *
 * This script validates that all GitHub Actions workflow files use the centralized
 * Node.js version management approach (node-version-file: '.nvmrc') instead of
 * hardcoded Node.js versions.
 *
 * Usage: node scripts/validate-node-version.js
 * Exit code: 0 = success, 1 = validation failed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Find all workflow files
const workflowsDir = path.join(rootDir, '.github', 'workflows');
const workflowFiles = fs
  .readdirSync(workflowsDir)
  .filter((file) => file.endsWith('.yml'))
  .map((file) => path.join(workflowsDir, file));

console.log(`Found ${workflowFiles.length} workflow files to validate`);

// Track issues
let issuesFound = false;

// Simple regex patterns to detect Node.js setup
const setupNodeRegex = /uses:\s*actions\/setup-node/;
const nodeVersionRegex = /node-version:\s*['"]?([^'"]+)['"]?/;
const nodeVersionFileRegex = /node-version-file:\s*['"]?\.nvmrc['"]?/;

// Validate each workflow file
workflowFiles.forEach((file) => {
  console.log(`\nValidating ${path.relative(rootDir, file)}...`);

  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    // Line-by-line scanning for setup-node actions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (setupNodeRegex.test(line)) {
        // Found a setup-node action, look for node-version in the next few lines
        let nodeVersionFound = false;
        let nodeVersionFileFound = false;
        let nodeVersionLine = '';

        // Check the next few lines (typically within 5 lines)
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const checkLine = lines[j];

          if (nodeVersionRegex.test(checkLine)) {
            nodeVersionFound = true;
            nodeVersionLine = checkLine.trim();
          }

          if (nodeVersionFileRegex.test(checkLine)) {
            nodeVersionFileFound = true;
          }
        }

        // Report issues
        if (nodeVersionFound && !nodeVersionFileFound) {
          console.error(`❌ Error in ${path.relative(rootDir, file)} around line ${i + 1}:`);
          console.error(`   Found hardcoded node-version: "${nodeVersionLine}"`);
          console.error(`   Should use node-version-file: '.nvmrc' instead`);
          issuesFound = true;
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
    issuesFound = true;
  }
});

if (issuesFound) {
  console.error('\n❌ Validation failed: Node.js version configuration issues found');
  process.exit(1);
} else {
  console.log(
    '\n✅ Validation passed: All workflow files use centralized Node.js version configuration'
  );
  process.exit(0);
}
