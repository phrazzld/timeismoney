#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

// Files with vi identifier conflicts
const filesWithDuplicateVi = [
  'src/__tests__/content/observer-callback.vitest.test.js',
  'src/__tests__/dom/content/observer-stress.vitest.test.js',
  'src/__tests__/dom/content/performance.dom.vitest.test.js',
  'src/__tests__/integration/options/formHandler.error.vitest.test.js',
  'src/__tests__/integration/options/formHandler.refactored.integration.vitest.test.js',
  'src/__tests__/options/formHandler.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.unit.vitest.test.js',
  'src/__tests__/unit/utils/converter.edge.vitest.test.js',
];

function fixDuplicateViImports(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Find all vitest-imports imports
  const vitestImportMatches = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]*vitest-imports\.js['"]/g) || [];
  
  // Collect all imports
  let allImports = new Set();
  vitestImportMatches.forEach(match => {
    const imports = match.match(/{\s*([^}]+)\s*}/)[1].split(',').map(i => i.trim());
    imports.forEach(imp => allImports.add(imp));
  });
  
  // Remove duplicate import statements, keep only the first one
  if (vitestImportMatches.length > 1) {
    // Keep the first match, remove others
    vitestImportMatches.slice(1).forEach(match => {
      content = content.replace(match + ';', '');
      content = content.replace(match, '');
    });
    
    // Update the first import to include all necessary imports
    const firstImport = vitestImportMatches[0];
    const importPath = firstImport.match(/from\s*['"]([^'"]+)['"]/)[1];
    const newImport = `import { ${Array.from(allImports).join(', ')} } from '${importPath}'`;
    content = content.replace(firstImport, newImport);
  }
  
  // Remove any direct vitest imports
  content = content.replace(/import\s*{\s*vi\s*}\s*from\s*['"]vitest['"]/g, '');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed duplicate vi imports in: ${filePath}`);
  }
}

// Fix missing resetTestMocks import
function fixResetTestMocksImport() {
  const filePath = 'src/__tests__/integration/options/formHandler.refactored.vitest.test.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if resetTestMocks is already imported
  if (!content.includes('resetTestMocks') || !content.match(/import\s*{[^}]*resetTestMocks[^}]*}/)) {
    // Find existing vitest-imports import
    const vitestImportMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]*vitest-imports\.js)['"]/);
    
    if (vitestImportMatch) {
      const imports = vitestImportMatch[1].split(',').map(i => i.trim());
      if (!imports.includes('resetTestMocks')) {
        imports.push('resetTestMocks');
        const newImport = `import { ${imports.join(', ')} } from '${vitestImportMatch[2]}'`;
        content = content.replace(vitestImportMatch[0], newImport);
      }
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Added resetTestMocks import in: ${filePath}`);
  }
}

// Fix duplicate imports in domModifier
function fixDomModifierImports() {
  const filePath = 'src/__tests__/dom/content/domModifier.vitest.test.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Find all imports from vitest-imports.js
  const vitestImportMatches = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]*vitest-imports\.js['"]/g) || [];
  
  if (vitestImportMatches.length > 1) {
    // Combine all imports into one
    let allImports = new Set();
    vitestImportMatches.forEach(match => {
      const imports = match.match(/{\s*([^}]+)\s*}/)[1].split(',').map(i => i.trim());
      imports.forEach(imp => allImports.add(imp));
    });
    
    // Keep the first import path
    const firstImportPath = vitestImportMatches[0].match(/from\s*['"]([^'"]+)['"]/)[1];
    
    // Remove all imports
    vitestImportMatches.forEach(match => {
      content = content.replace(match + ';', '');
      content = content.replace(match, '');
    });
    
    // Add a single combined import at the beginning
    const newImport = `import { ${Array.from(allImports).join(', ')} } from '${firstImportPath}';`;
    
    // Insert after the first import statement
    const firstImportIndex = content.indexOf('import');
    if (firstImportIndex !== -1) {
      const lineEnd = content.indexOf('\n', firstImportIndex);
      content = content.slice(0, lineEnd + 1) + newImport + '\n' + content.slice(lineEnd + 1);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed duplicate imports in: ${filePath}`);
  }
}

// Fix vitest.config.js import
function fixVitestConfig() {
  const filePath = 'vitest.config.js';
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Update the import to use vite instead of vitest/config
  content = content.replace(
    /import\s*{\s*defineConfig\s*}\s*from\s*['"]vite['"]/g,
    "import { defineConfig } from 'vite'"
  );
  
  // Add mergeConfig if needed
  if (content.includes('mergeConfig') && !content.includes('import') && !content.includes('mergeConfig')) {
    content = content.replace(
      /import\s*{\s*defineConfig\s*}\s*from\s*['"]vite['"]/,
      "import { defineConfig, mergeConfig } from 'vite'"
    );
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ Fixed vitest.config.js import`);
  }
}

// Main execution
console.log('Fixing all ESLint issues...\n');

console.log('Step 1: Fixing duplicate vi imports...');
filesWithDuplicateVi.forEach(fixDuplicateViImports);

console.log('\nStep 2: Fixing resetTestMocks import...');
fixResetTestMocksImport();

console.log('\nStep 3: Fixing duplicate imports in domModifier...');
fixDomModifierImports();

console.log('\nStep 4: Fixing vitest.config.js...');
fixVitestConfig();

console.log('\n✅ All ESLint fixes completed!');
console.log('Run "npm run lint" to verify all issues are resolved.');