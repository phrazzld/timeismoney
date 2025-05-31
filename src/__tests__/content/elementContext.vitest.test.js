/**
 * Tests for element context analysis functionality
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '../setup/vitest-imports.js';
import { getElementContext } from '../../content/domPriceAnalyzer.js';

describe('Element Context Analysis', () => {
  let container;

  beforeEach(() => {
    // Setup clean DOM container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('getElementContext function', () => {
    it('should return empty context for null element', () => {
      const context = getElementContext(null);

      expect(context).toBeDefined();
      expect(context.element).toBeNull();
      expect(context.confidence).toBe(0);
      expect(context.priceIndicators).toBeDefined();
      expect(context.hierarchy).toBeDefined();
      expect(context.attributes).toBeDefined();
      expect(context.semantics).toBeDefined();
    });

    it('should return empty context for invalid element', () => {
      const context = getElementContext({ invalid: 'object' });

      expect(context.element).toBeNull();
      expect(context.confidence).toBe(0);
    });

    it('should analyze basic element with no price context', () => {
      container.innerHTML = '<div><span>Regular text</span></div>';
      const element = container.querySelector('span');

      const context = getElementContext(element);

      expect(context.element).toBe(element);
      expect(context.confidence).toBeLessThan(0.5);
      expect(context.priceIndicators.hasParentContainer).toBe(false);
      expect(context.priceIndicators.hasPriceClasses).toBe(false);
      expect(context.priceIndicators.hasDataAttributes).toBe(false);
    });
  });

  describe('Parent Container Detection', () => {
    it('should identify price container parents', () => {
      container.innerHTML = `
        <div class="price-container">
          <div class="wrapper">
            <span class="amount">$99.99</span>
          </div>
        </div>
      `;
      const element = container.querySelector('.amount');

      const context = getElementContext(element);

      expect(context.priceIndicators.hasParentContainer).toBe(true);
      expect(context.hierarchy.priceContainer).toBe(container.querySelector('.price-container'));
      expect(context.hierarchy.depth).toBe(2);
      expect(context.confidence).toBeGreaterThan(0.7);
    });

    it('should calculate correct depth to price container', () => {
      container.innerHTML = `
        <div class="product-pricing">
          <div class="level1">
            <div class="level2">
              <div class="level3">
                <span class="price-value">$49.99</span>
              </div>
            </div>
          </div>
        </div>
      `;
      const element = container.querySelector('.price-value');

      const context = getElementContext(element);

      expect(context.hierarchy.depth).toBe(4);
      expect(context.hierarchy.priceContainer).toBe(container.querySelector('.product-pricing'));
    });

    it('should handle elements without price container parents', () => {
      container.innerHTML = `
        <div class="regular-container">
          <div class="wrapper">
            <span>$99.99</span>
          </div>
        </div>
      `;
      const element = container.querySelector('span');

      const context = getElementContext(element);

      expect(context.priceIndicators.hasParentContainer).toBe(false);
      expect(context.hierarchy.priceContainer).toBeNull();
      expect(context.hierarchy.depth).toBe(0);
    });

    it('should respect max depth limit', () => {
      // Create deep nesting beyond default max depth
      container.innerHTML = `
        <div class="price-container">
          <div><div><div><div><div><div>
            <span class="deep-price">$99.99</span>
          </div></div></div></div></div></div>
        </div>
      `;
      const element = container.querySelector('.deep-price');

      const context = getElementContext(element, { maxDepth: 3 });

      // Should not find price container due to depth limit
      expect(context.hierarchy.priceContainer).toBeNull();
      expect(context.hierarchy.depth).toBe(0);
    });
  });

  describe('Price-Related Attribute Detection', () => {
    it('should identify data-price attributes', () => {
      container.innerHTML = `
        <span data-price="99.99" data-currency="USD" class="amount">$99.99</span>
      `;
      const element = container.querySelector('.amount');

      const context = getElementContext(element);

      expect(context.priceIndicators.hasDataAttributes).toBe(true);
      expect(context.attributes.dataAttributes).toContain('data-price');
      expect(context.attributes.dataAttributes).toContain('data-currency');
      expect(context.confidence).toBeGreaterThan(0.6);
    });

    it('should recognize price-related classes', () => {
      container.innerHTML = `
        <span class="current-price sale-price highlight">$99.99</span>
      `;
      const element = container.querySelector('span');

      const context = getElementContext(element);

      expect(context.priceIndicators.hasPriceClasses).toBe(true);
      expect(context.attributes.priceRelated).toContain('current-price');
      expect(context.attributes.priceRelated).toContain('sale-price');
      expect(context.confidence).toBeGreaterThan(0.7);
    });

    it('should detect aria-label price indicators', () => {
      container.innerHTML = `
        <span aria-label="Price: $99.99" class="price-display">99.99</span>
      `;
      const element = container.querySelector('.price-display');

      const context = getElementContext(element);

      expect(context.attributes.ariaLabels).toContain('Price: $99.99');
      expect(context.confidence).toBeGreaterThan(0.5);
    });

    it('should identify multiple attribute types', () => {
      container.innerHTML = `
        <div class="price-container">
          <span 
            class="current-price" 
            data-price="99.99" 
            aria-label="Current price $99.99"
          >$99.99</span>
        </div>
      `;
      const element = container.querySelector('span');

      const context = getElementContext(element);

      expect(context.priceIndicators.hasParentContainer).toBe(true);
      expect(context.priceIndicators.hasPriceClasses).toBe(true);
      expect(context.priceIndicators.hasDataAttributes).toBe(true);
      expect(context.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('Sibling Analysis', () => {
    it('should count price-related siblings', () => {
      container.innerHTML = `
        <div class="price-group">
          <span class="currency">$</span>
          <span class="amount">99</span>
          <span class="decimal">.99</span>
          <span class="regular-text">each</span>
        </div>
      `;
      const element = container.querySelector('.amount');

      const context = getElementContext(element);

      expect(context.hierarchy.siblingCount).toBeGreaterThan(0);
    });

    it('should handle elements with no price siblings', () => {
      container.innerHTML = `
        <div class="container">
          <span class="price">$99.99</span>
          <span class="description">Product description</span>
          <span class="category">Electronics</span>
        </div>
      `;
      const element = container.querySelector('.price');

      const context = getElementContext(element);

      expect(context.hierarchy.siblingCount).toBe(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence for strong price context', () => {
      container.innerHTML = `
        <div class="product-card">
          <div class="pricing-section">
            <span 
              class="current-price sale-price" 
              data-price="99.99" 
              data-currency="USD"
              aria-label="Sale price $99.99"
            >$99.99</span>
          </div>
        </div>
      `;
      const element = container.querySelector('span');

      const context = getElementContext(element);

      expect(context.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should assign medium confidence for partial context', () => {
      container.innerHTML = `
        <div class="container">
          <span class="price">$99.99</span>
        </div>
      `;
      const element = container.querySelector('.price');

      const context = getElementContext(element);

      expect(context.confidence).toBeGreaterThan(0.4);
      expect(context.confidence).toBeLessThan(0.8);
    });

    it('should assign low confidence for weak context', () => {
      container.innerHTML = `
        <div class="content">
          <span class="text">$99.99</span>
        </div>
      `;
      const element = container.querySelector('.text');

      const context = getElementContext(element);

      expect(context.confidence).toBeLessThanOrEqual(0.3);
    });
  });

  describe('Semantic Analysis', () => {
    it('should identify product price contexts', () => {
      container.innerHTML = `
        <div class="product-card">
          <div class="product-details">
            <span class="price">$99.99</span>
          </div>
        </div>
      `;
      const element = container.querySelector('.price');

      const context = getElementContext(element);

      expect(context.semantics.containerType).toBe('product');
    });

    it('should detect sale vs original price types', () => {
      container.innerHTML = `
        <div class="pricing">
          <span class="sale-price">$79.99</span>
          <span class="original-price">$99.99</span>
        </div>
      `;
      const saleElement = container.querySelector('.sale-price');
      const originalElement = container.querySelector('.original-price');

      const saleContext = getElementContext(saleElement);
      const originalContext = getElementContext(originalElement);

      expect(saleContext.semantics.priceType).toBe('sale');
      expect(originalContext.semantics.priceType).toBe('original');
    });

    it('should identify cart/checkout contexts', () => {
      container.innerHTML = `
        <div class="cart-item">
          <span class="item-price">$99.99</span>
        </div>
      `;
      const element = container.querySelector('.item-price');

      const context = getElementContext(element);

      expect(context.semantics.containerType).toBe('cart');
    });

    it('should detect currency hints in context', () => {
      container.innerHTML = `
        <div class="pricing-usd">
          <span class="amount">99.99</span>
        </div>
      `;
      const element = container.querySelector('.amount');

      const context = getElementContext(element);

      expect(context.semantics.currencyHint).toContain('USD');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle detached elements', () => {
      const detachedElement = document.createElement('span');
      detachedElement.textContent = '$99.99';

      const context = getElementContext(detachedElement);

      expect(context.element).toBe(detachedElement);
      expect(context.hierarchy.priceContainer).toBeNull();
      expect(context.hierarchy.depth).toBe(0);
    });

    it('should handle elements with circular references safely', () => {
      container.innerHTML = '<div class="price"><span>$99.99</span></div>';
      const element = container.querySelector('span');

      // This should not cause infinite loops
      const context = getElementContext(element);

      expect(context).toBeDefined();
      expect(context.element).toBe(element);
    });

    it('should handle elements in shadow DOM', () => {
      if (container.attachShadow) {
        const shadowRoot = container.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = '<span class="price">$99.99</span>';
        const element = shadowRoot.querySelector('.price');

        const context = getElementContext(element);

        expect(context.element).toBe(element);
        expect(context.hierarchy.priceContainer).toBeNull();
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should complete context analysis quickly', () => {
      container.innerHTML = `
        <div class="product-pricing">
          <div class="level1"><div class="level2"><div class="level3">
            <span class="price" data-price="99.99">$99.99</span>
          </div></div></div>
        </div>
      `;
      const element = container.querySelector('.price');

      const startTime = performance.now();
      const context = getElementContext(element);
      const endTime = performance.now();

      expect(context).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10); // Less than 10ms
    });
  });
});
