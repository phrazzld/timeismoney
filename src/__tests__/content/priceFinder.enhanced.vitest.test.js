/**
 * Tests for the enhanced priceFinder module with international support
 */
import { describe, test, expect } from '../setup/vitest-imports.js';

import {
  findPrices,
  getLocaleFormat,
  detectFormatFromText,
  getPriceInfo,
} from '../../content/priceFinder';

describe('Enhanced Price Finder - International Support', () => {
  describe('getLocaleFormat', () => {
    test('returns correct locale format for USD', () => {
      const format = getLocaleFormat('$', 'USD');
      expect(format).toHaveProperty('localeId', 'en-US');
      expect(format).toHaveProperty('thousands', 'commas');
      expect(format).toHaveProperty('decimal', 'dot');
    });

    test('returns correct locale format for Euro', () => {
      const format = getLocaleFormat('€', 'EUR');
      expect(format).toHaveProperty('localeId', 'de-DE');
      expect(format).toHaveProperty('thousands', 'spacesAndDots');
      expect(format).toHaveProperty('decimal', 'comma');
    });

    test('prioritizes symbol over code when both provided', () => {
      // $ symbol is US format, but EUR code is EU format
      // Symbol should take precedence
      const format = getLocaleFormat('$', 'EUR');
      expect(format).toHaveProperty('localeId', 'en-US');
    });

    test('uses currency code when no symbol is provided', () => {
      const format = getLocaleFormat(null, 'EUR');
      expect(format).toHaveProperty('localeId', 'de-DE');
    });

    test('defaults to US format if no match is found', () => {
      const format = getLocaleFormat('unknown', 'UNKNOWN');
      expect(format).toHaveProperty('localeId', 'en-US');
    });
  });

  describe('detectFormatFromText', () => {
    test('detects US format from $ symbol', () => {
      const format = detectFormatFromText('This item costs $15.99');
      expect(format).toHaveProperty('localeId', 'en-US');
    });

    test('detects EU format from € symbol', () => {
      const format = detectFormatFromText('Das kostet 15,99 €');
      expect(format).toHaveProperty('localeId', 'de-DE');
    });

    test('detects format from currency code when no symbol present', () => {
      const format = detectFormatFromText('Price: 15.99 USD');
      expect(format).toHaveProperty('localeId', 'en-US');
    });

    test('returns null for text without currency indicators', () => {
      const format = detectFormatFromText('Hello world');
      expect(format).toBeNull();
    });

    test('returns null for invalid inputs', () => {
      expect(detectFormatFromText(null)).toBeNull();
      expect(detectFormatFromText(undefined)).toBeNull();
      expect(detectFormatFromText(123)).toBeNull();
    });
  });

  describe('getPriceInfo for international formats', () => {
    test('extracts price info from US format', () => {
      const info = getPriceInfo('Product costs $1,234.56');
      expect(info).toHaveProperty('amount', 1234.56);
      expect(info).toHaveProperty('currency', 'USD');
      expect(info).toHaveProperty('original', '$1,234.56');
    });

    test('extracts price info from European format', () => {
      const info = getPriceInfo('Produkt kostet 1.234,56 €');
      expect(info).toHaveProperty('amount', 1234.56);
      expect(info).toHaveProperty('currency', 'EUR');
      expect(info).toHaveProperty('original', '1.234,56 €');
    });

    test('extracts price info from Japanese format', () => {
      const info = getPriceInfo('製品コスト ¥1,234');
      expect(info).toHaveProperty('amount', 1234);
      expect(info).toHaveProperty('currency', 'JPY');
      expect(info).toHaveProperty('original', '¥1,234');
    });

    test('handles explicit format settings', () => {
      const formatSettings = {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
        isReverseSearch: false,
      };

      const info = getPriceInfo('1.234,56 €', formatSettings);
      expect(info).toHaveProperty('amount', 1234.56);
      expect(info).toHaveProperty('currency', 'EUR');
    });

    test('returns null for text without prices', () => {
      expect(getPriceInfo('No prices here')).toBeNull();
    });
  });

  describe('findPrices with international support', () => {
    test('handles auto-detection of format when not specified', () => {
      const formatSettings = {
        currencySymbol: '€',
        currencyCode: 'EUR',
      };

      const result = findPrices('Price: 1.234,56 €', formatSettings);
      expect(result).toHaveProperty('formatInfo');
      expect(result.formatInfo).toHaveProperty('thousands', 'spacesAndDots');
      expect(result.formatInfo).toHaveProperty('decimal', 'comma');
    });
  });
});
