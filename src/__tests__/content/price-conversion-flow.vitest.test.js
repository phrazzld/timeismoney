/**
 * End-to-end integration tests for the price conversion flow
 * This tests the entire pipeline from price detection to DOM modification
 */
import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';

import { findPrices } from '../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../utils/converter.js';
import { processTextNode } from '../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../utils/constants.js';

describe('Price Conversion Integration Flow', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up document body for tests
    document.body.innerHTML = '';

    // Set up test DOM
    setupTestDom();
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

    // The converted node should include a span (DOM structure might vary)
    expect(parentNode.childNodes.length).toBeGreaterThan(0);

    // Find the span that was added
    const span = parentNode.querySelector(`.${CONVERTED_PRICE_CLASS}`);
    expect(span).toBeTruthy();
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toBe(CONVERTED_PRICE_CLASS);
    expect(span.getAttribute('data-original-price')).toContain('$30.00');

    // 30 dollars at 10 dollars per hour should be 3 hours
    // With replace-only strategy, original price is only in tooltip, not text content
    expect(span.textContent).toContain('3h 0m');
    expect(span.textContent).not.toContain('$30.00'); // Should NOT contain original price
    expect(span.getAttribute('aria-label')).toContain('$30.00'); // Should have tooltip with original price
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

    // With replace-only strategy, original prices are only in tooltips, not text content
    expect(convertedElements[0].textContent).not.toContain('$10.99');
    expect(convertedElements[0].getAttribute('aria-label')).toContain('$10.99');
    expect(convertedElements[0].textContent).toMatch(/\d+[hm]/); // Should contain time format

    // Check that the price values are in tooltips
    expect(convertedElements[1].textContent).not.toContain('$24.50');
    expect(convertedElements[1].getAttribute('aria-label')).toContain('$24.50');
    expect(convertedElements[1].textContent).toMatch(/\d+[hm]/); // Should contain time format

    // Check that the price values are in tooltips
    expect(convertedElements[2].textContent).not.toContain('$35.49');
    expect(convertedElements[2].getAttribute('aria-label')).toContain('$35.49');
    expect(convertedElements[2].textContent).toMatch(/\d+[hm]/); // Should contain time format
  });
});
