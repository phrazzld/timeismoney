/**
 * Script to update test files by moving global hooks inside describe blocks
 *
 * Usage:
 * node scripts/update-hooks.js <file_path>
 */

const fs = require('fs');

// Get the file path from the command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path');
  process.exit(1);
}

// Read the file content
let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
  process.exit(1);
}

// Patterns to match global hooks
const beforeEachPattern = /^beforeEach\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?/gm;
const afterEachPattern = /^afterEach\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?/gm;
const beforeAllPattern = /^beforeAll\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?/gm;
const afterAllPattern = /^afterAll\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?/gm;

// Extract hooks from global scope
const globalHooks = {
  beforeEach: [],
  afterEach: [],
  beforeAll: [],
  afterAll: [],
};
let modifiedContent = content;

// Extract beforeEach hooks
let match;
while ((match = beforeEachPattern.exec(content)) !== null) {
  globalHooks.beforeEach.push(match[1].trim());
  modifiedContent = modifiedContent.replace(match[0], '');
}

// Extract afterEach hooks
while ((match = afterEachPattern.exec(content)) !== null) {
  globalHooks.afterEach.push(match[1].trim());
  modifiedContent = modifiedContent.replace(match[0], '');
}

// Extract beforeAll hooks
while ((match = beforeAllPattern.exec(content)) !== null) {
  globalHooks.beforeAll.push(match[1].trim());
  modifiedContent = modifiedContent.replace(match[0], '');
}

// Extract afterAll hooks
while ((match = afterAllPattern.exec(content)) !== null) {
  globalHooks.afterAll.push(match[1].trim());
  modifiedContent = modifiedContent.replace(match[0], '');
}

// Clean up double empty lines
modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

// Find the first describe block
const describeMatch = modifiedContent.match(
  /describe\s*\(\s*['"`](.+?)['"`]\s*,\s*\(\s*\)\s*=>\s*\{/
);

if (!describeMatch) {
  console.error('No describe block found in the file');
  process.exit(1);
}

// Insert hooks at the start of the describe block
const describeStart = describeMatch.index + describeMatch[0].length;

// Create hooks to insert
let hooksToInsert = '';

// Add beforeEach hooks
if (globalHooks.beforeEach.length > 0) {
  for (const hook of globalHooks.beforeEach) {
    hooksToInsert += `\n  beforeEach(() => {\n    ${hook}\n  });\n`;
  }
}

// Add afterEach hooks
if (globalHooks.afterEach.length > 0) {
  for (const hook of globalHooks.afterEach) {
    hooksToInsert += `\n  afterEach(() => {\n    ${hook}\n  });\n`;
  }
}

// Add beforeAll hooks
if (globalHooks.beforeAll.length > 0) {
  for (const hook of globalHooks.beforeAll) {
    hooksToInsert += `\n  beforeAll(() => {\n    ${hook}\n  });\n`;
  }
}

// Add afterAll hooks
if (globalHooks.afterAll.length > 0) {
  for (const hook of globalHooks.afterAll) {
    hooksToInsert += `\n  afterAll(() => {\n    ${hook}\n  });\n`;
  }
}

// Insert hooks
if (hooksToInsert) {
  const contentStart = modifiedContent.substring(0, describeStart);
  const contentEnd = modifiedContent.substring(describeStart);

  modifiedContent = contentStart + hooksToInsert + contentEnd;
}

// Write the modified content back to the file
try {
  fs.writeFileSync(filePath, modifiedContent, 'utf8');
  console.log(`Updated ${filePath}`);
} catch (error) {
  console.error(`Error writing file: ${error.message}`);
  process.exit(1);
}
