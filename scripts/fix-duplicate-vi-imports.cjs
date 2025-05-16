#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/__tests__/content/observer-callback.vitest.test.js',
  'src/__tests__/dom/content/observer-stress.vitest.test.js',
  'src/__tests__/dom/content/performance.dom.vitest.test.js',
  'src/__tests__/integration/options/formHandler.error.vitest.test.js',
  'src/__tests__/integration/options/formHandler.refactored.integration.vitest.test.js',
  'src/__tests__/options/formHandler.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.unit.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.vitest.test.js',
];

filesToFix.forEach(filePath => {
  const absolutePath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Find vitest-imports.js import
  const vitestImportsMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"][^'"]*vitest-imports\.js['"]/);
  
  if (vitestImportsMatch) {
    // Parse the imports
    const imports = vitestImportsMatch[1].split(',').map(i => i.trim());
    
    // Remove vi from the list
    const filteredImports = imports.filter(imp => imp !== 'vi');
    
    // If vi was in the list, replace the import
    if (imports.length !== filteredImports.length) {
      const newImport = `import { ${filteredImports.join(', ')} } from '${vitestImportsMatch[0].match(/from\s*['"]([^'"]+)['"]/)[1]}'`;
      content = content.replace(vitestImportsMatch[0], newImport);
    }
  }
  
  fs.writeFileSync(absolutePath, content);
  console.log(`Fixed: ${filePath}`);
});

console.log('\nDuplicate vi imports fixed in all specified files.');
console.log('Using direct vitest imports for vi.mock calls.');