/**
 * Tests for Price Patterns module
 * Test-first development with real examples.md data
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';

// Import the module we're going to create
import {
  matchSpaceVariations,
  matchSplitComponents,
  matchContextualPhrases,
  matchLargeNumbers,
  selectBestPattern,
  validatePatternMatch,
  normalizePrice,
} from '../../content/pricePatterns.js';

describe('Price Patterns Library', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  describe('Space Variation Patterns', () => {
    test('matches euro with space before currency', () => {
      const text = '272.46 €';
      const result = matchSpaceVariations(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '272.46',
        currency: '€',
        confidence: expect.any(Number),
        pattern: 'space-before-currency',
        original: '272.46 €',
      });
    });

    test('matches euro with no space after currency', () => {
      const text = '596.62€';
      const result = matchSpaceVariations(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '596.62',
        currency: '€',
        confidence: expect.any(Number),
        pattern: 'no-space-after-currency',
        original: '596.62€',
      });
    });

    test('handles decimal comma format', () => {
      const text = '€ 14,32';
      const result = matchSpaceVariations(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '14.32', // normalized to dot decimal
        currency: '€',
        confidence: expect.any(Number),
        pattern: 'space-after-currency',
        original: '€ 14,32',
      });
    });

    test('handles multiple space variations in same text', () => {
      const text = 'Was 100.50 € now €89,99';
      const result = matchSpaceVariations(text);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('100.50');
      expect(result[1].value).toBe('89.99');
    });

    test('returns empty array for non-matching text', () => {
      const text = 'No prices here just text';
      const result = matchSpaceVariations(text);

      expect(result).toEqual([]);
    });
  });

  describe('Split Component Patterns', () => {
    test('reconstructs Cdiscount split euro format', () => {
      const parts = ['449€', '00'];
      const result = matchSplitComponents(parts);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '449.00',
        currency: '€',
        confidence: expect.any(Number),
        pattern: 'cdiscount-split',
        parts: ['449€', '00'],
        reconstructed: '449€ 00',
      });
    });

    test('handles different split patterns', () => {
      const testCases = [
        {
          parts: ['$', '25', '.99'],
          expected: { value: '25.99', currency: '$', pattern: 'multi-part-split' },
        },
        {
          parts: ['USD', '100.00'],
          expected: { value: '100.00', currency: 'USD', pattern: 'currency-code-split' },
        },
      ];

      testCases.forEach(({ parts, expected }) => {
        const result = matchSplitComponents(parts);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(expected);
      });
    });

    test('handles invalid split combinations', () => {
      const invalidCases = [['just', 'text'], ['€'], []];

      invalidCases.forEach((parts) => {
        const result = matchSplitComponents(parts);
        expect(result).toEqual([]);
      });
    });

    test('prioritizes most likely split patterns', () => {
      const parts = ['449', '€', '00']; // Ambiguous case
      const result = matchSplitComponents(parts);

      expect(result).toHaveLength(1);
      expect(result[0].confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Contextual Phrase Patterns', () => {
    test('extracts price from "Under $X" pattern', () => {
      const text = 'Under $20';
      const result = matchContextualPhrases(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '20',
        currency: '$',
        confidence: expect.any(Number),
        pattern: 'under-maximum',
        context: 'under',
        original: 'Under $20',
      });
    });

    test('extracts price from "from $X" pattern', () => {
      const text = 'Crazy-good finds from $2.99';
      const result = matchContextualPhrases(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '2.99',
        currency: '$',
        confidence: expect.any(Number),
        pattern: 'from-minimum',
        context: 'from',
        original: 'from $2.99',
      });
    });

    test('handles case insensitive contexts', () => {
      const cases = ['UNDER €15', 'From $9.99', 'starting at ¥1000'];

      cases.forEach((text) => {
        const result = matchContextualPhrases(text);
        expect(result).toHaveLength(1);
        expect(result[0].confidence).toBeGreaterThan(0.6);
      });
    });

    test('handles multiple contextual prices', () => {
      const text = 'Items from $5 to under $50';
      const result = matchContextualPhrases(text);

      expect(result).toHaveLength(2);
      expect(result[0].context).toBe('from');
      expect(result[1].context).toBe('under');
    });

    test('ignores non-contextual prices', () => {
      const text = 'Price is $10.99';
      const result = matchContextualPhrases(text);

      expect(result).toEqual([]);
    });
  });

  describe('Large Number Patterns', () => {
    test('handles comma-separated thousands', () => {
      const text = '$2,500,000';
      const result = matchLargeNumbers(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        value: '2500000', // normalized without commas
        currency: '$',
        confidence: expect.any(Number),
        pattern: 'comma-thousands',
        original: '$2,500,000',
      });
    });

    test('handles different thousand separators', () => {
      const cases = [
        { text: '€1.234.567', expected: '1234567' },
        { text: '£1 234 567', expected: '1234567' },
        { text: '$1,234,567.89', expected: '1234567.89' },
      ];

      cases.forEach(({ text, expected }) => {
        const result = matchLargeNumbers(text);
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(expected);
      });
    });

    test('distinguishes between thousands and decimals', () => {
      const text = '$1,234.56'; // Comma is thousands, dot is decimal
      const result = matchLargeNumbers(text);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('1234.56');
    });

    test('handles small numbers correctly', () => {
      const text = '$123.45'; // Should not be treated as large number pattern
      const result = matchLargeNumbers(text);

      expect(result).toEqual([]);
    });
  });

  describe('Pattern Selection and Integration', () => {
    test('selectBestPattern chooses highest confidence match', () => {
      const text = '$100.00'; // Could match multiple patterns
      const result = selectBestPattern(text);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.pattern).toBeDefined();
    });

    test('selectBestPattern with context hints', () => {
      const text = '449€ 00';
      const context = { splitComponents: true };
      const result = selectBestPattern(text, context);

      expect(result.pattern).toBe('cdiscount-split');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    test('validatePatternMatch confirms accuracy', () => {
      const match = {
        value: '25.99',
        currency: '$',
        original: '$25.99',
      };
      const originalText = 'Price: $25.99';

      const isValid = validatePatternMatch(match, originalText);
      expect(isValid).toBe(true);
    });

    test('validatePatternMatch rejects inaccurate matches', () => {
      const match = {
        value: '25.99',
        currency: '$',
        original: '$25.99',
      };
      const originalText = 'Price: €30.00'; // Different price/currency

      const isValid = validatePatternMatch(match, originalText);
      expect(isValid).toBe(false);
    });
  });

  describe('Price Normalization', () => {
    test('normalizePrice standardizes format', () => {
      const cases = [
        { raw: '1.234,56', format: 'european', expected: '1234.56' },
        { raw: '1,234.56', format: 'us', expected: '1234.56' },
        { raw: '1 234,56', format: 'french', expected: '1234.56' },
      ];

      cases.forEach(({ raw, format, expected }) => {
        const result = normalizePrice(raw, format);
        expect(result).toBe(expected);
      });
    });

    test('normalizePrice handles edge cases', () => {
      const edgeCases = [
        { raw: '', expected: null },
        { raw: 'invalid', expected: null },
        { raw: '0', expected: '0' },
        { raw: '0.00', expected: '0.00' },
      ];

      edgeCases.forEach(({ raw, expected }) => {
        const result = normalizePrice(raw);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Real Examples from examples.md', () => {
    const realExamples = [
      {
        name: 'Cdiscount space euro',
        text: '272.46 €',
        expectedPattern: 'space-before-currency',
        expectedValue: '272.46',
        expectedCurrency: '€',
      },
      {
        name: 'Cdiscount no space euro',
        text: '596.62€',
        expectedPattern: 'no-space-after-currency',
        expectedValue: '596.62',
        expectedCurrency: '€',
      },
      {
        name: 'Amazon contextual under',
        text: 'Under $20',
        expectedPattern: 'under-maximum',
        expectedValue: '20',
        expectedCurrency: '$',
      },
      {
        name: 'Amazon contextual from',
        text: 'Crazy-good finds from $2.99',
        expectedPattern: 'from-minimum',
        expectedValue: '2.99',
        expectedCurrency: '$',
      },
      {
        name: 'Zillow large number',
        text: '$2,500,000',
        expectedPattern: 'comma-thousands',
        expectedValue: '2500000',
        expectedCurrency: '$',
      },
    ];

    realExamples.forEach(({ name, text, expectedPattern, expectedValue, expectedCurrency }) => {
      test(`handles ${name}`, () => {
        const result = selectBestPattern(text);

        expect(result).toBeDefined();
        expect(result.pattern).toBe(expectedPattern);
        expect(result.value).toBe(expectedValue);
        expect(result.currency).toBe(expectedCurrency);
        expect(result.confidence).toBeGreaterThan(0.7);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('handles very long text efficiently', () => {
      const longText = 'Lorem ipsum '.repeat(1000) + '$25.99';

      const start = Date.now();
      const result = selectBestPattern(longText);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Should complete in under 50ms
      expect(result.value).toBe('25.99');
    });

    test('handles malformed input gracefully', () => {
      const malformedInputs = [null, undefined, '', 123, {}, '$$$$', '€€€€€'];

      malformedInputs.forEach((input) => {
        expect(() => selectBestPattern(input)).not.toThrow();
        const result = selectBestPattern(input);
        expect(result).toBeNull();
      });
    });

    test('handles conflicting patterns consistently', () => {
      const conflictingText = '$100 USD 100.00'; // Multiple potential matches
      const result = selectBestPattern(conflictingText);

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
      // Should consistently pick the same pattern

      const result2 = selectBestPattern(conflictingText);
      expect(result.pattern).toBe(result2.pattern);
    });
  });
});
