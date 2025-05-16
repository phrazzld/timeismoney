# Codemod Enhancement Plan

This document outlines the plan for enhancing the Jest-to-Vitest codemod script to handle more complex patterns and reduce manual intervention during migration.

## Current Capabilities

The existing codemod script (`scripts/jest-to-vitest-codemod.js`) already supports:

- Basic Jest API transformations (jest.fn, jest.mock, jest.spyOn, etc.)
- Basic timer function transformations
- Import generation for Vitest functions
- Basic resetTestMocks import/usage

## Enhancement Strategy

We'll extend the codemod script to handle more complex cases, addressing key patterns that have required manual intervention in our migration so far.

## 1. Enhanced File Handling

### Auto-Rename Test Files

```javascript
// Add a new option to rename files
program.option('-r, --rename', 'Rename .test.js files to .vitest.test.js', false);

// In main function, add renaming logic
if (options.rename && stats.isFile() && filePath.endsWith('.test.js')) {
  const newFilePath = filePath.replace('.test.js', '.vitest.test.js');
  fs.renameSync(filePath, newFilePath);
  console.log(`Renamed: ${filePath} -> ${newFilePath}`);
}
```

### Detect Special Test Types

```javascript
function detectTestType(filePath, content) {
  // Determine test type based on path and content
  if (filePath.includes('/dom/')) return 'dom';
  if (filePath.includes('/integration/')) return 'integration';
  if (filePath.includes('/unit/')) return 'unit';

  // Fallback detection based on content patterns
  if (content.includes('document.') || content.includes('window.')) return 'dom';

  return 'unknown';
}
```

## 2. Enhanced Transformation Patterns

### Complex Jest.mock Handling

```javascript
// Enhanced jest.mock transformation that handles factory functions
function handleComplexMocks(source) {
  // Regex to find jest.mock with factory functions
  const mockRegex = /jest\.mock\(['"]([^'"]+)['"]\s*,\s*\(\)\s*=>\s*\{([^}]+)\}\)/g;

  return source.replace(mockRegex, (match, modulePath, factoryBody) => {
    return `vi.mock('${modulePath}', () => {${factoryBody}})`;
  });
}
```

### Performance API Mocking

```javascript
// Add special handling for performance API mocking
function addPerformanceAPIMock(content, testType) {
  if (!/performance\.mark/.test(content)) return content;

  const mockTemplate = `
// Mock Performance API
const originalPerformance = global.performance;
global.performance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockImplementation((name) => {
    return [{ name, startTime: 0, duration: 10, entryType: 'measure' }];
  }),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

beforeEach(() => {
  // Reset performance mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore original performance API
  global.performance = originalPerformance;
});
`;

  // Find an appropriate insertion point
  const describeIndex = content.indexOf('describe(');
  if (describeIndex > 0) {
    return content.slice(0, describeIndex) + mockTemplate + content.slice(describeIndex);
  }

  // Fallback insertion after imports
  const lastImportIndex = content.lastIndexOf('import ');
  const importEndIndex = content.indexOf(';', lastImportIndex) + 1;

  return content.slice(0, importEndIndex) + '\n\n' + mockTemplate + content.slice(importEndIndex);
}
```

### Timer Functions Enhancement

```javascript
// Add more timer function transformations
const timerTransformations = [
  {
    pattern: /jest\.advanceTimersByTime\((\d+)\)/g,
    replacement: 'vi.advanceTimersByTime($1)',
  },
  {
    pattern: /jest\.runAllTicks\(\)/g,
    replacement: 'vi.runAllTicks()',
  },
  {
    pattern: /jest\.useRealTimers\(\)/g,
    replacement: 'vi.useRealTimers()',
  },
  // Add fake timers with specific config
  {
    pattern: /jest\.useFakeTimers\(['"](\w+)['"]\)/g,
    replacement: 'vi.useFakeTimers({ implementation: "$1" })',
  },
];
```

## 3. Import Management

### Dynamic Import Path Resolution

```javascript
// Improved import path resolution
function resolveImportPath(importPath, filePath) {
  // Normalize paths for cross-platform compatibility
  const normalized = importPath.replace(/\\/g, '/');

  // Handle aliased imports
  if (normalized.startsWith('@/')) {
    return normalized.replace('@/', 'src/');
  }

  // Handle relative imports
  if (normalized.startsWith('.')) {
    const dirPath = path.dirname(filePath);
    return path.relative(dirPath, path.resolve(dirPath, normalized));
  }

  return importPath;
}
```

