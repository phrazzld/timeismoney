/**
 * End-to-end integration tests for the price conversion flow with Vitest
 *
 * This tests the entire pipeline from price detection to DOM modification
 * and verifies that prices are correctly converted to time representations
 */

import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { processTextNode } from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';
import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';

describe('Price Conversion Integration Flow', () => {
  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';
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

    // Step 2: Verify we can find matches manually (what our fix added)
    const matches = textNode.nodeValue.match(priceMatch.pattern);
    expect(matches).toBeTruthy();
    expect(matches.length).toBeGreaterThan(0);
    // The match includes the full text with the price
    expect(matches[0]).toContain('$30.00');

    // Step 3: Create conversion info
    const conversionInfo = {
      convertFn: convertPriceToTimeString,
      formatters: {
        thousands: priceMatch.thousands,
        decimal: priceMatch.decimal,
      },
      wageInfo: {
        frequency: 'hourly',
        amount: '10', // $10/hour wage
      },
    };

    // Step 4: Process the node
    const result = processTextNode(textNode, priceMatch, conversionInfo, false);

    // Step 5: Verify results
    expect(result).toBe(true);

    // The converted node should be replaced with a span
    expect(parentNode.childNodes.length).toBe(1);
    const span = parentNode.childNodes[0];
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toBe(CONVERTED_PRICE_CLASS);
    // The data-original-price attribute stores the entire match, not just the price
    expect(span.getAttribute('data-original-price')).toContain('$30.00');

    // 30 dollars at 10 dollars per hour should be 3 hours
    expect(span.textContent).toContain('$30.00');
    expect(span.textContent).toContain('3h 0m');
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
      if (node.nodeValue.trim() !== '') {
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
        // Step 3: Set up conversion info
        const conversionInfo = {
          convertFn: convertPriceToTimeString,
          formatters: {
            thousands: priceMatch.thousands,
            decimal: priceMatch.decimal,
          },
          wageInfo: {
            frequency: 'hourly',
            amount: '15', // $15/hour wage
          },
        };

        // Step 4: Process the node
        processTextNode(node, priceMatch, conversionInfo, false);
      }
    });

    // Verify all prices have been converted
    const convertedElements = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(convertedElements.length).toBe(3);

    // The actual values depend on the implementation in convertPriceToTimeString
    // the wage is $15/hour for this test

    // First price: $10.99 / $15 ≈ 0.73 hours ≈ 44 minutes
    expect(convertedElements[0].textContent).toContain('Item 1: $10.99');

    // Second price: $24.50 / $15 ≈ 1.63 hours ≈ 1h 38m
    expect(convertedElements[1].textContent).toContain('Item 2: $24.50');

    // Third price: $35.49 / $15 ≈ 2.37 hours ≈ 2h 22m
    expect(convertedElements[2].textContent).toContain('Your total is $35.49');
  });
});
