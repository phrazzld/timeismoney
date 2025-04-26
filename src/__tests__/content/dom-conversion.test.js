/**
 * Integration tests for DOM conversion functionality
 * Tests the DOM modification and reversion process
 */

import { applyConversion, revertAll } from '../../content/domModifier';
import { getPriceInfo } from '../../content/priceFinder';

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

    // Assertions
    const convertedElements = document.querySelectorAll('.tim-converted-price');
    expect(convertedElements.length).toBe(3);
    
    // Check $199.99 conversion (should be 8.0h)
    expect(convertedElements[0].textContent).toBe('$199.99 (8.0h)');
    
    // Check $24.50 conversion (should be 1.0h)
    expect(convertedElements[1].textContent).toBe('$24.50 (1.0h)');
    
    // Check $49.99 conversion (should be 2.0h)
    expect(convertedElements[2].textContent).toBe('$49.99 (2.0h)');
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

    // Store original content
    const originalContent = document.querySelectorAll('.price');
    const originalTexts = Array.from(originalContent).map((el) => el.textContent);

    // Apply conversions
    const priceElements = document.querySelectorAll('.price');
    priceElements.forEach((element) => {
      // Get the text node
      const textNode = element.firstChild;
      
      // Apply conversion directly using the test pattern and mock convert function
      applyConversion(textNode, testPricePattern, mockConvertFn);
    });

    // Verify conversions were applied
    const convertedElements = document.querySelectorAll('.tim-converted-price');
    expect(convertedElements.length).toBe(3);
    convertedElements.forEach((element) => {
      expect(element.textContent).toContain('h');
    });

    // Revert all conversions
    revertAll(container);

    // Check elements are reverted to original content
    const revertedElements = document.querySelectorAll('.price');
    revertedElements.forEach((element, index) => {
      expect(element.textContent).toEqual(originalTexts[index]);
      expect(element.textContent).not.toContain('h');
    });
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
    
    // Verify initial conversion
    const convertedElement = document.querySelector('.tim-converted-price');
    expect(convertedElement).not.toBeNull();
    expect(convertedElement.textContent).toBe('$99.99 (4.0h)');
    
    // Simulate dynamic DOM update
    container.innerHTML += `
      <p>Added price: <span class="price">$149.99</span></p>
    `;
    
    // Convert newly added price
    const priceElements = document.querySelectorAll('.price');
    const newPriceElement = priceElements[1];
    applyConversion(newPriceElement.firstChild, testPricePattern, mockConvertFn);
    
    // Verify conversions exist (note: using innerHTML += preserves existing converted elements)
    const convertedElements = document.querySelectorAll('.tim-converted-price');
    expect(convertedElements.length).toBe(2); 
    expect(convertedElements[0].textContent).toBe('$99.99 (4.0h)');
    expect(convertedElements[1].textContent).toBe('$149.99 (6.0h)');
    
    // Revert all
    revertAll(container);
    
    // Verify both are reverted
    expect(document.querySelectorAll('.tim-converted-price').length).toBe(0);
    const revertedElements = document.querySelectorAll('.price');
    expect(revertedElements[1].textContent).toBe('$149.99');
  });
});