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
  
  // Fix the syntax errors - remove extra commas in import statements
  content = content.replace(/,\s*,/g, ',');
  
  // Also ensure the mocks use vitestVi, not vi
  content = content.replace(/vitestVi\.mock\((.*?)\s*=>\s*\(\{/g, (match, args) => {
    const fixedContent = match.replace(/\bvi\.fn\(/g, 'vitestVi.fn(');
    return fixedContent;
  });
  
  fs.writeFileSync(absolutePath, content);
  console.log(`Fixed syntax in: ${filePath}`);
});

console.log('Fixed syntax errors in all specified files.');