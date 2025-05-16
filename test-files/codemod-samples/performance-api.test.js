/**
 * Sample Jest test file with Performance API usage
 */

import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from '../../src/__tests__/setup/vitest-imports.js';
import { resetTestMocks } from '../../vitest.setup.js';
import { processNodes } from '../../src/content/domScanner.js';

// Mock Performance API
const originalPerformance = global.performance;
global.performance = {
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn().mockImplementation((name) => {
    // Handle special cases for error measures
    if (name === 'Total Processing Error' || name === 'Total Processing Time (Error)') {
      return [{ name, startTime: 0, duration: 5, entryType: 'measure' }];
    }

    // Map of common performance measures
    const commonMeasures = {
      'batch-processing': [
        { name: 'batch-processing', startTime: 0, duration: 10, entryType: 'measure' },
      ],
      'Total Processing Time': [
        { name: 'Total Processing Time', startTime: 0, duration: 10, entryType: 'measure' },
      ],
      processPendingNodes: [
        { name: 'processPendingNodes', startTime: 0, duration: 10, entryType: 'measure' },
      ],
    };

    // Return the common measure if it exists, otherwise a default
    return commonMeasures[name] || [{ name, startTime: 0, duration: 10, entryType: 'measure' }];
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

describe('Performance API Sample', () => {
  beforeEach(() => {
    resetTestMocks();

    // Clear existing performance entries
    performance.clearMarks();
    performance.clearMeasures();

    // Mock performance methods if needed
    if (typeof performance.mark !== 'function') {
      performance.mark = vi.fn();
    }
    if (typeof performance.measure !== 'function') {
      performance.measure = vi.fn();
    }
    if (typeof performance.getEntriesByName !== 'function') {
      performance.getEntriesByName = vi.fn().mockReturnValue([
        {
          duration: 10,
        },
      ]);
    }
  });

  test('measures performance of node processing', () => {
    // Create sample nodes
    const nodes = [
      document.createElement('div'),
      document.createElement('span'),
      document.createElement('p'),
    ];

    // Set up performance spy
    const markSpy = vi.spyOn(performance, 'mark');
    const measureSpy = vi.spyOn(performance, 'measure');

    // Process the nodes
    processNodes(nodes);

    // Verify performance marks were created
    expect(markSpy).toHaveBeenCalledWith('processNodes-start');
    expect(markSpy).toHaveBeenCalledWith('processNodes-end');

    // Verify performance measure was created
    expect(measureSpy).toHaveBeenCalledWith(
      'processNodes',
      'processNodes-start',
      'processNodes-end'
    );
  });

  test('logs performance metrics for expensive operations', () => {
    // Set up mocks
    const getEntriesSpy = vi
      .spyOn(performance, 'getEntriesByName')
      .mockReturnValue([{ duration: 150 }]);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

    // Call function that uses performance API
    processBatchWithPerformanceLogging([1, 2, 3, 4, 5]);

    // Verify performance was measured
    expect(getEntriesSpy).toHaveBeenCalledWith('batch-processing');

    // Verify warning logged for slow operation
    expect(consoleSpy).toHaveBeenCalledWith('Performance warning: batch processing took 150ms');
  });
});

// Helper function for testing
function processBatchWithPerformanceLogging(items) {
  performance.mark('batch-start');

  // Simulate processing
  for (const item of items) {
    // Process item
  }

  performance.mark('batch-end');
  performance.measure('batch-processing', 'batch-start', 'batch-end');

  // Get the measure
  const measures = performance.getEntriesByName('batch-processing');
  const duration = measures[0].duration;

  // Log warning if slow
  if (duration > 100) {
    console.warn(`Performance warning: batch processing took ${duration}ms`);
  }

  return items.map((i) => i * 2);
}
