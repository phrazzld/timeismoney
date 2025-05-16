/**
 * A simpler script to transform test files by moving global hooks inside describe blocks
 * 
 * This script focuses on the specific pattern of moving beforeEach/afterEach from the global scope
 * to inside top-level describe blocks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Transform a file by moving global hooks inside describe blocks
 * @param {string} filePath - Path to the file to transform
 * @returns {boolean} Whether the file was transformed
 */
function transformFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if there are global hooks
    const hasGlobalBeforeEach = /\n(beforeEach\s*\(.*?\)\s*;?\s*\n)/s.test(content);
    const hasGlobalAfterEach = /\n(afterEach\s*\(.*?\)\s*;?\s*\n)/s.test(content);
    
    if (!hasGlobalBeforeEach && !hasGlobalAfterEach) {
      console.log(`No global hooks found in ${filePath}`);
      return false;
    }
    
    // Extract global beforeEach and afterEach
    let modifiedContent = content;
    let beforeEachBlock = '';
    let afterEachBlock = '';
    
    // Extract beforeEach
    const beforeEachMatch = content.match(/\n(beforeEach\s*\((?:.*?)\)\s*;?\s*\n)/s);
    if (beforeEachMatch) {
      beforeEachBlock = beforeEachMatch[1];
      modifiedContent = modifiedContent.replace(beforeEachMatch[1], '');
    }
    
    // Extract afterEach
    const afterEachMatch = content.match(/\n(afterEach\s*\((?:.*?)\)\s*;?\s*\n)/s);
    if (afterEachMatch) {
      afterEachBlock = afterEachMatch[1];
      modifiedContent = modifiedContent.replace(afterEachMatch[1], '');
    }
    
    // Clean up extra newlines
    modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Check if file has a top-level describe block
    const describeMatch = modifiedContent.match(/describe\s*\(\s*(['"`])(.+?)\1\s*,\s*\(\s*\)\s*=>\s*\{/);
    if (!describeMatch) {
      console.error(`No describe block found in ${filePath}`);
      return false;
    }
    
    // Insert hooks inside the describe block
    const describeStart = describeMatch.index + describeMatch[0].length;
    const contentStart = modifiedContent.substring(0, describeStart);
    const contentEnd = modifiedContent.substring(describeStart);
    
    // Add the hooks with proper indentation
    let hooksToInsert = '';
    if (beforeEachBlock) {
      hooksToInsert += `\n  ${beforeEachBlock.trim()}`;
    }
    if (afterEachBlock) {
      hooksToInsert += `\n  ${afterEachBlock.trim()}`;
    }
    
    // Only add a newline after the hooks if there are hooks to insert
    if (hooksToInsert) {
      hooksToInsert += '\n';
    }
    
    const transformedContent = contentStart + hooksToInsert + contentEnd;
    
    // Check if we need to update imports
    const importLine = content.match(/import.*from\s*['"](.+?)['"];?/);
    let finalContent = transformedContent;
    
    if (importLine && (beforeEachBlock.includes('resetTestMocks') || afterEachBlock.includes('resetTestMocks'))) {
      // Check if resetTestMocks is already imported
      const hasResetTestMocksImport = importLine[0].includes('resetTestMocks');
      if (!hasResetTestMocksImport) {
        // Add resetTestMocks to the imports
        const setupImport = finalContent.match(/import\s*\{([^}]*)\}\s*from\s*['"](.+?setup\/vitest-imports\.js)['"];?/);
        if (setupImport) {
          const imports = setupImport[1].trim();
          const importPath = setupImport[2];
          const newImports = imports.endsWith(',') 
            ? `${imports} resetTestMocks`
            : `${imports}, resetTestMocks`;
          
          const newImportLine = `import { ${newImports} } from '${importPath}';`;
          finalContent = finalContent.replace(setupImport[0], newImportLine);
        }
      }
      
      // Remove any direct import of resetTestMocks from vitest.setup.js
      const resetImport = finalContent.match(/import\s*\{\s*resetTestMocks\s*\}\s*from\s*['"](.+?vitest\.setup\.js)['"];?/);
      if (resetImport) {
        finalContent = finalContent.replace(resetImport[0], '');
        // Clean up extra newlines after removing import
        finalContent = finalContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      }
    }
    
    // Write the changes to the file
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`✅ Transformed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error transforming ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Process files in a directory matching a pattern
 * @param {string} searchPath - Directory to search in
 * @param {string} searchPattern - Glob pattern for files
 */
async function processFiles(searchPath, searchPattern) {
  try {
    const pattern = path.join(searchPath, searchPattern);
    const files = await glob(pattern);
    
    console.log(`Found ${files.length} files to process`);
    
    let succeeded = 0;
    let failed = 0;
    
    for (const file of files) {
      const success = transformFile(file);
      if (success) {
        succeeded++;
      } else {
        failed++;
      }
    }
    
    console.log(`\nProcessing complete:`);
    console.log(`- ${succeeded} files transformed successfully`);
    console.log(`- ${failed} files skipped or failed`);
  } catch (error) {
    console.error('Error processing files:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  const searchPath = process.argv[2] || 'src/__tests__/content';
  const searchPattern = process.argv[3] || '*.vitest.test.js';
  
  console.log(`\nTransforming test files in: ${searchPath}`);
  console.log(`Using pattern: ${searchPattern}\n`);
  
  await processFiles(searchPath, searchPattern);
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});