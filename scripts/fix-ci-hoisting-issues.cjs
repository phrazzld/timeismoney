#!/usr/bin/env node

/**
 * Script to fix vi.mock hoisting issues in test files
 * Vitest requires vi.mock to be hoisted, which means it needs to be
 * at the top of the file with a direct import from 'vitest'
 */

const fs = require('fs');
const path = require('path');

// List of test files with hoisting issues
const filesWithHoistingIssues = [
  'src/__tests__/content/observer-callback.vitest.test.js',
  'src/__tests__/options/formHandler.vitest.test.js',
  'src/__tests__/dom/content/observer-stress.vitest.test.js',
  'src/__tests__/dom/content/performance.dom.vitest.test.js',
  'src/__tests__/integration/options/formHandler.error.vitest.test.js',
  'src/__tests__/integration/options/formHandler.refactored.integration.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.unit.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.vitest.test.js',
];

const projectRoot = process.cwd();

function fixHoistingInFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Pattern to match vi.mock calls
  const mockPattern = /vi\.mock\([^;]+\);?/g;
  
  // Extract all vi.mock calls
  const mocks = [];
  let match;
  while ((match = mockPattern.exec(content)) !== null) {
    mocks.push(match[0]);
  }
  
  if (mocks.length === 0) return;
  
  // Remove mocks from their current positions
  mocks.forEach(mock => {
    content = content.replace(mock, '');
  });
  
  // Clean up extra blank lines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // Find where to insert the mocks - after the file comment block
  const commentEndMatch = content.match(/\*\/\s*\n/);
  let insertPosition = 0;
  
  if (commentEndMatch) {
    insertPosition = commentEndMatch.index + commentEndMatch[0].length;
  }
  
  // Create the new imports section
  const directViImport = `\n// eslint-disable-next-line no-restricted-imports\nimport { vi } from 'vitest';\n`;
  
  // Add the vi.mock calls immediately after the direct import
  const mocksSection = mocks.join('\n') + '\n';
  
  // Insert the new section
  content = content.slice(0, insertPosition) + directViImport + mocksSection + content.slice(insertPosition);
  
  // Clean up any double blank lines at the top
  content = content.replace(/^\n+/, '');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed hoisting in: ${filePath}`);
  } else {
    console.log(`  No changes needed in: ${filePath}`);
  }
}

// Also fix missing mock in storage.unit.vitest.test.js
function fixStorageUnitTest() {
  const filePath = 'src/__tests__/unit/utils/storage.unit.vitest.test.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if chrome mock is already imported
  if (!content.includes('chrome-api.mock')) {
    // Find the imports section
    const importsMatch = content.match(/import\s+{[^}]+}\s+from\s+['"][^'"]+vitest-imports\.js['"]/);
    
    if (importsMatch) {
      const insertPosition = content.indexOf(importsMatch[0]) + importsMatch[0].length;
      let endIndex = content.indexOf(';', insertPosition);
      if (endIndex === -1) endIndex = insertPosition;
      else endIndex += 1;
      
      // Add chrome mock import
      const chromeMockImport = `\nimport chromeMock from '../../mocks/chrome-api.mock.js';`;
      content = content.slice(0, endIndex) + chromeMockImport + content.slice(endIndex);
      
      // Also add the global assignment
      const globalSetup = `\n// Set up Chrome API mock\nglobal.chrome = chromeMock;\n`;
      
      // Find a good place to add it (after imports, before first describe)
      const describeMatch = content.match(/describe\(/);
      if (describeMatch) {
        const describePosition = content.indexOf(describeMatch[0]);
        content = content.slice(0, describePosition) + globalSetup + content.slice(describePosition);
      }
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed storage unit test: ${filePath}`);
  }
}

// Main execution
console.log('Fixing vi.mock hoisting issues...\n');

filesWithHoistingIssues.forEach(fixHoistingInFile);

console.log('\nFixing storage unit test...');
fixStorageUnitTest();

console.log('\n✅ Hoisting fixes completed!');
console.log('Run tests to verify all issues are resolved.');