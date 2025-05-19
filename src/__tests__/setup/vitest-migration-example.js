/**
 * Vitest Migration Example
 *
 * This file demonstrates how to migrate a Jest test file to use Vitest
 * with the vitest-imports.js helper.
 */

// Before: Jest test with globals
// ===========================================
/*
// somefile.test.js - Before migration

// No imports - using Jest globals

describe('My Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('should do something', () => {
    const mockFn = jest.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalled();
  });
  
  test('should handle errors', () => {
    jest.useFakeTimers();
    // Test code
    jest.runAllTimers();
  });
});
*/

// After: Migrated to Vitest with the import helper
// ===========================================
/*
// somefile.vitest.test.js - After migration

// Single import for all testing functionality
import { 
  describe, it, test, expect, vi, beforeEach,
  jest, resetTestMocks 
} from '../setup/vitest-imports.js';

describe('My Component', () => {
  beforeEach(() => {
    // Option 1: Use the Vitest functions directly
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Option 2: Use resetTestMocks helper
    resetTestMocks();
    
    // Option 3: Use Jest compatibility layer (transitional approach)
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('should do something', () => {
    // Use Vitest functions directly (preferred approach)
    const mockFn = vi.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalled();
    
    // Or use Jest compatibility layer (transitional approach)
    const mockFn2 = jest.fn().mockReturnValue(42);
    expect(mockFn2()).toBe(42);
  });
  
  test('should handle errors', () => {
    // Use Vitest functions directly (preferred approach)
    vi.useFakeTimers();
    // Test code
    vi.runAllTimers();
    
    // Or use Jest compatibility layer (transitional approach)
    jest.useFakeTimers();
    jest.runAllTimers();
  });
});
*/

/**
 * Migration Checklist
 *
 * 1. Rename file from *.test.js to *.vitest.test.js
 * 2. Add import from vitest-imports.js at the top of the file
 * 3. Replace Jest globals with imported functions:
 *    - jest.fn() → vi.fn() or jest.fn() from imports
 *    - jest.spyOn() → vi.spyOn() or jest.spyOn() from imports
 *    - jest.mock() → vi.mock() or jest.mock() from imports
 *    - Other timer and mock reset functions
 * 4. Update any test-specific code that might need adjustment
 * 5. Run tests to verify the migration worked
 */

// Export nothing - this file is just an example
export {};
