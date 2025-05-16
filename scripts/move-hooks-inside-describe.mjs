/**
 * Script to transform test files by moving global hooks inside describe blocks
 * 
 * This script identifies test files with global-level beforeEach, afterEach, beforeAll,
 * and afterAll hooks and moves them inside top-level describe blocks.
 * 
 * Usage:
 * node scripts/move-hooks-inside-describe.mjs [path] [--dry-run] [--verbose]
 * 
 * Options:
 * --dry-run     Show what changes would be made without writing to files
 * --verbose     Show detailed information about every file
 * 
 * If path is not provided, it defaults to 'src/__tests__'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Options parsing
const options = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
};

// Get search path from args, default to src/__tests__
const searchPathArg = process.argv.find(arg => !arg.startsWith('--') && !arg.includes('node') && !arg.includes('scripts/move-hooks'));
const searchPath = searchPathArg || 'src/__tests__';

// Hook patterns for regex matching
const HOOK_PATTERNS = {
  beforeEach: /^beforeEach\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?\s*$/gm,
  afterEach: /^afterEach\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?\s*$/gm,
  beforeAll: /^beforeAll\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?\s*$/gm,
  afterAll: /^afterAll\s*\(\s*(?:async)?\s*\(\s*\)\s*=>\s*\{([^}]*)\}\s*\);?\s*$/gm
};

/**
 * Extract hooks from file content and remove them from the original content
 * @param {string} content - File content
 * @returns {Object} Object with extracted hooks and modified content
 */
function extractHooks(content) {
  const hooks = {
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: []
  };
  
  let modifiedContent = content;
  
  // Extract each type of hook
  for (const [hookType, pattern] of Object.entries(HOOK_PATTERNS)) {
    let match;
    pattern.lastIndex = 0; // Reset regex state
    while ((match = pattern.exec(content)) !== null) {
      hooks[hookType].push(match[1].trim());
      
      // Remove this hook from the content
      const hookText = match[0];
      modifiedContent = modifiedContent.replace(hookText, '');
    }
  }
  
  // Remove any double empty lines created by removing hooks
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { hooks, modifiedContent };
}

/**
 * Inject hooks into the top-level describe block
 * @param {string} content - File content with describes
 * @param {Object} hooks - Extracted hooks to inject
 * @returns {string} Modified content with hooks inside describe
 */
function injectHooksIntoDescribe(content, hooks) {
  // Find the first describe block
  const describeMatch = content.match(/describe\s*\(\s*['"`](.+?)['"`]\s*,\s*\(\s*\)\s*=>\s*\{/);
  
  if (!describeMatch) {
    // No describe block found, can't inject hooks
    console.error('No describe block found in file');
    return content;
  }
  
  const describeStart = describeMatch.index + describeMatch[0].length;
  
  // Create hook strings to inject
  let hooksToInject = '';
  
  for (const [hookType, hookBodies] of Object.entries(hooks)) {
    for (const hookBody of hookBodies) {
      if (hookBody.trim()) {
        hooksToInject += `\n  ${hookType}(() => {\n    ${hookBody}\n  });\n`;
      }
    }
  }
  
  // Inject hooks at the start of the describe block
  if (hooksToInject) {
    const contentStart = content.substring(0, describeStart);
    const contentEnd = content.substring(describeStart);
    return contentStart + hooksToInject + contentEnd;
  }
  
  return content;
}

/**
 * Transform a file by moving global hooks inside describe blocks
 * @param {string} filePath - Path to the file to transform
 * @returns {Object} Result of the transformation
 */
function transformFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if the file doesn't have any global hooks
    let hasGlobalHooks = false;
    for (const pattern of Object.values(HOOK_PATTERNS)) {
      pattern.lastIndex = 0; // Reset regex state
      if (pattern.test(content)) {
        hasGlobalHooks = true;
        // Reset pattern lastIndex
        pattern.lastIndex = 0;
      }
    }
    
    if (!hasGlobalHooks) {
      return { 
        filePath,
        hasGlobalHooks: false,
        hasDescribe: /describe\s*\(/.test(content),
        transformed: false,
        message: 'No global hooks found' 
      };
    }
    
    // Check if the file has describe blocks
    const hasDescribe = /describe\s*\(/.test(content);
    if (!hasDescribe) {
      return { 
        filePath,
        hasGlobalHooks,
        hasDescribe,
        transformed: false,
        message: 'Has global hooks but no describe blocks' 
      };
    }
    
    // Extract hooks and update content
    const { hooks, modifiedContent } = extractHooks(content);
    
    // Inject hooks into describe blocks
    const transformedContent = injectHooksIntoDescribe(modifiedContent, hooks);
    
    // Don't report a transformation if the content didn't change
    if (transformedContent === content) {
      return {
        filePath,
        hasGlobalHooks,
        hasDescribe,
        transformed: false,
        message: 'No changes needed'
      };
    }
    
    // Write to file if not in dry run mode
    if (!options.dryRun) {
      fs.writeFileSync(filePath, transformedContent, 'utf8');
    }
    
    // Return transformation details
    const hookCounts = Object.entries(hooks)
      .map(([type, bodies]) => `${type}: ${bodies.length}`)
      .filter(item => !item.endsWith(': 0'))
      .join(', ');
    
    return {
      filePath,
      hasGlobalHooks,
      hasDescribe,
      transformed: true,
      message: `Moved hooks (${hookCounts}) inside describe block`
    };
  } catch (error) {
    console.error(`Error transforming file ${filePath}:`, error.message);
    return {
      filePath,
      error: error.message,
      transformed: false
    };
  }
}

/**
 * Process all test files in the given path
 * @param {string} searchPath - Base path to search in
 * @returns {Promise<Array>} Array of transformation results
 */
async function processFiles(searchPath) {
  try {
    // Find all Vitest test files
    const pattern = path.join(searchPath, '**/*.vitest.test.js');
    const files = await glob(pattern);
    
    console.log(`Found ${files.length} test files to analyze`);
    
    // Transform each file
    const results = [];
    for (const file of files) {
      const result = transformFile(file);
      results.push(result);
      
      // Log detailed info if in verbose mode
      if (options.verbose || result.transformed) {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`${result.transformed ? '✅' : '⏭️'} ${relativePath}: ${result.message}`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing files:', error.message);
    return [];
  }
}

/**
 * Main function to run the script
 */
async function main() {
  console.log(`Transforming test files in: ${searchPath}`);
  console.log(`Mode: ${options.dryRun ? 'Dry run' : 'Write changes'}`);
  
  const results = await processFiles(searchPath);
  
  // Count transformed files
  const transformed = results.filter(r => r.transformed).length;
  const withGlobalHooks = results.filter(r => r.hasGlobalHooks).length;
  const withoutDescribe = results.filter(r => r.hasGlobalHooks && !r.hasDescribe).length;
  
  // Print summary
  console.log('\n===== Summary =====');
  console.log(`Total files analyzed: ${results.length}`);
  console.log(`Files with global hooks: ${withGlobalHooks}`);
  console.log(`Files transformed: ${transformed}`);
  console.log(`Files with hooks but no describe blocks: ${withoutDescribe}`);
  
  if (options.dryRun && transformed > 0) {
    console.log('\n⚠️ This was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});