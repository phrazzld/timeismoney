/**
 * Debug functionality tests for logger module
 * Tests enhanced debugPriceDetection capabilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { debugPriceDetection, setDebugMode, isDebugMode } from '../../utils/logger.js';

describe('Logger Debug Enhancements', () => {
  beforeEach(() => {
    // Reset debug mode
    setDebugMode(true);

    // Mock console.debug
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset debug mode after each test
    setDebugMode(false);
    // Restore console.debug
    vi.restoreAllMocks();
  });

  describe('debugPriceDetection enhanced functionality', () => {
    it('should include correlation ID in debug output', () => {
      const correlationId = 'test-correlation-123';

      debugPriceDetection(
        'pipeline-start',
        'testing',
        {
          test: 'data',
        },
        null,
        correlationId
      );

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          correlation_id: correlationId,
          phase: 'pipeline-start',
          context: 'testing',
        })
      );
    });

    it('should include performance timing data when provided', () => {
      const timing = { start: 1000, end: 1100, duration: 100 };

      debugPriceDetection(
        'strategy-result',
        'dom-analyzer',
        {
          result: 'success',
        },
        timing
      );

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          timing: timing,
          performance_metrics: expect.objectContaining({
            duration: 100,
          }),
        })
      );
    });

    it('should include site configuration when provided', () => {
      const siteConfig = { domain: 'example.com', handler: 'amazon' };

      debugPriceDetection(
        'site-specific',
        'handler-selection',
        {
          handler: 'amazon',
        },
        null,
        null,
        siteConfig
      );

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          site_config: siteConfig,
        })
      );
    });

    it('should follow DEVELOPMENT_PHILOSOPHY.md logging structure', () => {
      const testData = { test: 'value' };

      debugPriceDetection('pattern-matching', 'pattern-attempt', testData);

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          timestamp: expect.any(String),
          service_name: 'timeismoney-price-detection',
          phase: 'pattern-matching',
          context: 'pattern-attempt',
          message: expect.any(String),
          data: testData,
        })
      );
    });

    it('should not log when debug mode is disabled', () => {
      // Disable debug mode and clear previous mock calls
      setDebugMode(false);
      console.debug.mockClear();

      debugPriceDetection('test', 'test', { test: 'data' });

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should handle missing optional parameters gracefully', () => {
      debugPriceDetection('pipeline-complete', 'results');

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          phase: 'pipeline-complete',
          context: 'results',
          data: {},
        })
      );
    });
  });

  describe('debug correlation and tracing', () => {
    it('should generate unique correlation IDs when not provided', () => {
      debugPriceDetection('test1', 'context1', {});
      debugPriceDetection('test2', 'context2', {});

      const calls = console.debug.mock.calls;
      const correlationId1 = calls[0][1].correlation_id;
      const correlationId2 = calls[1][1].correlation_id;

      expect(correlationId1).toBeDefined();
      expect(correlationId2).toBeDefined();
      expect(correlationId1).not.toBe(correlationId2);
    });

    it('should maintain correlation ID across related debug calls', () => {
      const correlationId = 'persistent-id-123';

      debugPriceDetection('pipeline-start', 'input', {}, null, correlationId);
      debugPriceDetection('strategy-attempt', 'site-specific', {}, null, correlationId);

      const calls = console.debug.mock.calls;
      expect(calls[0][1].correlation_id).toBe(correlationId);
      expect(calls[1][1].correlation_id).toBe(correlationId);
    });
  });

  describe('debug output format validation', () => {
    it('should produce valid JSON-structured output', () => {
      debugPriceDetection('test', 'context', { complex: { nested: 'data' } });

      const debugOutput = console.debug.mock.calls[0][1];

      // Should be serializable to JSON
      expect(() => JSON.stringify(debugOutput)).not.toThrow();

      // Should have all required fields
      expect(debugOutput).toMatchObject({
        timestamp: expect.any(String),
        service_name: expect.any(String),
        phase: expect.any(String),
        context: expect.any(String),
        message: expect.any(String),
      });
    });

    it('should handle special characters and edge cases in data', () => {
      const complexData = {
        special: 'chars "quotes" & symbols',
        nested: { array: [1, 2, 3], null: null, undefined: undefined },
        unicode: '€ $ ¥ £',
      };

      debugPriceDetection('test', 'edge-cases', complexData);

      expect(console.debug).toHaveBeenCalledWith(
        'TimeIsMoney:PriceDetection:',
        expect.objectContaining({
          data: expect.objectContaining({
            special: complexData.special,
            unicode: complexData.unicode,
          }),
        })
      );
    });
  });
});
