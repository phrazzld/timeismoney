# T014 · Refactor · P1: migrate integration tests to vitest

## Task Description

Convert Jest API calls to Vitest in `src/__tests__/integration/` tests, ensuring correct JSDOM environment usage and centralized mock application.

## Implementation Plan

### 1. Analyze Integration Test Structure

- Identify integration test files (particularly in options/ and content/ directories)
- Document the primary Jest APIs used in integration tests
- Identify JSDOM environment dependencies

### 2. Create Migration Approach

- Define a consistent pattern for Vitest imports
- Create a standard for JSDOM environment configuration
- Determine approach for handling async behavior and timers

### 3. Migration Implementation

1. Create a reference converted integration test file with Vitest best practices
2. Migrate tests by category in the following order:
   - Content integration tests
   - Options integration tests
   - Other integration tests

3. For each file:
   - Add Vitest imports
   - Replace Jest API calls 
   - Update JSDOM environment settings
   - Update mock implementations
   - Fix async behavior and timers if needed

### 4. Testing and Validation

- Run tests in isolation using `npx vitest run <file-path>` to verify
- Fix any integration-specific issues
- Ensure correct JSDOM usage

### 5. Implementation Issues & Solutions

1. **JSDOM Environment Configuration**:
   - In Jest, the JSDOM environment is set globally
   - In Vitest, use `@vitest/browser` configuration

2. **Async Testing**:
   - Ensure Promise-based tests are properly awaited
   - Properly handle timers with `vi.useFakeTimers()`

3. **Centralized Mocks**:
   - Import mocks from centralized mock files
   - Ensure proper isolation between tests

## Jest to Vitest Conversion Guide

| Jest Pattern                  | Vitest Replacement          |
| ----------------------------- | --------------------------- |
| `jest.fn()`                   | `vi.fn()`                   |
| `jest.mock()`                 | `vi.mock()`                 |
| `jest.spyOn()`                | `vi.spyOn()`                |
| `jest.clearAllMocks()`        | `vi.clearAllMocks()`        |
| `jest.resetAllMocks()`        | `vi.resetAllMocks()`        |
| `jest.restoreAllMocks()`      | `vi.restoreAllMocks()`      |
| `jest.useFakeTimers()`        | `vi.useFakeTimers()`        |
| `jest.useRealTimers()`        | `vi.useRealTimers()`        |
| `jest.runAllTimers()`         | `vi.runAllTimers()`         |
| `jest.runOnlyPendingTimers()` | `vi.runOnlyPendingTimers()` |
| `jest.advanceTimersByTime()`  | `vi.advanceTimersByTime()`  |

## Import Pattern for Integration Tests

All integration test files should start with:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## JSDOM Environment Setup

For integration tests that require DOM:

```javascript
// Import DOM testing utilities
import { render, screen, cleanup } from '@testing-library/react';

// Setup and teardown
beforeEach(() => {
  // DOM setup
});

afterEach(() => {
  // DOM cleanup
  cleanup();
});
```

## Special Cases

- Pay special attention to timer mocks and async tests
- Ensure correct configuration for JSDOM environment
- Watch for tests that might be relying on Jest-specific behavior