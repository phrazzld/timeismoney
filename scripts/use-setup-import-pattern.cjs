#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of test files that need fixing
const failingFiles = [
  'src/__tests__/content/observer-callback.vitest.test.js',
  'src/__tests__/content/domScanner.vitest.test.js',
  'src/__tests__/content/performance.vitest.test.js',
  'src/__tests__/content/priceFinder.advanced.vitest.test.js',
  'src/__tests__/content/settingsManager.error.vitest.test.js',
  'src/__tests__/dom/content/observer-stress.vitest.test.js',
  'src/__tests__/dom/content/performance.dom.vitest.test.js',
  'src/__tests__/integration/content/settingsManager.error.integration.vitest.test.js',
  'src/__tests__/integration/options/formHandler.error.vitest.test.js',
  'src/__tests__/integration/options/formHandler.refactored.integration.vitest.test.js',
  'src/__tests__/integration/options/formHandler.storage.direct.vitest.test.js'
];

failingFiles.forEach((filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove the direct vitest import with alias
    if (content.includes("import { vi as vitestVi } from 'vitest';")) {
      content = content.replace(
        /\/\/ eslint-disable-next-line import\/no-extraneous-dependencies\nimport { vi as vitestVi } from 'vitest';\n/g,
        ''
      );
      modified = true;
    }
    
    // If we have vitest-imports.js import but not vi.hoisted, update it
    if (content.includes('vitest-imports.js') && !content.includes('vi.hoisted')) {
      // Find the import line and add vi.hoisted to it
      content = content.replace(
        /import { (.*), vi } from '(.*)vitest-imports\.js';/g,
        (match, otherImports, path) => {
          return `import { ${otherImports}, vi } from '${path}vitest-imports.js';
// Import vi.hoisted for top-level mocking
const { hoisted: viHoisted } = vi;`;
        }
      );
      modified = true;
    }
    
    // Replace vitestVi.mock with vi.hoisted
    if (content.includes('vitestVi.mock')) {
      content = content.replace(/vitestVi\.mock/g, 'vi.hoisted');
      modified = true;
    }
    
    // Also check for direct vi.mock usage - these need to be vi.hoisted
    content = content.replace(/^vi\.mock\(/gm, 'vi.hoisted(');
    
    if (modified || content.includes('vi.hoisted')) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
});

console.log('Finished updating test files to use vi.hoisted pattern');