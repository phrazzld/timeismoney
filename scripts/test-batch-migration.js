#!/usr/bin/env node

/**
 * Script to test the batch migration approach
 *
 * This script verifies the batch migration workflow on a small sample of test files
 * without modifying the actual codebase.
 *
 * Usage:
 *   node scripts/test-batch-migration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary directory for our test
const tempDir = path.join(__dirname, '..', 'temp-migration-test');
if (fs.existsSync(tempDir)) {
  console.log('Cleaning up existing temp directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Sample Jest test file content
const jestTestContent = `/**
 * Sample Jest test for migration testing
 */

import { buildMatchPattern } from '../../../content/priceFinder';

describe('Jest Sample Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses jest function', () => {
    // Mock function
    const mockFn = jest.fn().mockReturnValue('test');
    
    // Spy on method
    const spy = jest.spyOn(Map.prototype, 'get');

    // Mock implementation
    const complexMock = jest.fn().mockImplementation(value => {
      return value * 2;
    });

    expect(mockFn()).toBe('test');
    expect(complexMock(5)).toBe(10);
    expect(spy).not.toHaveBeenCalled();
  });

  test('uses timers', () => {
    jest.useFakeTimers();
    
    // Run some timer operations
    jest.advanceTimersByTime(1000);
    jest.runAllTimers();
    
    jest.useRealTimers();
  });
});`;

// Create a sample Jest test file
const testFilePath = path.join(tempDir, 'sample.test.js');
fs.writeFileSync(testFilePath, jestTestContent);

console.log('Created sample Jest test file:', testFilePath);

// Run the codemod on the test file
console.log('\nRunning codemod on sample test file...');
try {
  const codemodOutput = execSync(
    `node ${path.join(__dirname, 'jest-to-vitest-codemod.js')} --verbose ${testFilePath}`,
    { encoding: 'utf8' }
  );
  console.log('Codemod output:');
  console.log(codemodOutput);
} catch (error) {
  console.error('Error running codemod:', error.message);
  process.exit(1);
}

// Check if the test file was transformed
console.log('\nChecking transformed file content:');
const transformedContent = fs.readFileSync(testFilePath, 'utf8');
console.log(transformedContent);

// Run the standardization script
console.log('\nRunning standardization script on transformed file...');
try {
  const standardizeOutput = execSync(
    `node ${path.join(__dirname, 'standardize-vitest-patterns.js')} --verbose ${testFilePath}`,
    { encoding: 'utf8' }
  );
  console.log('Standardization output:');
  console.log(standardizeOutput);
} catch (error) {
  console.error('Error running standardization:', error.message);
  process.exit(1);
}

// Check standardized file content
console.log('\nChecking standardized file content:');
const standardizedContent = fs.readFileSync(testFilePath, 'utf8');
console.log(standardizedContent);

// Simulate batch migration workflow
console.log('\nSimulating batch migration workflow...');
try {
  const batchOutput = execSync(
    `node ${path.join(__dirname, 'batch-migrate-tests.js')} --dry-run --verbose sample "${testFilePath}"`,
    { encoding: 'utf8', env: { ...process.env, NODE_ENV: 'test' } }
  );
  console.log('Batch migration output:');
  console.log(batchOutput);
} catch (error) {
  console.error('Error simulating batch migration:', error.message || error);
  if (error.stdout) console.error('Output:', error.stdout);
  if (error.stderr) console.error('Error output:', error.stderr);
}

// Clean up temporary directory
console.log('\nCleaning up...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('\nTest completed successfully!');
