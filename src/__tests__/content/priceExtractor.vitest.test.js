/**
 * Tests for unified price extraction pipeline
 *
 * @vitest-environment jsdom
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';

// Mock dependencies first
vi.mock('../../content/domPriceAnalyzer.js');
vi.mock('../../content/siteHandlers.js');
vi.mock('../../content/pricePatterns.js');

import { describe, it, expect, beforeEach, resetTestMocks } from '../setup/vitest-imports.js';

import {
  extractPrice,
  createPipeline,
  STRATEGIES,
  setDebugMode,
  getDebugLog,
} from '../../content/priceExtractor.js';
import * as domPriceAnalyzer from '../../content/domPriceAnalyzer.js';
import * as siteHandlers from '../../content/siteHandlers.js';
import * as pricePatterns from '../../content/pricePatterns.js';

describe('priceExtractor', () => {
  beforeEach(() => {
    resetTestMocks();
    setDebugMode(false);
  });

  describe('extractPrice', () => {
    it('should extract price from DOM element using site-specific handler', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      // Mock site handler
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue({
        name: 'test-site',
        process: vi.fn().mockReturnValue(true),
      });

      vi.mocked(siteHandlers.processWithSiteHandler).mockImplementation((node, callback) => {
        callback({ textContent: '$99.99' });
        return true;
      });

      const result = await extractPrice(element);

      expect(result).toEqual({
        value: '99.99',
        currency: '$',
        text: '$99.99',
        confidence: 0.95,
        strategy: 'site-specific',
        metadata: {
          source: 'site-handler',
          handler: 'test-site',
        },
      });
    });

    it('should fall back to DOM analyzer when no site handler available', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-label', '$49.99');

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [
          {
            value: '49.99',
            currency: '$',
            text: '$49.99',
            strategy: 'attribute',
            source: 'aria-label',
            confidence: 0.95,
          },
        ],
        metadata: {
          strategiesAttempted: ['attribute'],
          extractionTime: 5,
        },
      });

      const result = await extractPrice(element);

      expect(result).toEqual({
        value: '49.99',
        currency: '$',
        text: '$49.99',
        confidence: 0.95,
        strategy: 'dom-analyzer',
        metadata: {
          source: 'aria-label',
          domStrategy: 'attribute',
          extractionTime: 5,
        },
      });
    });

    it('should use pattern matching for text-only input', async () => {
      const text = 'Price: €99.99';

      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue({
        value: '99.99',
        currency: '€',
        confidence: 0.85,
        pattern: 'standard-format',
        original: '€99.99',
      });

      const result = await extractPrice({ text });

      expect(result).toEqual({
        value: '99.99',
        currency: '€',
        text: '€99.99',
        confidence: 0.85,
        strategy: 'pattern-matching',
        metadata: {
          pattern: 'standard-format',
        },
      });
    });

    it('should handle split component prices', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>449€</span> <span>00</span>';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [
          {
            value: '449.00',
            currency: '€',
            text: '449€ 00',
            strategy: 'splitComponent',
            confidence: 0.9,
          },
        ],
        metadata: {
          strategiesAttempted: ['splitComponent'],
        },
      });

      const result = await extractPrice(element);

      expect(result.value).toBe('449.00');
      expect(result.currency).toBe('€');
      expect(result.strategy).toBe('dom-analyzer');
    });

    it('should return multiple prices when requested', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>$10.00</span> <span>$20.00</span>';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [
          { value: '10.00', currency: '$', text: '$10.00', confidence: 0.8 },
          { value: '20.00', currency: '$', text: '$20.00', confidence: 0.8 },
        ],
        metadata: {},
      });
      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue(null);

      const results = await extractPrice(element, { returnMultiple: true });

      expect(results).toHaveLength(2);
      expect(results[0].value).toBe('10.00');
      expect(results[1].value).toBe('20.00');
    });

    it('should return null when no price found', async () => {
      const element = document.createElement('div');
      element.textContent = 'No price here';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [],
        metadata: {},
      });
      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue(null);

      const result = await extractPrice(element);

      expect(result).toBeNull();
    });

    it('should handle strategy errors gracefully', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockImplementation(() => {
        throw new Error('Site handler error');
      });

      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [{ value: '99.99', currency: '$', text: '$99.99', confidence: 0.8 }],
        metadata: {},
      });

      // Ensure pattern matching doesn't interfere
      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue(null);

      const result = await extractPrice(element);

      expect(result).toBeTruthy();
      expect(result.value).toBe('99.99');
      expect(result.strategy).toBe('dom-analyzer');
    });

    it('should respect confidence threshold', async () => {
      const element = document.createElement('div');

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [
          { value: '10.00', currency: '$', confidence: 0.5 },
          { value: '20.00', currency: '$', confidence: 0.9 },
        ],
        metadata: {},
      });

      const result = await extractPrice(element, { minConfidence: 0.8 });

      expect(result.value).toBe('20.00');
    });
  });

  describe('createPipeline', () => {
    it('should create custom pipeline with provided strategies', () => {
      const customStrategy = {
        name: 'custom',
        priority: 0,
        canHandle: () => true,
        extract: () => [{ value: '1.00', currency: '$' }],
      };

      const pipeline = createPipeline([customStrategy]);
      expect(pipeline).toBeDefined();
      expect(pipeline.strategies).toContain(customStrategy);
    });

    it('should sort strategies by priority', () => {
      const strategy1 = { name: 's1', priority: 10 };
      const strategy2 = { name: 's2', priority: 5 };
      const strategy3 = { name: 's3', priority: 15 };

      const pipeline = createPipeline([strategy1, strategy2, strategy3]);

      expect(pipeline.strategies[0].name).toBe('s2');
      expect(pipeline.strategies[1].name).toBe('s1');
      expect(pipeline.strategies[2].name).toBe('s3');
    });
  });

  describe('debug mode', () => {
    it('should log strategy attempts in debug mode', async () => {
      setDebugMode(true);

      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [{ value: '99.99', currency: '$' }],
        metadata: {},
      });

      await extractPrice(element);

      const debugLog = getDebugLog();
      expect(debugLog.length).toBeGreaterThan(0);
      expect(debugLog.some((entry) => entry.strategy === 'dom-analyzer')).toBe(true);
    });

    it('should clear debug log when debug mode disabled', () => {
      setDebugMode(true);
      // Add some log entries
      getDebugLog().push({ test: 'entry' });

      setDebugMode(false);
      expect(getDebugLog()).toHaveLength(0);
    });
  });

  describe('STRATEGIES enum', () => {
    it('should export available strategy names', () => {
      expect(STRATEGIES).toBeDefined();
      expect(STRATEGIES.SITE_SPECIFIC).toBe('site-specific');
      expect(STRATEGIES.DOM_ANALYZER).toBe('dom-analyzer');
      expect(STRATEGIES.PATTERN_MATCHING).toBe('pattern-matching');
    });
  });
});
