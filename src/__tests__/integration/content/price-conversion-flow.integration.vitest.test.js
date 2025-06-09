/**
 * End-to-end integration tests for the price conversion flow
 * Tests the complete pipeline from price detection to badge creation and DOM modification
 *
 * This covers S3.4 - Integration tests for the core user journey
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { applyConversion, isValidForProcessing } from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('Price Conversion Integration Flow', () => {
  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';

    // Mock window for responsive tests
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      getComputedStyle: vi.fn().mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      }),
    };
  });

  test('complete price conversion flow works end-to-end', () => {
    // Create a text node with a price
    const parentNode = document.createElement('div');
    const textNode = document.createTextNode('The price is $30.00');
    parentNode.appendChild(textNode);
    document.body.appendChild(parentNode);

    // Step 1: Find prices using the same flow as the actual code
    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const priceMatch = findPrices(textNode.nodeValue, formatSettings);
    expect(priceMatch).toBeTruthy();
    expect(priceMatch.pattern).toBeTruthy();

    // Step 2: Verify we can find matches manually
    const matches = textNode.nodeValue.match(priceMatch.pattern);
    expect(matches).toBeTruthy();
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]).toContain('$30.00');

    // Step 3: Create converter function with $10/hour wage
    const convertFn = (priceText) => {
      return convertPriceToTimeString(
        priceText,
        {
          thousands: priceMatch.thousands,
          decimal: priceMatch.decimal,
        },
        {
          frequency: 'hourly',
          amount: '10',
        }
      );
    };

    // Step 4: Apply conversion using the modern applyConversion function
    const result = applyConversion(textNode, priceMatch.pattern, convertFn);

    // Step 5: Verify results
    expect(result).toBe(true);

    // The converted node should be replaced with text + badge elements
    expect(parentNode.childNodes.length).toBeGreaterThan(0);

    // Find the badge element
    const badge = parentNode.querySelector(`.${CONVERTED_PRICE_CLASS}`);
    expect(badge).toBeTruthy();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toBe(CONVERTED_PRICE_CLASS);

    // Check that original price is stored correctly
    expect(badge.getAttribute('data-original-price')).toBe('$30.00');

    // Modern implementation: badge only shows time, original price in tooltip/aria
    expect(badge.textContent.trim()).toBe('3h 0m'); // $30 at $10/hour = 3 hours
    expect(badge.getAttribute('aria-label')).toContain('$30.00');

    // Verify the surrounding text is preserved
    expect(parentNode.textContent).toContain('The price is');
  });

  test('complex page with multiple prices properly converts all prices', () => {
    // Create a more complex page with multiple prices
    const container = document.createElement('div');
    container.innerHTML = `
      <div>Item 1: $10.99</div>
      <div>Item 2: $24.50</div>
      <p>Your total is $35.49</p>
    `;
    document.body.appendChild(container);

    // Process each text node - simulating what the walker does
    const textNodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
        textNodes.push(node);
      }
    }

    // Should have found three text nodes with prices
    expect(textNodes.length).toBe(3);

    // Convert each price
    textNodes.forEach((node) => {
      // Step 1: Set up formatters
      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      // Step 2: Find prices
      const priceMatch = findPrices(node.nodeValue, formatSettings);

      // Verify we find matches in the text
      const matches = node.nodeValue.match(priceMatch.pattern);
      if (matches && matches.length > 0) {
        // Step 3: Create converter function with $15/hour wage
        const convertFn = (priceText) => {
          return convertPriceToTimeString(
            priceText,
            {
              thousands: priceMatch.thousands,
              decimal: priceMatch.decimal,
            },
            {
              frequency: 'hourly',
              amount: '15',
            }
          );
        };

        // Step 4: Apply conversion
        applyConversion(node, priceMatch.pattern, convertFn);
      }
    });

    // Verify all prices have been converted
    const convertedElements = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(convertedElements.length).toBe(3);

    // Check the time conversions at $15/hour (modern implementation: only time visible)
    const badges = Array.from(convertedElements);

    // $10.99 → ~0.73 hours → 44m (omit 0h)
    expect(badges[0].getAttribute('data-original-price')).toBe('$10.99');
    expect(badges[0].textContent.trim()).toBe('44m');
    expect(badges[0].getAttribute('aria-label')).toContain('$10.99');

    // $24.50 → ~1.63 hours → 1h 38m
    expect(badges[1].getAttribute('data-original-price')).toBe('$24.50');
    expect(badges[1].textContent.trim()).toBe('1h 38m');
    expect(badges[1].getAttribute('aria-label')).toContain('$24.50');

    // $35.49 → ~2.37 hours → 2h 22m
    expect(badges[2].getAttribute('data-original-price')).toBe('$35.49');
    expect(badges[2].textContent.trim()).toBe('2h 22m');
    expect(badges[2].getAttribute('aria-label')).toContain('$35.49');

    // Verify surrounding text is preserved
    expect(container.textContent).toContain('Item 1:');
    expect(container.textContent).toContain('Item 2:');
    expect(container.textContent).toContain('Your total is');
  });

  test('validates nodes before processing', () => {
    // Test isValidForProcessing function
    const parentNode = document.createElement('div');

    // Valid text node
    const validTextNode = document.createTextNode('Price: $50.00');
    parentNode.appendChild(validTextNode);
    expect(isValidForProcessing(validTextNode)).toBe(true);

    // Invalid: empty text
    const emptyTextNode = document.createTextNode('');
    expect(isValidForProcessing(emptyTextNode)).toBe(false);

    // Invalid: null node
    expect(isValidForProcessing(null)).toBe(false);

    // Invalid: already processed (within converted price element)
    const convertedParent = document.createElement('span');
    convertedParent.className = CONVERTED_PRICE_CLASS;
    const alreadyProcessedNode = document.createTextNode('$25.00');
    convertedParent.appendChild(alreadyProcessedNode);
    expect(isValidForProcessing(alreadyProcessedNode)).toBe(false);
  });

  test('handles edge cases and error recovery', () => {
    const parentNode = document.createElement('div');
    const textNode = document.createTextNode('Invalid price text without numbers');
    parentNode.appendChild(textNode);

    // Test with invalid pattern
    const invalidPattern = /this-will-not-match-anything/g;
    const convertFn = () => 'fallback result';

    const result = applyConversion(textNode, invalidPattern, convertFn);
    expect(result).toBe(false); // Should return false for no matches

    // Original text should be unchanged
    expect(parentNode.textContent).toBe('Invalid price text without numbers');
  });

  test('price detection integrates with currency recognition', () => {
    const testCases = [
      { text: 'Cost: €45.99', symbol: '€', expected: '€45.99' },
      { text: 'Price: ¥1250', symbol: '¥', expected: '¥1250' },
      { text: 'Total: £89.50', symbol: '£', expected: '£89.50' },
    ];

    testCases.forEach(({ text, symbol, expected }) => {
      const parentNode = document.createElement('div');
      const textNode = document.createTextNode(text);
      parentNode.appendChild(textNode);

      const formatSettings = {
        currencySymbol: symbol,
        currencyCode: symbol === '€' ? 'EUR' : symbol === '¥' ? 'JPY' : 'GBP',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const priceMatch = findPrices(textNode.nodeValue, formatSettings);
      if (priceMatch && priceMatch.pattern) {
        const convertFn = (priceText) => {
          return convertPriceToTimeString(
            priceText,
            {
              thousands: priceMatch.thousands,
              decimal: priceMatch.decimal,
            },
            {
              frequency: 'hourly',
              amount: '20',
            }
          );
        };

        const result = applyConversion(textNode, priceMatch.pattern, convertFn);

        if (result) {
          const badge = parentNode.querySelector(`.${CONVERTED_PRICE_CLASS}`);
          expect(badge).toBeTruthy();
          expect(badge.getAttribute('data-original-price')).toBe(expected);
        }
      }
    });
  });
});
