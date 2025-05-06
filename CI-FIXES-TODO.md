# Jest to Vitest Migration CI Fixes

## Background

The CI is failing for PR #55 "Update scripts and CI config for Vitest" because of several issues related to an incomplete Jest to Vitest migration. While the CI configuration has been updated to use Vitest, the test files themselves still contain Jest-specific code that's not compatible with Vitest.

## Approach Analysis

I've evaluated several possible approaches to fixing these issues:

### Option 1: Direct Replacement

Directly replace all Jest references with Vitest equivalents throughout the codebase.

- **Pros**: Straightforward, most "proper" solution
- **Cons**: Labor-intensive, high chance of missing some references

### Option 2: Compatibility Layer

Create a Jest-compatible API layer on top of Vitest.

- **Pros**: Minimal changes to test files, quicker to implement
- **Cons**: Technical debt, potential performance impact

### Option 3: Hybrid Approach with Setup Files

Focus on proper test setup files that handle common patterns, while updating critical references.

- **Pros**: Balance of speed and correctness, addresses root causes
- **Cons**: Requires careful design of the setup structure

### Option 4: Automated Migration

Use code transformation tools to automatically convert Jest syntax to Vitest.

- **Pros**: Consistency, saves manual effort
- **Cons**: Setup time, might not catch all project-specific patterns

## Selected Approach: Hybrid with Setup Files

The hybrid approach is most appropriate because:

1. It provides immediate fixes for the CI failures
2. It creates a sustainable pattern for ongoing migration
3. It balances manual effort with proper design
4. It's most compatible with the current state of the codebase

## Tasks

### 1. Create Vitest Setup Files

- [ ] Create a `vitest.setup.js` file at the project root
- [ ] Implement global Jest compatibility patterns in the setup file
- [ ] Add vi as a global object in test environments
- [ ] Configure Vitest to use this setup file in `vitest.config.js`
- [ ] Update CI configuration to use the new setup

### 2. Implement Common Test Helpers

- [ ] Create `src/__tests__/setup/vitest-helpers.js` for shared test utilities
- [ ] Implement `resetTestMocks` function that works with Vitest
- [ ] Add Jest-to-Vitest shim functions for common patterns
- [ ] Export all helpers for easy importing in test files

### 3. Fix Missing Jest References

- [ ] Add global Jest compatibility object to `vitest.setup.js`:

```javascript
globalThis.jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  // Add other commonly used Jest functions
};
```

- [ ] Add proper imports in integration test files:

```javascript
import { expect, vi } from 'vitest';
```

- [ ] Refactor `formHandler.storage.integration.test.js` to use Vitest syntax
- [ ] Refactor `formHandler.xss.integration.test.js` to use Vitest syntax
- [ ] Refactor `popup.error.integration.test.js` to use Vitest syntax

### 4. Fix Price Finder Test Failures

- [ ] Analyze the format difference in mock calls between Jest and Vitest
- [ ] Update assertions in `priceFinder.vitest.test.js` to match Vitest's behavior
- [ ] Fix the NaN value issue in `priceFinder.enhanced.unit.test.js`
- [ ] Ensure proper mock reset behavior in all priceFinder tests

### 5. Create Migration Patterns for Future Work

- [ ] Document Vitest usage patterns in a `VITEST-MIGRATION.md` file
- [ ] Create script to assist with updating remaining Jest references:

```bash
# Script to find remaining Jest references
grep -r "jest\." --include="*.js" src/__tests__/
```

- [ ] Add ESLint rule to prevent new Jest usage in test files
- [ ] Update package.json test scripts to support both old and new tests

### 6. Final Validation

- [ ] Run tests locally to confirm fixes: `npm test`
- [ ] Create a small test file with both Jest and Vitest patterns to verify compatibility
- [ ] Push changes and verify CI passes
- [ ] Document any remaining migration tasks for future PRs

## Implementation Priorities

1. First implement the setup files and helpers (tasks 1-2)
2. Then fix the direct reference errors (task 3)
3. Address the specific test failures (task 4)
4. Finally, add the documentation and tooling for ongoing migration (tasks 5-6)

This approach will allow the PR to pass CI quickly while setting up a proper migration path for the rest of the codebase.
