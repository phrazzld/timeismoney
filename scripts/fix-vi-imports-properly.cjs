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
  
  // Replace the direct vitest import with a more specific pattern
  content = content.replace(
    /\/\/ eslint-disable-next-line no-restricted-imports, import\/named\nimport { vi } from 'vitest';/g,
    "// eslint-disable-next-line import/no-extraneous-dependencies\nimport { vi as vitestVi } from 'vitest';"
  );
  
  // Replace vi.mock calls with vitestVi.mock
  content = content.replace(
    /^vi\.mock\(/gm,
    'vitestVi.mock('
  );
  
  // Add vi to the imports from vitest-imports.js if it's not already there
  content = content.replace(
    /import\s*{([^}]*)}\s*from\s*['"][^'"]*vitest-imports\.js['"]/g,
    (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      if (!importList.includes('vi')) {
        importList.push('vi');
      }
      return `import {\n  ${importList.join(',\n  ')}\n} from '${match.match(/from\s*['"]([^'"]*)['"]/)[1]}'`;
    }
  );
  
  fs.writeFileSync(absolutePath, content);
  console.log(`Fixed: ${filePath}`);
});

console.log('Fixed vi imports in all specified files.');