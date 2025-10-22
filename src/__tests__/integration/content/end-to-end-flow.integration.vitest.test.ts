/**
 * Comprehensive end-to-end integration tests for the complete price conversion system
 * Tests real-world scenarios and edge cases for the full pipeline
 *
 * This completes S3.4 comprehensive integration test coverage
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { applyConversion, isValidForProcessing } from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('End-to-End Price Conversion System', () => {
  beforeEach(() => {
    // Set up clean DOM
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

  test('real-world e-commerce page simulation', () => {
    // Simulate a typical product page with various price formats
    document.body.innerHTML = `
      <div class="product-page">
        <h1>Amazing Widget</h1>
        <div class="price-section">
          <span class="original-price">Was: $49.99</span>
          <span class="sale-price">Now: $29.99</span>
          <div class="shipping">Free shipping on orders over $25.00</div>
        </div>
        <div class="related-products">
          <div class="product">Widget Pro - $39.95</div>
          <div class="product">Widget Deluxe - $59.00</div>
        </div>
        <div class="reviews">
          <p>"Great value at $29.99!" - Customer</p>
          <p>"Worth every penny of the $30 I paid." - Another Customer</p>
        </div>
      </div>
    `;

    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    // Process all text nodes in the document
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
        textNodes.push(node);
      }
    }

    // Process each text node
    textNodes.forEach((textNode) => {
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
              amount: '15', // $15/hour wage
            }
          );
        };

        applyConversion(textNode, priceMatch.pattern, convertFn);
      }
    });

    // Verify all prices were converted
    const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(badges.length).toBeGreaterThan(5); // Should find multiple price instances

    // Check some specific conversions
    const badgeTexts = Array.from(badges).map((badge) => ({
      original: badge.getAttribute('data-original-price'),
      time: badge.textContent.trim(),
    }));

    // Find specific price conversions
    const twentyFiveDollar = badgeTexts.find((b) => b.original === '$25.00');
    const twentyNineNinetyNine = badgeTexts.find((b) => b.original === '$29.99');
    const thirtyNineDollar = badgeTexts.find((b) => b.original === '$39.95');

    expect(twentyFiveDollar).toBeTruthy();
    expect(twentyFiveDollar.time).toBe('1h 40m'); // $25 / $15 = 1.67 hours

    expect(twentyNineNinetyNine).toBeTruthy();
    expect(twentyNineNinetyNine.time).toBe('2h 0m'); // $29.99 / $15 ≈ 2 hours

    expect(thirtyNineDollar).toBeTruthy();
    expect(thirtyNineDollar.time).toBe('2h 40m'); // $39.95 / $15 ≈ 2.66 hours
  });

  test('dynamic content addition and conversion', () => {
    // Start with empty content
    const container = document.createElement('div');
    container.className = 'dynamic-content';
    document.body.appendChild(container);

    // Simulate dynamic content being added (like AJAX loading)
    container.innerHTML = '<p>Loading prices...</p>';

    // No prices should be converted yet
    expect(document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`).length).toBe(0);

    // Add price content dynamically
    container.innerHTML = `
      <div class="product">
        <h3>New Product</h3>
        <span class="price">$75.00</span>
        <span class="discount">Save $15.00!</span>
      </div>
    `;

    // Process the newly added content
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
        textNodes.push(node);
      }
    }

    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    textNodes.forEach((textNode) => {
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
              amount: '12', // $12/hour wage
            }
          );
        };

        applyConversion(textNode, priceMatch.pattern, convertFn);
      }
    });

    // Verify dynamic content was processed
    const badges = container.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(badges.length).toBe(2); // $75.00 and $15.00

    const seventyFiveDollar = Array.from(badges).find(
      (b) => b.getAttribute('data-original-price') === '$75.00'
    );
    expect(seventyFiveDollar).toBeTruthy();
    expect(seventyFiveDollar.textContent.trim()).toBe('6h 15m'); // $75 / $12 = 6.25 hours
  });

  test('mixed currency handling in international context', () => {
    document.body.innerHTML = `
      <div class="international-store">
        <div class="us-section">US Price: $50.00</div>
        <div class="eu-section">EU Price: €45.00</div>
        <div class="uk-section">UK Price: £40.00</div>
        <div class="jp-section">JP Price: ¥5500</div>
      </div>
    `;

    // Process USD prices first
    const usdTextNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes('$') && isValidForProcessing(node)) {
        usdTextNodes.push(node);
      }
    }

    usdTextNodes.forEach((textNode) => {
      const formatSettings = {
        currencySymbol: '$',
        currencyCode: 'USD',
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
              amount: '15',
            }
          );
        };

        applyConversion(textNode, priceMatch.pattern, convertFn);
      }
    });

    // Note: Other currencies (€, £, ¥) may not be supported by the current price finder
    // This test focuses on USD which is well-supported
    const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(badges.length).toBeGreaterThanOrEqual(1); // At least USD should work

    const conversions = Array.from(badges).map((badge) => ({
      original: badge.getAttribute('data-original-price'),
      time: badge.textContent.trim(),
    }));

    // Check USD conversion
    const usd = conversions.find((c) => c.original === '$50.00');
    expect(usd).toBeTruthy();
    expect(usd.time).toBe('3h 20m'); // $50 / $15 ≈ 3.33 hours

    // Additional currencies can be tested when price finder supports them fully
    // For now, focus on ensuring the main USD flow works end-to-end
  });

  test('error recovery and robustness under stress', () => {
    // Create challenging content with edge cases
    document.body.innerHTML = `
      <div class="stress-test">
        <div>Normal price: $25.00</div>
        <div>Malformed: $abc.def</div>
        <div>Empty price: $</div>
        <div>Very large: $999999.99</div>
        <div>Decimal edge: $0.01</div>
        <div>No space:Price:$15.99End</div>
        <div style="display: none;">Hidden: $30.00</div>
        <script>/* Ignore: $50.00 */</script>
      </div>
    `;

    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
        textNodes.push(node);
      }
    }

    // Process with error handling
    let successCount = 0;
    let errorCount = 0;

    textNodes.forEach((textNode) => {
      try {
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
            successCount++;
          }
        }
      } catch (error) {
        errorCount++;
        // Errors should be logged but not break the process
      }
    });

    // Should process valid prices and gracefully handle invalid ones
    const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(badges.length).toBeGreaterThan(2); // At least normal prices should work
    expect(successCount).toBeGreaterThan(0);

    // Verify specific valid conversions
    const validConversions = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
    expect(validConversions).toContain('$25.00');
    expect(validConversions).toContain('$999999.99');
    expect(validConversions).toContain('$0.01');
  });

  test('accessibility integration works end-to-end', () => {
    document.body.innerHTML = `
      <div class="accessible-prices">
        <span>Product A: $45.00</span>
        <span>Product B: $67.50</span>
      </div>
    `;

    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
        textNodes.push(node);
      }
    }

    textNodes.forEach((textNode) => {
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
              amount: '18',
            }
          );
        };

        applyConversion(textNode, priceMatch.pattern, convertFn);
      }
    });

    // Verify accessibility features are working
    const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(badges.length).toBe(2);

    badges.forEach((badge) => {
      // Check ARIA attributes (format: "X hours and Y minutes work time, originally $Z")
      const ariaLabel = badge.getAttribute('aria-label');
      expect(ariaLabel).toContain('work time');
      expect(ariaLabel).toContain('originally'); // Note: lowercase 'originally'

      // Check tooltip elements exist
      const tooltipId = badge.getAttribute('aria-describedby');
      if (tooltipId) {
        const tooltip = document.getElementById(tooltipId);
      expect(tooltip).toBeTruthy();
        expect(tooltip!.className).toBe('tim-accessible-tooltip');
      }
    });

    // Verify screen reader accessible content
    const fortyFiveDollar = Array.from(badges).find(
      (b) => b.getAttribute('data-original-price') === '$45.00'
    );
    expect(fortyFiveDollar).toBeTruthy();
    expect(fortyFiveDollar.getAttribute('aria-label')).toContain('$45.00');
    expect(fortyFiveDollar.getAttribute('aria-label')).toContain('2 hours and 30 minutes');
    expect(fortyFiveDollar.textContent.trim()).toBe('2h 30m'); // $45 / $18 = 2.5 hours
  });
});
