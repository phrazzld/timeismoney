/**
 * Feature flag integration tests for badge display mode
 * Tests the ability to toggle between modern and legacy badge styles
 *
 * This covers S3.6 - Feature flag implementation for easy rollback
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { processTextNode, isValidForProcessing } from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('Feature Flag - Badge Display Mode', () => {
  beforeEach(() => {
    // Set up clean DOM for each test
    document.body.innerHTML = '';

    // Mock window environment
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      getComputedStyle: vi.fn().mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      }),
    };
  });

  describe('Modern Badge Display Mode (Default)', () => {
    test('creates modern badges with replace-only strategy', () => {
      // Create test HTML with a price
      document.body.innerHTML = '<div>Product price: $25.00</div>';

      const textNode = document.body.firstChild.firstChild;
      expect(isValidForProcessing(textNode)).toBe(true);

      // Set up modern badge mode settings (default)
      const settings = {
        badgeDisplayMode: 'modern',
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

      // Find and convert price
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

      // Apply conversion with modern settings
      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      // Verify modern badge was created
      const badge = document.querySelector(`.${CONVERTED_PRICE_CLASS}`);
      expect(badge).toBeTruthy();
      expect(badge.getAttribute('data-original-price')).toBe('$25.00');

      // Modern badges show only time (replace-only strategy)
      expect(badge.textContent.trim()).toBe('1h 40m'); // $25 / $15 = 1.67 hours

      // Original price should be in tooltip/aria but not displayed text
      expect(badge!.textContent).not.toContain('$25.00');

      // Should have accessibility features
      expect(badge.getAttribute('aria-label')).toBeTruthy();
    });

    test('uses modern mode when badgeDisplayMode is not specified', () => {
      document.body.innerHTML = '<span>Price: $30.00</span>';
      const textNode = document.body.firstChild.firstChild;

      // Settings without badgeDisplayMode (should default to modern)
      const settings = {
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

      const badge = document.querySelector(`.${CONVERTED_PRICE_CLASS}`);
      expect(badge).toBeTruthy();

      // Should default to modern style (time-only display)
      expect(badge.textContent.trim()).toBe('1h 30m'); // $30 / $20 = 1.5 hours
      expect(badge!.textContent).not.toContain('$30.00');
    });
  });

  describe('Legacy Badge Display Mode', () => {
    test('creates legacy badges with augmentation strategy', () => {
      document.body.innerHTML = '<div>Special offer: $45.00</div>';
      const textNode = document.body.firstChild.firstChild;

      // Set up legacy badge mode settings
      const settings = {
        badgeDisplayMode: 'legacy',
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '18',
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
          amount: '18',
        },
      };

      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      const badge = document.querySelector(`.${CONVERTED_PRICE_CLASS}`);
      expect(badge).toBeTruthy();
      expect(badge.getAttribute('data-original-price')).toBe('$45.00');

      // Legacy badges show both price and time (augmentation strategy)
      expect(badge!.textContent).toContain('$45.00');
      expect(badge!.textContent).toContain('2h 30m'); // $45 / $18 = 2.5 hours
      expect(badge!.textContent).toBe('$45.00 (2h 30m)');

      // Should have basic tooltip
      expect(badge.title).toBe('Originally $45.00');
    });

    test('legacy badges have different styling than modern badges', () => {
      document.body.innerHTML =
        '<div id="legacy">Price: $60.00</div><div id="modern">Price: $60.00</div>';

      const legacyTextNode = document.getElementById('legacy').firstChild;
      const modernTextNode = document.getElementById('modern').firstChild;

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: { thousands: /,/g, decimal: /\./ },
        wageInfo: { frequency: 'hourly', amount: '15' },
      };

      // Create legacy badge
      const legacySettings = { badgeDisplayMode: 'legacy' };
      const priceMatch1 = findPrices(legacyTextNode.nodeValue, formatSettings);
      processTextNode(legacyTextNode, priceMatch1, conversionInfo, false, legacySettings);

      // Create modern badge
      const modernSettings = { badgeDisplayMode: 'modern' };
      const priceMatch2 = findPrices(modernTextNode.nodeValue, formatSettings);
      processTextNode(modernTextNode, priceMatch2, conversionInfo, false, modernSettings);

      const legacyBadge = document
        .getElementById('legacy')
        .querySelector(`.${CONVERTED_PRICE_CLASS}`);
      const modernBadge = document
        .getElementById('modern')
        .querySelector(`.${CONVERTED_PRICE_CLASS}`);

      expect(legacyBadge).toBeTruthy();
      expect(modernBadge).toBeTruthy();

      // Different content formats
      expect(legacyBadge!.textContent).toBe('$60.00 (4h 0m)');
      expect(modernBadge.textContent.trim()).toBe('4h 0m');

      // Different styling
      expect(legacyBadge!.style.cssText).toContain('margin-left: 0.25em');
      expect(modernBadge.style.cssText.length).toBeGreaterThan(legacyBadge.style.cssText.length); // Modern has more styles
    });
  });

  describe('Feature Flag Error Handling', () => {
    test('falls back to modern mode on invalid badgeDisplayMode', () => {
      document.body.innerHTML = '<span>Cost: $20.00</span>';
      const textNode = document.body.firstChild.firstChild;

      // Invalid badge display mode
      const settings = {
        badgeDisplayMode: 'invalid-mode',
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        frequency: 'hourly',
        amount: '10',
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
          amount: '10',
        },
      };

      const result = processTextNode(textNode, priceMatch, conversionInfo, false, settings);
      expect(result).toBe(true);

      const badge = document.querySelector(`.${CONVERTED_PRICE_CLASS}`);
      expect(badge).toBeTruthy();

      // Should fall back to modern style behavior
      expect(badge.textContent.trim()).toBe('2h 0m');
      expect(badge!.textContent).not.toContain('$20.00');
    });

    test('works correctly when settings parameter is null', () => {
      document.body.innerHTML = '<div>Item: $35.00</div>';
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
          amount: '15',
        },
      };

      // Pass null settings (should default to modern)
      const result = processTextNode(textNode, priceMatch, conversionInfo, false, null);
      expect(result).toBe(true);

      const badge = document.querySelector(`.${CONVERTED_PRICE_CLASS}`);
      expect(badge).toBeTruthy();

      // Should default to modern style
      expect(badge.textContent.trim()).toBe('2h 20m'); // $35 / $15 ≈ 2.33 hours
      expect(badge!.textContent).not.toContain('$35.00');
    });
  });

  describe('Feature Flag Integration with Real-World Scenarios', () => {
    test('handles multiple badges with mixed display modes', () => {
      // This tests edge case where settings might change during processing
      document.body.innerHTML = `
        <div class="legacy-section">
          <span>Product A: $25.00</span>
          <span>Product B: $40.00</span>
        </div>
        <div class="modern-section">
          <span>Product C: $25.00</span>
          <span>Product D: $40.00</span>
        </div>
      `;

      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const conversionInfo = {
        convertFn: convertPriceToTimeString,
        formatters: { thousands: /,/g, decimal: /\./ },
        wageInfo: { frequency: 'hourly', amount: '20' },
      };

      // Process legacy section
      const legacyNodes = document.querySelectorAll('.legacy-section span');
      legacyNodes.forEach((span) => {
        const textNode = span.firstChild;
        if (isValidForProcessing(textNode)) {
          const priceMatch = findPrices(textNode.nodeValue, formatSettings);
          if (priceMatch) {
            processTextNode(textNode, priceMatch, conversionInfo, false, {
              badgeDisplayMode: 'legacy',
            });
          }
        }
      });

      // Process modern section
      const modernNodes = document.querySelectorAll('.modern-section span');
      modernNodes.forEach((span) => {
        const textNode = span.firstChild;
        if (isValidForProcessing(textNode)) {
          const priceMatch = findPrices(textNode.nodeValue, formatSettings);
          if (priceMatch) {
            processTextNode(textNode, priceMatch, conversionInfo, false, {
              badgeDisplayMode: 'modern',
            });
          }
        }
      });

      // Verify mixed results
      const allBadges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(allBadges.length).toBe(4);

      const legacyBadges = document.querySelectorAll('.legacy-section .tim-converted-price');
      const modernBadges = document.querySelectorAll('.modern-section .tim-converted-price');

      expect(legacyBadges.length).toBe(2);
      expect(modernBadges.length).toBe(2);

      // Check legacy badges show price + time
      legacyBadges.forEach((badge) => {
        expect(badge!.textContent).toMatch(/\$\d+\.\d+ \(.+\)/);
        expect(badge!.textContent).toContain('$');
      });

      // Check modern badges show only time
      modernBadges.forEach((badge) => {
        expect(badge.textContent.trim()).toMatch(/^\d+[hm\s]*\d*[hm]*$/);
        expect(badge!.textContent).not.toContain('$');
      });
    });
  });
});
