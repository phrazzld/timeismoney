# Accelerated Jest to Vitest Migration Plan

## Problem Statement

Our current approach of migrating Jest tests to Vitest one file at a time is inefficient and time-consuming, with nearly 100 tasks remaining. We need a strategic, "cut the Gordian knot" solution to accelerate this process.

## Objectives

- Complete the migration of all 104 test files to Vitest efficiently
- Maintain test coverage and CI reliability throughout the process
- Ensure consistency in testing patterns across the codebase
- Significantly reduce manual effort through enhanced automation

## Strategic Approach: Pattern-Based Batch Migration

Instead of tackling files individually, we'll shift to a pattern-based, batch-processing strategy with enhanced automation.

## Phase 1: Foundation & Automation Enhancement (1 week)

### 1. Enhance Core Migration Tools

#### Improve the Jest-to-Vitest Codemod

Enhance `scripts/jest-to-vitest-codemod.js` to handle:

- All Jest API patterns (`jest.fn`, `jest.mock`, `jest.spyOn`, etc.)
- Timer functions (`jest.useFakeTimers`, `jest.advanceTimersByTime`)
- Automatic file renaming (`.test.js` → `.vitest.test.js`)
- Auto-insertion of imports from `src/__tests__/setup/vitest-imports.js`
- Auto-insertion of `resetTestMocks` in `beforeEach` blocks
- Special handling for performance API mocking

```javascript
// Example enhancement for codemod
function handleJestTimers(j, root) {
  // Convert jest.useFakeTimers() to vi.useFakeTimers()
  root
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'jest' },
        property: { type: 'Identifier', name: 'useFakeTimers' },
      },
    })
    .replaceWith((path) => {
      return j.callExpression(
        j.memberExpression(j.identifier('vi'), j.identifier('useFakeTimers')),
        path.node.arguments
      );
    });

  // Similar transformations for other timer methods
}
```

#### Create Standardization Script

Create `scripts/standardize-vitest-patterns.js` to:

- Replace direct Vitest imports with imports from our helper
- Add `resetTestMocks` import and setup when needed
- Enforce project coding standards

### 2. Centralize Mocks and Helpers

#### Enhance Test Helpers

Improve `src/__tests__/setup/vitest.setup.js` to:

- Enhance Jest compatibility layer (temporary)
- Ensure `resetTestMocks` is robust and handles all mock types

Improve `src/__tests__/setup/vitest-imports.js` to:

- Export all necessary Vitest functions
- Provide convenient aliases (e.g., `fn` for `vi.fn`)

#### Centralize API Mocks

Improve mocks for frequently used external APIs:

- Chrome/browser API mocks
- Performance API mocks
- DOM environment setup helpers

### 3. Create Batch Analysis Tool

Create `scripts/analyze-test-batches.js` to:

- Identify common patterns across test files
- Group files by similarity for batch processing
- Detect which files can be fully automated vs. which need manual intervention

## Phase 2: Batch Migration (2 weeks)

### 1. Group Tests by Pattern

Organize remaining tests into batches based on:

- Test type (unit, integration, DOM)
- Common patterns (mocking strategies, timer usage, etc.)
- Complexity level

For example:

- Batch 1: Unit tests with simple mocking patterns
- Batch 2: Tests using performance API
- Batch 3: DOM interaction tests
- etc.

### 2. Batch Migration Workflow

For each batch:

1. Run enhanced codemod on all files in batch
2. Run standardization script
3. Fix any common issues identified for the batch (rather than per file)
4. Run tests and verify coverage
5. Commit batch changes

### 3. Standardize ESLint Rules

Create/update ESLint rules to:

- Forbid direct Jest usage
- Enforce Vitest import patterns
- Enforce test file naming conventions

```javascript
// Example ESLint rule configuration
module.exports = {
  plugins: ['vitest'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: ['jest', 'jest/*'],
      },
    ],
    'vitest/prefer-expect-assertions': 'error',
    'vitest/no-disabled-tests': 'warn',
    // Custom rule to enforce importing from our helper
    'custom/prefer-vitest-imports': 'error',
  },
};
```

## Phase 3: Cleanup and Finalization (1 week)

### 1. Remove Duplicates and Legacy Code

- Delete all original Jest test files once their Vitest versions are stable
- Remove Jest dependencies from package.json
- Remove Jest configuration files

### 2. Gradually Remove Compatibility Layer

- Identify tests still using the Jest compatibility layer
- Refactor them to use native Vitest APIs
- Eventually remove the compatibility layer entirely

### 3. Update Documentation

- Update all testing documentation to reflect Vitest patterns
- Create detailed examples for common testing scenarios
- Update contributor guidelines

### 4. Final Verification

- Run full test suite to ensure all tests pass
- Verify test coverage meets or exceeds previous levels
- Measure performance improvements from Jest to Vitest

## Implementation Tools

1. **Enhanced Codemod**: `scripts/jest-to-vitest-codemod.js`
2. **Pattern Standardizer**: `scripts/standardize-vitest-patterns.js`
3. **Batch Analyzer**: `scripts/analyze-test-batches.js`
4. **ESLint Rules**: `.eslintrc.js` updates
5. **Centralized Helpers**:
   - `src/__tests__/setup/vitest-imports.js`
   - `src/__tests__/setup/vitest.setup.js`
   - `src/__tests__/mocks/`

## Expected Outcomes

- All 104 test files migrated to Vitest within 4 weeks
- Consistent use of Vitest patterns across the codebase
- Improved test performance and reliability
- Comprehensive documentation for future testing

## Next Steps

1. Create task branches for each phase
2. Begin with enhancing the codemod script
3. Run analysis to identify batches
4. Define batch migration schedule
