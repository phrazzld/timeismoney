/**
 * Integration tests for DOM conversion functionality
 * Tests the DOM modification and reversion process
 */

import { describe, test, expect, beforeEach, afterEach } from '../../setup/vitest-imports.js';
import { applyConversion, revertAll } from '../../../content/domModifier';

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

    // Check conversions by examining text content
    expect(prices[0].textContent).toContain('$199.99');
    expect(prices[0].textContent).toContain('8.0h');

    expect(prices[1].textContent).toContain('$24.50');
    expect(prices[1].textContent).toContain('1.0h');

    expect(prices[2].textContent).toContain('$49.99');
    expect(prices[2].textContent).toContain('2.0h');
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
      expect(element.textContent).toContain('h'); // Contains hours
    }

    // Revert all conversions
    revertAll(container);

    // Check elements are reverted to original content by comparing visible text
    for (const { selector, price } of originalPriceTexts) {
      const element = container.querySelector(selector);
      expect(element.textContent).toContain(price);
      expect(element.textContent).not.toContain('h');
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

    // Verify initial conversion by checking text content
    const initialPriceParent = container.querySelector('p');
    expect(initialPriceParent).not.toBeNull();
    expect(initialPriceParent.textContent).toContain('$99.99');
    expect(initialPriceParent.textContent).toContain('4.0h');

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

    // Verify first paragraph still shows conversion
    expect(paragraphs[0].textContent).toContain('$99.99');
    expect(paragraphs[0].textContent).toContain('4.0h');

    // Verify second paragraph shows conversion
    expect(paragraphs[1].textContent).toContain('$149.99');
    expect(paragraphs[1].textContent).toContain('6.0h');

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
