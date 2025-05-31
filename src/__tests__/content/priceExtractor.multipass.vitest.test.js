/**
 * Tests for multi-pass price extraction functionality
 * Tests each pass independently as required by TASK-010 verification criteria
 *
 * @vitest-environment jsdom
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../../content/domPriceAnalyzer.js');
vi.mock('../../content/siteHandlers.js');
vi.mock('../../content/pricePatterns.js');

import { describe, it, expect, beforeEach, resetTestMocks } from '../setup/vitest-imports.js';

import {
  extractPrice,
  STRATEGIES,
  setDebugMode,
  getDebugLog,
} from '../../content/priceExtractor.js';
import * as domPriceAnalyzer from '../../content/domPriceAnalyzer.js';
import * as siteHandlers from '../../content/siteHandlers.js';
import * as pricePatterns from '../../content/pricePatterns.js';

describe('Multi-Pass Price Detection', () => {
  beforeEach(() => {
    resetTestMocks();
    setDebugMode(true);
  });

  describe('Pass 1: Site-Specific Handler', () => {
    it('should extract price using site-specific handler when available', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      // Mock site handler available
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue({
        name: 'amazon',
        domains: ['amazon.com'],
      });

      vi.mocked(siteHandlers.processWithSiteHandler).mockImplementation((el, callback) => {
        callback({ textContent: '$99.99' });
        return true;
      });

      const result = await extractPrice(element, { multiPassMode: true });

      expect(result).toBeDefined();
      expect(result.strategy).toBe(STRATEGIES.SITE_SPECIFIC);
      expect(result.value).toBe('99.99');
      expect(result.currency).toBe('$');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should return null when no site handler available', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      // Mock no site handler
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'site-specific', // Test only this pass
      });

      expect(result).toBeNull();
    });

    it('should handle site handler extraction errors gracefully', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue({
        name: 'failing-site',
      });

      vi.mocked(siteHandlers.processWithSiteHandler).mockImplementation(() => {
        throw new Error('Site handler failed');
      });

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'site-specific',
      });

      expect(result).toBeNull();

      // Verify error was logged but didn't crash
      const debugLog = getDebugLog();
      expect(debugLog.some((entry) => entry.message.includes('error'))).toBe(true);
    });
  });

  describe('Pass 2: DOM Attribute Extraction', () => {
    it('should extract price from aria-label attributes', async () => {
      const element = document.createElement('span');
      element.setAttribute('aria-label', 'Price: $29.99');
      element.textContent = 'Buy Now';

      // Mock domPriceAnalyzer.extractFromAttributes
      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockReturnValue([
        {
          value: '29.99',
          currency: '$',
          text: 'Price: $29.99',
          confidence: 0.95,
          source: 'aria-label',
          strategy: 'attribute',
        },
      ]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'attribute-extraction',
      });

      expect(result).toBeDefined();
      expect(result.value).toBe('29.99');
      expect(result.currency).toBe('$');
      expect(result.confidence).toBe(0.95);
      expect(result.metadata.source).toBe('aria-label');
    });

    it('should extract price from data-price attributes', async () => {
      const element = document.createElement('div');
      element.setAttribute('data-price', '149.99');
      element.setAttribute('data-currency', 'USD');

      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockReturnValue([
        {
          value: '149.99',
          currency: 'USD',
          text: '149.99 USD',
          confidence: 0.85,
          source: 'data-price',
          strategy: 'attribute',
        },
      ]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'attribute-extraction',
      });

      expect(result.value).toBe('149.99');
      expect(result.currency).toBe('USD');
      expect(result.metadata.source).toBe('data-price');
    });

    it('should return null when no price attributes found', async () => {
      const element = document.createElement('div');
      element.textContent = 'Regular text with no price attributes';

      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockReturnValue([]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'attribute-extraction',
      });

      expect(result).toBeNull();
    });
  });

  describe('Pass 3: DOM Structure Analysis', () => {
    it('should assemble split price components', async () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span class="currency">$</span><span class="amount">49</span><span class="cents">99</span>';

      // Mock split component assembly
      vi.mocked(domPriceAnalyzer.assembleSplitComponents).mockReturnValue([
        {
          value: '49.99',
          currency: '$',
          text: '$49.99',
          confidence: 0.9,
          source: 'split-components',
          strategy: 'structure',
        },
      ]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'structure-analysis',
      });

      expect(result.value).toBe('49.99');
      expect(result.currency).toBe('$');
      expect(result.metadata.source).toBe('split-components');
    });

    it('should extract nested currency symbols', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>Price: <span class="currency">€</span></span><span>25.50</span>';

      vi.mocked(domPriceAnalyzer.extractNestedCurrency).mockReturnValue([
        {
          value: '25.50',
          currency: '€',
          text: '€25.50',
          confidence: 0.85,
          source: 'nested-currency',
          strategy: 'structure',
        },
      ]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'structure-analysis',
      });

      expect(result.value).toBe('25.50');
      expect(result.currency).toBe('€');
      expect(result.metadata.source).toBe('nested-currency');
    });

    it('should return null when no structural patterns found', async () => {
      const element = document.createElement('div');
      element.textContent = 'Simple text without structural price patterns';

      vi.mocked(domPriceAnalyzer.assembleSplitComponents).mockReturnValue([]);
      vi.mocked(domPriceAnalyzer.extractNestedCurrency).mockReturnValue([]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'structure-analysis',
      });

      expect(result).toBeNull();
    });
  });

  describe('Pass 4: Enhanced Pattern Matching', () => {
    it('should extract price using pattern matching on text', async () => {
      const text = 'Item costs $19.99 today only';

      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue({
        value: '19.99',
        currency: '$',
        original: '$19.99',
        confidence: 0.8,
        pattern: 'currency-before-number',
      });

      const result = await extractPrice(text, {
        multiPassMode: true,
        onlyPass: 'pattern-matching',
      });

      expect(result.value).toBe('19.99');
      expect(result.currency).toBe('$');
      expect(result.confidence).toBe(0.8);
    });

    it('should handle complex currency formats', async () => {
      const text = 'Prix: 1.234,56 €';

      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue({
        value: '1234.56',
        currency: '€',
        original: '1.234,56 €',
        confidence: 0.85,
        pattern: 'european-format',
      });

      const result = await extractPrice(text, {
        multiPassMode: true,
        onlyPass: 'pattern-matching',
      });

      expect(result.value).toBe('1234.56');
      expect(result.currency).toBe('€');
    });

    it('should return null when no patterns match', async () => {
      const text = 'No prices in this text at all';

      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue(null);

      const result = await extractPrice(text, {
        multiPassMode: true,
        onlyPass: 'pattern-matching',
      });

      expect(result).toBeNull();
    });
  });

  describe('Pass 5: Contextual Patterns', () => {
    it('should extract contextual price patterns like "Under $X"', async () => {
      const element = document.createElement('div');
      element.textContent = 'All items under $50 in this section';

      vi.mocked(domPriceAnalyzer.extractContextualPrices).mockReturnValue([
        {
          value: '50',
          currency: '$',
          text: 'under $50',
          confidence: 0.7,
          source: 'contextual-phrase',
          strategy: 'contextual',
          context: 'under',
        },
      ]);

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'contextual-patterns',
      });

      expect(result.value).toBe('50');
      expect(result.currency).toBe('$');
      expect(result.metadata.context).toBe('under');
      expect(result.confidence).toBe(0.7);
    });

    it('should extract "from $X" patterns', async () => {
      const text = 'Prices starting from $2.99';

      vi.mocked(domPriceAnalyzer.extractContextualPrices).mockReturnValue([
        {
          value: '2.99',
          currency: '$',
          text: 'from $2.99',
          confidence: 0.75,
          source: 'contextual-phrase',
          strategy: 'contextual',
          context: 'from',
        },
      ]);

      const result = await extractPrice(text, {
        multiPassMode: true,
        onlyPass: 'contextual-patterns',
      });

      expect(result.value).toBe('2.99');
      expect(result.metadata.context).toBe('from');
    });

    it('should return null when no contextual patterns found', async () => {
      const text = 'Regular text without contextual price patterns';

      vi.mocked(domPriceAnalyzer.extractContextualPrices).mockReturnValue([]);

      const result = await extractPrice(text, {
        multiPassMode: true,
        onlyPass: 'contextual-patterns',
      });

      expect(result).toBeNull();
    });
  });

  describe('Multi-Pass Coordination', () => {
    it('should execute passes in priority order', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-label', '$99.99');
      element.textContent = 'Buy for $89.99';

      // Mock multiple passes finding results
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockReturnValue([
        {
          value: '99.99',
          currency: '$',
          confidence: 0.95,
          strategy: 'attribute',
        },
      ]);

      const results = await extractPrice(element, {
        multiPassMode: true,
        returnMultiple: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should include results from attribute extraction (high confidence)
      expect(results.some((r) => r.confidence === 0.95)).toBe(true);
    });

    it('should terminate early on high confidence result', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      // Mock site handler with high confidence
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue({ name: 'test' });
      vi.mocked(siteHandlers.processWithSiteHandler).mockImplementation((el, callback) => {
        callback({ textContent: '$99.99' });
      });

      const result = await extractPrice(element, {
        multiPassMode: true,
        earlyExitConfidence: 0.9,
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0.9);

      // Verify early termination in debug log
      const debugLog = getDebugLog();
      expect(debugLog.some((entry) => entry.message.includes('Early termination'))).toBe(true);
    });

    it('should continue through all passes in exhaustive mode', async () => {
      const element = document.createElement('div');
      element.setAttribute('aria-label', '$99.99');
      element.textContent = '$89.99';

      // Mock multiple passes
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockReturnValue([
        {
          value: '99.99',
          currency: '$',
          confidence: 0.95,
          strategy: 'attribute',
        },
      ]);
      vi.mocked(pricePatterns.selectBestPattern).mockReturnValue({
        value: '89.99',
        currency: '$',
        confidence: 0.8,
        pattern: 'text-pattern',
      });

      const results = await extractPrice(element, {
        multiPassMode: true,
        exhaustive: true,
        returnMultiple: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(1);

      // Should have results from multiple passes
      const strategies = results.map((r) => r.strategy || 'pattern-matching');
      expect(strategies.length).toBeGreaterThan(1);
    });

    it('should maintain backward compatibility when multiPassMode is false', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      // Mock existing behavior
      vi.mocked(siteHandlers.getHandlerForCurrentSite).mockReturnValue(null);
      vi.mocked(domPriceAnalyzer.extractPricesFromElement).mockReturnValue({
        prices: [
          {
            value: '99.99',
            currency: '$',
            confidence: 0.8,
            strategy: 'dom-analyzer',
          },
        ],
        metadata: { extractionTime: 10 },
      });

      const result = await extractPrice(element); // No multiPassMode

      expect(result).toBeDefined();
      expect(result.value).toBe('99.99');
      expect(result.strategy).toBe('dom-analyzer');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle pass extraction errors gracefully', async () => {
      const element = document.createElement('div');

      // Mock a pass that throws an error
      vi.mocked(domPriceAnalyzer.extractFromAttributes).mockImplementation(() => {
        throw new Error('Attribute extraction failed');
      });

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'attribute-extraction',
      });

      expect(result).toBeNull();

      // Should log error but not crash
      const debugLog = getDebugLog();
      expect(debugLog.some((entry) => entry.message.includes('error'))).toBe(true);
    });

    it('should handle invalid input gracefully', async () => {
      const result = await extractPrice(null, { multiPassMode: true });
      expect(result).toBeNull();
    });

    it('should validate pass options correctly', async () => {
      const element = document.createElement('div');

      const result = await extractPrice(element, {
        multiPassMode: true,
        onlyPass: 'invalid-pass-name',
      });

      expect(result).toBeNull();
    });
  });

  describe('Debug Logging', () => {
    it('should log pass execution details', async () => {
      const element = document.createElement('div');
      element.textContent = '$99.99';

      setDebugMode(true);

      await extractPrice(element, { multiPassMode: true });

      const debugLog = getDebugLog();

      // Should have pass-level logging
      expect(debugLog.some((entry) => entry.strategy === 'multi-pass')).toBe(true);
      expect(debugLog.some((entry) => entry.message.includes('Starting pass'))).toBe(true);
      expect(debugLog.some((entry) => entry.message.includes('completed'))).toBe(true);
    });

    it('should include pass performance metrics', async () => {
      const element = document.createElement('div');

      await extractPrice(element, { multiPassMode: true });

      const debugLog = getDebugLog();

      // Should include timing and result metrics
      expect(
        debugLog.some((entry) => Object.prototype.hasOwnProperty.call(entry, 'resultCount'))
      ).toBe(true);
    });
  });
});
