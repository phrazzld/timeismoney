#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert file URL to path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if a file contains global hooks (outside describe blocks)
 * @param {string} filePath - Path to the test file
 * @returns {Object} - Object with globalHooks and their content
 */
function findGlobalHooks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const result = {
    filePath,
    hasGlobalHooks: false,
    hooks: {
      beforeAll: [],
      afterAll: [],
      beforeEach: [],
      afterEach: []
    }
  };

  let inDescribe = 0;
  let inGlobalHook = null;
  let hookStartLine = 0;
  let hookContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track describe depth
    if (line.startsWith('describe(')) {
      inDescribe++;
    } else if (line === '});' && inDescribe > 0) {
      inDescribe--;
    }
    
    // Only look for global hooks (outside describe blocks)
    if (inDescribe === 0) {
      // Check for hook start
      if (line.startsWith('beforeAll(') || line.startsWith('vi.beforeAll(')) {
        inGlobalHook = 'beforeAll';
        hookStartLine = i;
        hookContent = [lines[i]];
      } else if (line.startsWith('afterAll(') || line.startsWith('vi.afterAll(')) {
        inGlobalHook = 'afterAll';
        hookStartLine = i;
        hookContent = [lines[i]];
      } else if (line.startsWith('beforeEach(') || line.startsWith('vi.beforeEach(')) {
        inGlobalHook = 'beforeEach';
        hookStartLine = i;
        hookContent = [lines[i]];
      } else if (line.startsWith('afterEach(') || line.startsWith('vi.afterEach(')) {
        inGlobalHook = 'afterEach';
        hookStartLine = i;
        hookContent = [lines[i]];
      } 
      // If we're in a hook, collect the content
      else if (inGlobalHook && line === '});') {
        hookContent.push(lines[i]);
        result.hooks[inGlobalHook].push({
          startLine: hookStartLine + 1,  // 1-based line numbers
          endLine: i + 1,
          content: hookContent.join('\n')
        });
        inGlobalHook = null;
        hookContent = [];
        result.hasGlobalHooks = true;
      } 
      // Collect hook content
      else if (inGlobalHook) {
        hookContent.push(lines[i]);
      }
    }
  }

  return result;
}

// Process files
const targetDir = process.argv[2] || path.join(__dirname, '..', 'src', '__tests__', 'options');
const pattern = process.argv[3] || '.vitest.test.js';

// Get all test files in the target directory
const testFiles = fs.readdirSync(targetDir)
  .filter(file => file.endsWith(pattern))
  .map(file => path.join(targetDir, file));

// Find global hooks in each file
let foundGlobalHooks = false;
console.log(`Scanning ${testFiles.length} files for global hooks...\n`);

for (const file of testFiles) {
  const result = findGlobalHooks(file);
  if (result.hasGlobalHooks) {
    foundGlobalHooks = true;
    console.log(`\x1b[33mFile: ${path.relative(path.join(__dirname, '..'), file)}\x1b[0m`);
    
    Object.keys(result.hooks).forEach(hookType => {
      if (result.hooks[hookType].length > 0) {
        console.log(`  \x1b[36m${hookType} hooks:\x1b[0m`);
        result.hooks[hookType].forEach(hook => {
          console.log(`    Lines ${hook.startLine}-${hook.endLine}:`);
          console.log(`\x1b[32m${hook.content.split('\n').map(line => '      ' + line).join('\n')}\x1b[0m`);
        });
      }
    });
    console.log('');
  }
}

if (!foundGlobalHooks) {
  console.log('\x1b[32mNo global hooks found in any of the test files.\x1b[0m');
}