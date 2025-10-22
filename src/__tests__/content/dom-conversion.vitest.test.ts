/**
 * Integration tests for DOM conversion functionality
 * Tests the DOM modification and reversion process
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { applyConversion, revertAll } from '../../content/domModifier';
import { CONVERTED_PRICE_CLASS } from '../../utils/constants.js';

// Simple regex pattern for testing
const testPricePattern = /\$\d+(\.\d+)?/g;

// Mock convert function for tests
const mockConvertFn = (priceString) => {
  const match = priceString.match(/\$(\d+(\.\d+)?)/);
  if (!match) return priceString;

  const amount = parseFloat(match[1]);
  const hours = amount / 25; // Using wage of $25/hr
  return `${priceString} (${hours.toFixed(1)}h)`;
};

describe('DOM Conversion Integration', () => {
  // Setup test DOM environment
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
  });

  test('applyConversion adds time string to price elements', () => {
    // Create fixture with price elements
    document.body.innerHTML = `
      <div>
        <p>Price: <span class="price">$199.99</span></p>
        <p>Cost: <span class="price">$24.50</span></p>
        <div class="product">
          <h3>Product Title</h3>
          <span class="price">$49.99</span>
        </div>
      </div>
    `;

    // Get all price text nodes
    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach((element) => {
      // Get the text node
      const textNode = element.firstChild;

      // Apply conversion directly using the test pattern and mock convert function
      applyConversion(textNode, testPricePattern, mockConvertFn);
    });

    // Assertions based on user-visible outcomes, not implementation details
    const prices = document.querySelectorAll('p, div.product > span');

    // Verify the number of converted elements
    expect(prices.length).toBe(3);

    // Check conversions - with replace-only strategy, original prices are in tooltips
    // Find the actual converted price elements
    const convertedElements = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(convertedElements.length).toBeGreaterThanOrEqual(3);

    // Check that time is shown and original price is in aria-label (modern badges use ARIA)
    expect(convertedElements[0].textContent.trim()).toBe('8.0h');
    expect(convertedElements[0].textContent).not.toContain('$199.99');
    expect(convertedElements[0].getAttribute('aria-label')).toContain('$199.99');

    expect(convertedElements[1].textContent.trim()).toBe('1.0h');
    expect(convertedElements[1].textContent).not.toContain('$24.50');
    expect(convertedElements[1].getAttribute('aria-label')).toContain('$24.50');

    expect(convertedElements[2].textContent.trim()).toBe('2.0h');
    expect(convertedElements[2].textContent).not.toContain('$49.99');
    expect(convertedElements[2].getAttribute('aria-label')).toContain('$49.99');
  });

  test('revertAll restores original price elements', () => {
    // Create fixture with price elements
    document.body.innerHTML = `
      <div id="test-container">
        <p>Price: <span class="price">$199.99</span></p>
        <p>Cost: <span class="price">$24.50</span></p>
        <div class="product">
          <h3>Product Title</h3>
          <span class="price">$49.99</span>
        </div>
      </div>
    `;

    const container = document.getElementById('test-container');

    // Store original content for comparison
    const originalPriceTexts = [
      { selector: 'p:nth-child(1)', price: '$199.99' },
      { selector: 'p:nth-child(2)', price: '$24.50' },
      { selector: 'div.product > span', price: '$49.99' },
    ];

    // Apply conversions
    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach((element) => {
      // Get the text node
      const textNode = element.firstChild;

      // Apply conversion directly using the test pattern and mock convert function
      applyConversion(textNode, testPricePattern, mockConvertFn);
    });

    // Verify conversions were applied by checking visible content
    for (const { selector } of originalPriceTexts) {
      const element = container.querySelector(selector);
      expect(element!.textContent).toContain('h'); // Contains hours
    }

    // Revert all conversions
    revertAll(container);

    // Check elements are reverted to original content by comparing visible text
    for (const { selector, price } of originalPriceTexts) {
      const element = container.querySelector(selector);
      expect(element!.textContent).toContain(price);
      expect(element!.textContent).not.toContain('h');
    }
  });

  test('handles dynamic DOM updates correctly', () => {
    // Set up initial DOM
    document.body.innerHTML = '<div id="container"></div>';

    // Reference container for dynamic updates
    const container = document.getElementById('container');

    // Add price elements dynamically
    container.innerHTML = `
      <p>Initial price: <span class="price">$99.99</span></p>
    `;

    // Convert initial price
    const initialPriceElement = document.querySelector('.price');
    applyConversion(initialPriceElement.firstChild, testPricePattern, mockConvertFn);

    // Verify initial conversion by checking converted element
    const convertedElement = container.querySelector(`.${CONVERTED_PRICE_CLASS}`);
    expect(convertedElement).not.toBeNull();
    expect(convertedElement.textContent.trim()).toBe('4.0h');
    expect(convertedElement!.textContent).not.toContain('$99.99'); // Should NOT contain original price
    expect(convertedElement.getAttribute('aria-label')).toContain('$99.99'); // Should have aria-label (modern badges)

    // Simulate dynamic DOM update
    container.innerHTML += `
      <p>Added price: <span class="price">$149.99</span></p>
    `;

    // Convert newly added price
    const priceElements = document.querySelectorAll('.price');
    const newPriceElement = priceElements[1];
    applyConversion(newPriceElement.firstChild, testPricePattern, mockConvertFn);

    // Verify both conversions exist by checking content of both paragraphs
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(2);

    // Verify conversions exist by checking converted elements
    const allConvertedElements = container.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
    expect(allConvertedElements.length).toBe(2);

    // Verify first conversion
    expect(allConvertedElements[0].textContent.trim()).toBe('4.0h');
    expect(allConvertedElements[0].textContent).not.toContain('$99.99');
    expect(allConvertedElements[0].getAttribute('aria-label')).toContain('$99.99');

    // Verify second conversion
    expect(allConvertedElements[1].textContent.trim()).toBe('6.0h');
    expect(allConvertedElements[1].textContent).not.toContain('$149.99');
    expect(allConvertedElements[1].getAttribute('aria-label')).toContain('$149.99');

    // Revert all
    revertAll(container);

    // Verify both are reverted by checking text content
    const revertedParagraphs = container.querySelectorAll('p');

    // Verify paragraphs only contain original prices
    expect(revertedParagraphs[0].textContent).toBe('Initial price: $99.99');
    expect(revertedParagraphs[0].textContent).not.toContain('h');

    expect(revertedParagraphs[1].textContent).toBe('Added price: $149.99');
    expect(revertedParagraphs[1].textContent).not.toContain('h');
  });
});
