/**
 * Integration tests for Shadow DOM badge integration
 * Tests the complete Shadow DOM badge creation flow
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../setup/vitest.setup.js';
import { processTextNode, isValidForProcessing } from '../../../content/domModifier.js';
import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('Shadow DOM Integration Tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetTestMocks();
  });

  describe('Shadow DOM Feature Flag Integration', () => {
    test('creates Shadow DOM badge when feature flag is enabled', () => {
      // Create test content
      document.body.innerHTML = '<div>Product costs $25.00</div>';
      const textNode = document.body.firstChild.firstChild;

      expect(isValidForProcessing(textNode)).toBe(true);

      // Settings with Shadow DOM enabled
      const settings = {
        badgeDisplayMode: 'modern',
        useShadowDOM: true,
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '15',
      };

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      // Find price and create conversion info
      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      expect(priceMatch).toBeTruthy();

      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '15',
        },
      };

      // Process text node with Shadow DOM settings
      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      // Verify Shadow DOM badge was created
      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);

      const badge = badges[0];
      expect(badge.className).toContain('tim-badge-host');
      expect(badge.getAttribute('data-original-price')).toBe('$25.00');
    });

    test('falls back to regular badge when Shadow DOM disabled', () => {
      document.body.innerHTML = '<div>Product costs $30.00</div>';
      const textNode = document.body.firstChild.firstChild;

      // Settings with Shadow DOM disabled (default)
      const settings = {
        badgeDisplayMode: 'modern',
        useShadowDOM: false,
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '20',
      };

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '20',
        },
      };

      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      // Verify regular badge was created (not Shadow DOM)
      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);

      const badge = badges[0];
      expect(badge.className).not.toContain('tim-badge-host');
      expect(badge.className).toBe(CONVERTED_PRICE_CLASS);
    });

    test('handles Shadow DOM creation failure gracefully', () => {
      document.body.innerHTML = '<div>Item costs $40.00</div>';
      const textNode = document.body.firstChild.firstChild;

      // Mock Shadow DOM failure
      const originalAttachShadow = Element.prototype.attachShadow;
      Element.prototype.attachShadow = vi.fn().mockImplementation(() => {
        throw new Error('Shadow DOM not supported');
      });

      const settings = {
        badgeDisplayMode: 'modern',
        useShadowDOM: true,
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '25',
      };

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '25',
        },
      };

      // Should not throw, should fall back to regular badge
      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      // Should have created a badge (fallback)
      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);

      // Restore original function
      Element.prototype.attachShadow = originalAttachShadow;
    });
  });

  describe('Shadow DOM with Legacy Mode Combination', () => {
    test('prioritizes legacy mode over Shadow DOM when both enabled', () => {
      document.body.innerHTML = '<div>Price: $50.00</div>';
      const textNode = document.body.firstChild.firstChild;

      // Both legacy and Shadow DOM enabled - legacy should take priority
      const settings = {
        badgeDisplayMode: 'legacy',
        useShadowDOM: true,
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '30',
      };

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '30',
        },
      };

      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);

      const badge = badges[0];
      // Should be legacy format (shows both price and time)
      expect(badge.textContent).toContain('$50.00');
      expect(badge.textContent).toContain('1h 40m');
      expect(badge.textContent).toBe('$50.00 (1h 40m)');
    });
  });

  describe('Shadow DOM Accessibility Integration', () => {
    test('maintains accessibility features in Shadow DOM mode', () => {
      document.body.innerHTML = '<div>Cost: $35.00</div>';
      const textNode = document.body.firstChild.firstChild;

      const settings = {
        badgeDisplayMode: 'modern',
        useShadowDOM: true,
        enableAccessibility: true,
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '15',
      };

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '15',
        },
      };

      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);

      const badge = badges[0];

      // Should have accessibility attributes on host element
      expect(badge.getAttribute('role')).toBe('img');
      expect(badge.getAttribute('aria-label')).toContain('Originally $35.00');
      expect(badge.getAttribute('aria-label')).toContain('work time');
    });
  });

  describe('Error Handling in Shadow DOM Integration', () => {
    test('handles missing settings gracefully', () => {
      document.body.innerHTML = '<div>Price: $20.00</div>';
      const textNode = document.body.firstChild.firstChild;

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '10',
        },
      };

      // Pass null settings
      const result = processTextNode(textNode, priceMatch, conversionInfo, false, null);
      expect(result).toBe(true);

      // Should still create a badge (fallback behavior)
      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBe(1);
    });
  });
});