### Add BeforeEach/AfterEach Hooks

```javascript
// Add beforeEach hook with resetTestMocks if needed
function addResetTestMocksHook(content) {
  if (!/vi\.fn\(|vi\.spyOn\(|vi\.mock\(/.test(content)) return content;

  const hookExists = /beforeEach\(\s*\(\)\s*=>\s*{\s*resetTestMocks\(\);?\s*}\);/.test(content);
  if (hookExists) return content;

  const hook = '\nbeforeEach(() => {\n  resetTestMocks();\n});\n\n';

  // Find insertion point after imports but before tests
  const afterImports = Math.max(content.lastIndexOf('import '), content.lastIndexOf('from '));

  if (afterImports > 0) {
    const importEndIndex = content.indexOf(';', afterImports) + 1;
    return content.slice(0, importEndIndex) + '\n' + hook + content.slice(importEndIndex);
  }

  // Fallback: add before first describe or test
  const firstTestIndex = Math.min(
    content.indexOf('describe(') > 0 ? content.indexOf('describe(') : Infinity,
    content.indexOf('it(') > 0 ? content.indexOf('it(') : Infinity,
    content.indexOf('test(') > 0 ? content.indexOf('test(') : Infinity
  );

  if (firstTestIndex < Infinity) {
    return content.slice(0, firstTestIndex) + hook + content.slice(firstTestIndex);
  }

  return content;
}
```

## 4. Batch Processing Improvements

### Output Migration Report

```javascript
// Generate a detailed migration report
function generateMigrationReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(process.cwd(), `migration-report-${timestamp}.md`);

  let report = '# Jest to Vitest Migration Report\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  report += '## Summary\n\n';
  report += `- Files processed: ${results.transformed + results.unchanged + results.skipped}\n`;
  report += `- Files transformed: ${results.transformed}\n`;
  report += `- Files unchanged: ${results.unchanged}\n`;
  report += `- Files skipped: ${results.skipped}\n`;
  report += `- Errors: ${results.error}\n\n`;

  report += '## Transformed Files\n\n';
  for (const [filePath, result] of Object.entries(results.files)) {
    if (result.status === 'transformed') {
      report += `- ${filePath}\n`;
    }
  }

  report += '\n## Manual Review Needed\n\n';
  for (const [filePath, result] of Object.entries(results.files)) {
    if (
      result.status === 'error' ||
      (result.status === 'transformed' && result.manualReviewNeeded)
    ) {
      report += `- ${filePath}`;
      if (result.manualReviewItems && result.manualReviewItems.length > 0) {
        report += ': ' + result.manualReviewItems.join(', ');
      }
      report += '\n';
    }
  }

  fs.writeFileSync(reportPath, report);
  console.log(`Migration report written to: ${reportPath}`);
}
```

### Create Test Files Batch Script

```javascript
// Script to process files in batches by pattern
function processBatchByPattern(pattern, options) {
  const files = [];

  // Find all files matching the pattern
  function findFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        findFiles(entryPath);
      } else if (entry.isFile() && FILE_EXTENSIONS.includes(path.extname(entry.name))) {
        if (pattern.test(entryPath)) {
          files.push(entryPath);
        }
      }
    }
  }

  findFiles(targetPath);

  // Process all matching files
  const results = {
    transformed: 0,
    unchanged: 0,
    skipped: 0,
    error: 0,
    files: {},
  };

  for (const file of files) {
    const result = transformFile(file, options);
    results.files[file] = result;
    results[result.status]++;
  }

  return results;
}
```

## 5. Implementation Strategy

1. Create a new branch for codemod enhancement
2. Implement core enhancements:
   - File renaming
   - Complex mock handling
   - Performance API mocking
   - Timer functions
   - Import management
   - BeforeEach/AfterEach hooks
3. Add batch processing improvements
4. Test on a small subset of files
5. Document usage and patterns in README
6. Create a batch script to handle groups of files by pattern

## 6. Next Steps

1. Implement the enhancements in phases, testing each one on sample files
2. Create a standardization script to run after the codemod
3. Update the migration workflow to use the enhanced codemod
4. Update documentation to reflect the new capabilities
