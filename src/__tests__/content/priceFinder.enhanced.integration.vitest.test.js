/**
 * Integration tests for enhanced findPrices functionality
 * Tests the integration with priceExtractor.js pipeline
 *
 * @vitest-environment jsdom
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';

// Mock priceExtractor before importing anything else
vi.mock('../../content/priceExtractor.js', () => ({
  extractPrice: vi.fn(),
}));

import { describe, it, expect, beforeEach, resetTestMocks } from '../setup/vitest-imports.js';
import { findPrices } from '../../content/priceFinder.js';
import { extractPrice } from '../../content/priceExtractor.js';

describe('findPrices enhanced functionality', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  describe('backward compatibility', () => {
    it('should maintain exact same behavior for text-only input', async () => {
      const text = 'Price: $99.99';
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
      };

      const result = await findPrices(text, settings);

      // Should have all the expected legacy properties
      expect(result).toHaveProperty('text', text);
      expect(result).toHaveProperty('culture');
      expect(result).toHaveProperty('hasPotentialPrice');
      expect(result).toHaveProperty('isReverseSearch');
      expect(result).toHaveProperty('pattern');
      expect(result).toHaveProperty('thousands');
      expect(result).toHaveProperty('decimal');
      expect(result).toHaveProperty('formatInfo');

      // Should not call priceExtractor for text-only
      expect(vi.mocked(extractPrice)).not.toHaveBeenCalled();
    });

    it('should handle null/invalid input same as before', async () => {
      expect(await findPrices(null)).toBeNull();
      expect(await findPrices('')).toBeNull();
      expect(await findPrices(undefined)).toBeNull();
    });

    it('should preserve special test case handling', async () => {
      const text = 'Items: $12.34, $56.78, 90.12$, USD 34.56, 78.90 USD';
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
      };

      const result = await findPrices(text, settings);

      // Should preserve the special pattern matching for this test case
      expect(result.pattern).toBeDefined();
      expect(result.pattern.global).toBe(true);
    });
  });

  describe('DOM element input', () => {
    it('should accept DOM element and use priceExtractor', async () => {
      const element = document.createElement('div');
      element.textContent = '$49.99';

      // Mock priceExtractor response
      vi.mocked(extractPrice).mockResolvedValue({
        value: '49.99',
        currency: '$',
        text: '$49.99',
        confidence: 0.9,
        strategy: 'dom-analyzer',
        metadata: { source: 'textContent' },
      });

      const settings = { currencySymbol: '$', currencyCode: 'USD' };
      const result = await findPrices(element, settings);

      // Should call priceExtractor with the element
      expect(vi.mocked(extractPrice)).toHaveBeenCalledWith(element, {
        settings,
        returnMultiple: false,
      });

      // Should return legacy-compatible format
      expect(result).toHaveProperty('text', '$49.99');
      expect(result).toHaveProperty('culture');
      expect(result).toHaveProperty('hasPotentialPrice', true);
      expect(result).toHaveProperty('extractionStrategy', 'dom-analyzer');
      expect(result).toHaveProperty('confidence', 0.9);
    });

    it('should handle priceExtractor returning null', async () => {
      const element = document.createElement('div');
      element.textContent = 'No price here';

      vi.mocked(extractPrice).mockResolvedValue(null);

      const result = await findPrices(element, {});

      expect(result).toHaveProperty('hasPotentialPrice', false);
      expect(result).toHaveProperty('extractionStrategy', 'none');
    });

    it('should handle aria-label prices from priceExtractor', async () => {
      const element = document.createElement('span');
      element.setAttribute('aria-label', '$29.99');
      element.textContent = 'Price';

      vi.mocked(extractPrice).mockResolvedValue({
        value: '29.99',
        currency: '$',
        text: '$29.99',
        confidence: 0.95,
        strategy: 'dom-analyzer',
        metadata: { source: 'aria-label' },
      });

      const result = await findPrices(element, {});

      expect(result.text).toBe('$29.99');
      expect(result.confidence).toBe(0.95);
      expect(result.hasPotentialPrice).toBe(true);
    });
  });

  describe('combined input object', () => {
    it('should handle object with text and element properties', async () => {
      const element = document.createElement('div');
      element.textContent = '$19.99';

      const input = {
        text: 'Sale price $19.99',
        element: element,
      };

      vi.mocked(extractPrice).mockResolvedValue({
        value: '19.99',
        currency: '$',
        text: '$19.99',
        confidence: 0.85,
        strategy: 'dom-analyzer',
      });

      const result = await findPrices(input, {});

      expect(vi.mocked(extractPrice)).toHaveBeenCalledWith(input, {
        settings: {},
        returnMultiple: false,
      });
      expect(result.extractionStrategy).toBe('dom-analyzer');
    });

    it('should fall back to text-only when element extraction fails', async () => {
      const input = {
        text: 'Price: $99.99',
        element: document.createElement('div'),
      };

      vi.mocked(extractPrice).mockResolvedValue(null);

      const result = await findPrices(input, {});

      // Should fall back to text processing
      expect(result.text).toBe('Price: $99.99');
      expect(result.extractionStrategy).toBe('text-fallback');
    });
  });

  describe('debug logging', () => {
    it('should add debug information when debugMode is enabled', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(extractPrice).mockResolvedValue({
        value: '99.99',
        currency: '$',
        text: '$99.99',
        strategy: 'pattern-matching',
        confidence: 0.8,
      });

      const settings = { debugMode: true };
      const result = await findPrices(element, settings);

      expect(result).toHaveProperty('debugInfo');
      expect(result.debugInfo).toHaveProperty('strategy', 'pattern-matching');
      expect(result.debugInfo).toHaveProperty('confidence', 0.8);
      expect(result.debugInfo).toHaveProperty('inputType', 'element');
    });

    it('should not add debug info when debugMode is disabled', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(extractPrice).mockResolvedValue({
        value: '99.99',
        currency: '$',
        text: '$99.99',
        strategy: 'dom-analyzer',
      });

      const result = await findPrices(element, {});

      expect(result).not.toHaveProperty('debugInfo');
    });
  });

  describe('error handling', () => {
    it('should handle priceExtractor errors gracefully', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(extractPrice).mockRejectedValue(new Error('Extraction failed'));

      const result = await findPrices(element, {});

      // Should fall back to text processing
      expect(result.text).toBe('$99.99');
      expect(result.extractionStrategy).toBe('error-fallback');
      expect(result.hasPotentialPrice).toBe(true); // Based on text analysis
    });

    it('should handle invalid element input', async () => {
      const invalidElement = { nodeType: 'invalid' };

      const result = await findPrices(invalidElement, {});

      expect(result).toBeNull();
    });
  });

  describe('performance', () => {
    it('should complete DOM extraction within reasonable time', async () => {
      const element = document.createElement('div');
      element.innerHTML = Array(100).fill('<span>$10.99</span>').join('');

      vi.mocked(extractPrice).mockResolvedValue({
        value: '10.99',
        currency: '$',
        text: '$10.99',
        strategy: 'dom-analyzer',
      });

      const start = Date.now();
      await findPrices(element, {});
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('culture detection integration', () => {
    it('should preserve culture detection with DOM extraction', async () => {
      const element = document.createElement('div');
      element.textContent = '€99.99';

      vi.mocked(extractPrice).mockResolvedValue({
        value: '99.99',
        currency: '€',
        text: '€99.99',
        strategy: 'dom-analyzer',
      });

      const result = await findPrices(element, {});

      // Should detect European culture from the extracted price
      expect(result.culture).toMatch(/de-DE|fr-FR|es-ES/); // Any European locale
    });

    it('should use settings culture when provided', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(extractPrice).mockResolvedValue({
        value: '99.99',
        currency: '$',
        text: '$99.99',
        strategy: 'dom-analyzer',
      });

      const settings = { culture: 'en-CA' };
      const result = await findPrices(element, settings);

      expect(result.culture).toBe('en-CA');
    });
  });
});
