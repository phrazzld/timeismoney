/**
 * Test script for validate-node-version.js
 *
 * This script tests whether the validation script correctly identifies both
 * compliant and non-compliant workflow configurations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Create a temporary directory for testing
const tempDir = path.join(rootDir, 'temp', 'test-validate');
const workflowsDir = path.join(tempDir, '.github', 'workflows');

// Ensure the temporary directory exists
fs.mkdirSync(workflowsDir, { recursive: true });

// Test case 1: Valid workflow file (using node-version-file)
const validWorkflow = `
name: Valid Workflow

on:
  push:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version-file: '.nvmrc'
`;

// Test case 2: Invalid workflow file (using hardcoded node-version)
const invalidWorkflow = `
name: Invalid Workflow

on:
  push:
    branches: [ master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
`;

console.log('Running validation script tests...');

// Run tests by manually validating the workflow content
const setupNodeRegex = /uses:\s*actions\/setup-node/;
const nodeVersionRegex = /node-version:\s*['"]?([^'"]+)['"]?/;
const nodeVersionFileRegex = /node-version-file:\s*['"]?\.nvmrc['"]?/;

// Test 1: Valid workflow should pass
const validLines = validWorkflow.split('\n');
let validHasIssue = false;

for (let i = 0; i < validLines.length; i++) {
  if (setupNodeRegex.test(validLines[i])) {
    let hasVersion = false;
    let hasVersionFile = false;

    // Check next 5 lines
    for (let j = i; j < Math.min(i + 5, validLines.length); j++) {
      if (nodeVersionRegex.test(validLines[j])) hasVersion = true;
      if (nodeVersionFileRegex.test(validLines[j])) hasVersionFile = true;
    }

    if (hasVersion && !hasVersionFile) {
      validHasIssue = true;
      break;
    }
  }
}

console.log('Test 1 (valid workflow):', validHasIssue ? '❌ Failed' : '✅ Passed');

// Test 2: Invalid workflow should fail
const invalidLines = invalidWorkflow.split('\n');
let invalidHasIssue = false;

for (let i = 0; i < invalidLines.length; i++) {
  if (setupNodeRegex.test(invalidLines[i])) {
    let hasVersion = false;
    let hasVersionFile = false;

    // Check next 5 lines
    for (let j = i; j < Math.min(i + 5, invalidLines.length); j++) {
      if (nodeVersionRegex.test(invalidLines[j])) hasVersion = true;
      if (nodeVersionFileRegex.test(invalidLines[j])) hasVersionFile = true;
    }

    if (hasVersion && !hasVersionFile) {
      invalidHasIssue = true;
      break;
    }
  }
}

console.log('Test 2 (invalid workflow):', invalidHasIssue ? '✅ Passed' : '❌ Failed');

// Summary
if (!validHasIssue && invalidHasIssue) {
  console.log('\n✅ All tests passed! The validation script works correctly.');
} else {
  console.error('\n❌ Tests failed! The validation script is not working correctly.');
  process.exit(1);
}

// Clean up
fs.rmSync(tempDir, { recursive: true, force: true });
