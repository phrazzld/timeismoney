/**
 * Integration tests for unified price extraction pipeline
 * Tests with real HTML examples from examples.md
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '../../setup/vitest-imports.js';
import { extractPrice } from '../../../content/priceExtractor.js';
import { registerExistingHandlers } from '../../../content/siteHandlers.js';

describe('priceExtractor integration', () => {
  beforeEach(() => {
    // Register handlers for Amazon, eBay, etc.
    registerExistingHandlers();
  });

  describe('real-world examples', () => {
    it('should extract Cdiscount split euro format', async () => {
      const div = document.createElement('div');
      div.innerHTML = `
        <p class="price">
          <span class="price-sup">449</span>
          <span class="price-currency">&euro;</span>
          <span class="price-sub">00</span>
        </p>
      `;

      const result = await extractPrice(div);

      expect(result).toBeTruthy();
      expect(result.value).toBe('449.00');
      expect(result.currency).toBe('€');
    });

    it('should extract Amazon aria-label price', async () => {
      const span = document.createElement('span');
      span.setAttribute('aria-label', '$12.99');
      span.className = 'a-price';
      span.innerHTML = `
        <span class="a-offscreen">$12.99</span>
        <span aria-hidden="true">
          <span class="a-price-symbol">$</span>
          <span class="a-price-whole">12<span class="a-price-decimal">.</span></span>
          <span class="a-price-fraction">99</span>
        </span>
      `;

      const result = await extractPrice(span);

      expect(result).toBeTruthy();
      expect(result.value).toBe('12.99');
      expect(result.currency).toBe('$');
      expect(result.metadata.source).toBe('aria-label');
    });

    it('should extract WooCommerce nested currency format', async () => {
      const span = document.createElement('span');
      span.className = 'woocommerce-Price-amount amount';
      span.innerHTML = `<bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>`;

      const result = await extractPrice(span);

      expect(result).toBeTruthy();
      expect(result.value).toBe('6.26');
      expect(result.currency).toBe('$');
    });

    it('should extract contextual prices', async () => {
      const div = document.createElement('div');
      div.textContent = 'Prices start from €29.99';

      const result = await extractPrice(div);

      expect(result).toBeTruthy();
      expect(result.value).toBe('29.99');
      expect(result.currency).toBe('€');
      expect(result.metadata.pattern).toContain('from');
    });

    it('should handle comma thousand separators', async () => {
      const span = document.createElement('span');
      span.textContent = '$2,500,000';

      const result = await extractPrice(span);

      expect(result).toBeTruthy();
      expect(result.value).toBe('2500000');
      expect(result.currency).toBe('$');
    });

    it('should return multiple prices when requested', async () => {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="prices">
          <span class="old-price">$49.99</span>
          <span class="new-price" aria-label="$29.99">
            <span class="currency">$</span>
            <span class="amount">29.99</span>
          </span>
        </div>
      `;

      const results = await extractPrice(div.querySelector('.prices'), { returnMultiple: true });

      expect(results.length).toBeGreaterThanOrEqual(1);

      // Check if we found at least one of the prices
      const values = results.map((r) => r.value);
      expect(values).toContain('29.99'); // Should at least find the aria-label price
    });

    it('should prioritize higher confidence results', async () => {
      const div = document.createElement('div');
      div.setAttribute('data-price', '99.99');
      div.setAttribute('data-currency', '$');
      div.textContent = 'Price: $99.99';

      const result = await extractPrice(div);

      expect(result).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should extract prices with space variations', async () => {
      const testCases = [
        { html: '<span>272.46 €</span>', value: '272.46', currency: '€' },
        { html: '<span>€ 14,32</span>', value: '14.32', currency: '€' },
        { html: '<span>596.62€</span>', value: '596.62', currency: '€' },
      ];

      for (const testCase of testCases) {
        const div = document.createElement('div');
        div.innerHTML = testCase.html;

        const result = await extractPrice(div);

        expect(result).toBeTruthy();
        expect(result.value).toBe(testCase.value);
        expect(result.currency).toBe(testCase.currency);
      }
    });

    it('should handle text-only input', async () => {
      const result = await extractPrice({ text: 'Special offer: $19.99!' });

      expect(result).toBeTruthy();
      expect(result.value).toBe('19.99');
      expect(result.currency).toBe('$');
      expect(result.strategy).toBe('pattern-matching');
    });

    it('should respect minimum confidence threshold', async () => {
      const div = document.createElement('div');
      div.textContent = 'Maybe $10 or something';

      const result = await extractPrice(div, { minConfidence: 0.9 });

      // Low confidence contextual price should be filtered out
      expect(result).toBeNull();
    });
  });

  describe('performance', () => {
    it('should extract prices within reasonable time', async () => {
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="product-grid">
          ${Array(10)
            .fill()
            .map(
              (_, i) => `
            <div class="product">
              <span class="price" aria-label="$${i * 10 + 9.99}">
                <span class="currency">$</span>
                <span class="amount">${i * 10 + 9}.99</span>
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      `;

      const start = Date.now();
      const result = await extractPrice(div);
      const duration = Date.now() - start;

      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
