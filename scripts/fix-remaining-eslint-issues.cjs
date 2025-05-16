#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Fix test-helpers import issue
function fixTestHelpersImport() {
  const filePath = 'src/__tests__/dom/content/domModifier.vitest.test.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if test-helpers.js has a default export
  const testHelpersPath = path.join(projectRoot, 'src/__tests__/setup/test-helpers.js');
  const testHelpersContent = fs.readFileSync(testHelpersPath, 'utf8');
  
  // If no default export, change the import
  if (!testHelpersContent.includes('export default')) {
    if (testHelpersContent.includes('export function setupTestDom')) {
      // Import setupTestDom specifically
      content = content.replace(
        /import\s+testHelpers\s+from\s+['"]\.\.\/\.\.\/setup\/test-helpers['"]/g,
        "import { setupTestDom } from '../../setup/test-helpers'"
      );
      
      // Replace usage of testHelpers with setupTestDom
      content = content.replace(/testHelpers\(/g, 'setupTestDom(');
    } else {
      // Use * as import
      content = content.replace(
        /import\s+testHelpers\s+from\s+['"]\.\.\/\.\.\/setup\/test-helpers['"]/g,
        "import * as testHelpers from '../../setup/test-helpers'"
      );
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed test-helpers import in: ${filePath}`);
  }
}

// Fix vi.clearAllMocks() usage
function fixClearAllMocks() {
  const filePath = 'src/__tests__/integration/options/formHandler.refactored.vitest.test.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Replace vi.clearAllMocks() with resetTestMocks()
  content = content.replace(/vi\.clearAllMocks\(\)/g, 'resetTestMocks()');
  
  // Add resetTestMocks import if needed
  if (content.includes('resetTestMocks()') && !content.includes('import') && !content.includes('resetTestMocks')) {
    // Find the vitest-imports import and add resetTestMocks
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"][^'"]*vitest-imports\.js['"]/;
    const match = content.match(importRegex);
    
    if (match) {
      const imports = match[1].split(',').map(i => i.trim());
      if (!imports.includes('resetTestMocks')) {
        imports.push('resetTestMocks');
        content = content.replace(match[0], `import { ${imports.join(', ')} } from '${match[0].match(/from\s*['"]([^'"]+)['"]/)[1]}'`);
      }
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed vi.clearAllMocks() usage in: ${filePath}`);
  }
}

// Fix vitest/config import issue in vitest.config.js
function fixVitestConfigImport() {
  const filePath = 'vitest.config.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if vitest package is installed
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.devDependencies.vitest || packageJson.dependencies.vitest) {
    // Try to fix the import - make it more explicit
    content = content.replace(
      /import\s*{\s*defineConfig\s*}\s*from\s*['"]vitest\/config['"]/g,
      "import { defineConfig } from 'vitest/config'"
    );
    
    // If that doesn't work, try importing from the root
    if (content === originalContent) {
      content = content.replace(
        /import\s*{\s*defineConfig\s*}\s*from\s*['"]vitest\/config['"]/g,
        "import { defineConfig } from 'vite'"
      );
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed vitest/config import in: ${filePath}`);
  }
}

// Main execution
console.log('Fixing remaining ESLint issues...\n');

console.log('Step 1: Fixing test-helpers import...');
fixTestHelpersImport();

console.log('\nStep 2: Fixing vi.clearAllMocks() usage...');
fixClearAllMocks();

console.log('\nStep 3: Fixing vitest/config import...');
fixVitestConfigImport();

console.log('\n✅ Remaining ESLint fixes completed!');
console.log('Run "npm run lint" to verify all issues are resolved.');