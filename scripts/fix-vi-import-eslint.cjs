#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesWithRestrictedImports = [
  'src/__tests__/content/observer-callback.vitest.test.js',
  'src/__tests__/dom/content/observer-stress.vitest.test.js',
  'src/__tests__/dom/content/performance.dom.vitest.test.js',
  'src/__tests__/integration/options/formHandler.error.vitest.test.js',
  'src/__tests__/integration/options/formHandler.refactored.integration.vitest.test.js',
  'src/__tests__/options/formHandler.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.unit.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.vitest.test.js',
];

const projectRoot = process.cwd();

// Calculate proper relative path to vitest-imports.js
function getRelativeImportPath(filePath) {
  const testPath = path.join(projectRoot, filePath);
  const importPath = path.join(projectRoot, 'src/__tests__/setup/vitest-imports.js');
  let relativePath = path.relative(path.dirname(testPath), importPath);
  
  // Ensure proper relative path formatting
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

function fixRestrictedImports(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Get the correct relative import path
  const importPath = getRelativeImportPath(filePath);
  
  // Remove eslint-disable comments and fix vi imports
  content = content.replace(
    /\/\/ eslint-disable-next-line (?:no-restricted-imports, )?import\/no-extraneous-dependencies\nimport\s*{\s*vi\s*as\s*vitestVi\s*}\s*from\s*'vitest';?/g,
    `import { vi } from '${importPath}';`
  );
  
  // Also fix any eslint-disable with direct vi imports
  content = content.replace(
    /\/\/ eslint-disable-next-line (?:no-restricted-imports|import\/named|[^\\n]+)\nimport\s*{\s*vi\s*}\s*from\s*'vitest';?/g,
    `import { vi } from '${importPath}';`
  );
  
  // Fix any remaining direct vitest imports
  content = content.replace(
    /import\s*{\s*([^}]+)\s*}\s*from\s*['"]vitest['"]/g,
    (match, imports) => {
      return `import { ${imports} } from '${importPath}'`;
    }
  );
  
  // Replace vitestVi with vi if present
  content = content.replace(/vitestVi\./g, 'vi.');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed restricted imports in: ${filePath}`);
  } else {
    console.log(`  No changes needed in: ${filePath}`);
  }
}

// Main execution
console.log('Fixing ESLint restricted import errors...\n');

filesWithRestrictedImports.forEach(fixRestrictedImports);

console.log('\n✅ ESLint restricted import fixes completed!');
console.log('Run "npm run lint" to verify all issues are resolved.');