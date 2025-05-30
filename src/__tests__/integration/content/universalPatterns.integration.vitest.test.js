import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  resetTestMocks,
} from '../../setup/vitest-imports.js';
import { walk } from '../../../content/domScanner.js';
import { getSettings } from '../../../utils/storage.js';

// Mock the storage module
vi.mock('../../../utils/storage.js', () => ({
  getSettings: vi.fn(),
}));

describe('Universal Pattern Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetTestMocks();

    // Default settings
    getSettings.mockResolvedValue({
      currencyCode: 'USD',
      currencySymbol: '$',
      isEnabled: true,
      hourlyRate: 50,
    });
  });

  describe('Cdiscount-style patterns work universally', () => {
    it('should detect split price format on any website', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="random-website">
          <h1>Welcome to RandomShop.com</h1>
          <div class="product-price">449€ 00</div>
        </div>
      `;

      const processedPrices = [];
      walk(
        container,
        (textNode, settings) => {
          if (textNode.nodeValue && textNode.nodeValue.includes('449€ 00')) {
            processedPrices.push(textNode.nodeValue);
          }
        },
        { currencyCode: 'EUR' }
      );

      // Use setTimeout to allow async processing
      setTimeout(() => {
        expect(processedPrices.length).toBeGreaterThan(0);
        done();
      }, 10);
    });

    it('should detect superscript price format universally', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="generic-site">
          <div class="price-display">
            <span>129</span>
            <span>€</span>
            <span>95</span>
          </div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        processedPrices.push(textNode.nodeValue);
      });

      walk(container, callback, { currencyCode: 'EUR' });

      setTimeout(() => {
        // Should have processed the price
        expect(callback).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Gearbest-style patterns work universally', () => {
    it('should detect nested currency spans on any website', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="another-random-site">
          <div class="item-price">
            <span class="currency">US$</span>
            <span class="value">34.56</span>
          </div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        processedPrices.push(textNode.nodeValue);
      });

      walk(container, callback, { currencyCode: 'USD' });

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should detect adjacent currency elements universally', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="shop-xyz">
          <p class="cost">
            <i>US$</i><b>89.99</b>
          </p>
        </div>
      `;

      const callback = vi.fn();
      walk(container, callback, { currencyCode: 'USD' });

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Amazon-style patterns work universally', () => {
    it('should detect contextual prices anywhere', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="deals-site">
          <div class="offer">Starting from $9.99</div>
          <div class="deal">Under $20</div>
          <div class="promo">Save up to $50</div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        if (textNode.nodeValue && textNode.nodeValue.match(/\$\d+/)) {
          processedPrices.push(textNode.nodeValue);
        }
      });

      walk(container, callback, { currencyCode: 'USD' });

      setTimeout(() => {
        expect(callback.mock.calls.length).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('Currency filtering works correctly', () => {
    it('should only process prices in user currency', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="multi-currency-shop">
          <div class="price-usd">$25.99</div>
          <div class="price-eur">€30.00</div>
          <div class="price-gbp">£20.00</div>
        </div>
      `;

      const processedCurrencies = [];
      const callback = vi.fn((textNode) => {
        const match = textNode.nodeValue.match(/[$€£]\d+/);
        if (match) {
          processedCurrencies.push(match[0]);
        }
      });

      // User has USD selected
      walk(container, callback, { currencyCode: 'USD', currencySymbol: '$' });

      setTimeout(() => {
        // Should only process USD prices
        const usdPrices = processedCurrencies.filter((p) => p.startsWith('$'));
        const otherPrices = processedCurrencies.filter((p) => !p.startsWith('$'));

        expect(usdPrices.length).toBeGreaterThan(0);
        expect(otherPrices.length).toBe(0);
        done();
      }, 10);
    });
  });

  describe('Complex e-commerce patterns', () => {
    it('should handle mixed price formats on a single page', (done) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="complex-shop">
          <!-- Standard format -->
          <div class="item1">Price: $49.99</div>
          
          <!-- Split format -->
          <div class="item2">299€ 00</div>
          
          <!-- Nested format -->
          <div class="item3">
            <span>US$</span>
            <span>15.50</span>
          </div>
          
          <!-- Contextual format -->
          <div class="item4">Starting from $5.99</div>
          
          <!-- Space variations -->
          <div class="item5">€ 14,32</div>
          
          <!-- Data attribute -->
          <div class="item6" data-price="$89.99">Buy Now</div>
        </div>
      `;

      const callback = vi.fn();
      walk(container, callback, { currencyCode: 'USD', currencySymbol: '$' });

      setTimeout(() => {
        // Should process multiple price formats
        expect(callback.mock.calls.length).toBeGreaterThan(3);
        done();
      }, 10);
    });
  });

  describe('No domain-specific logic', () => {
    it('should work without checking window.location', (done) => {
      // This test verifies we're not using domain-specific logic
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="price">449€ 00</div>
      `;

      const callback = vi.fn();

      // Mock window.location to a completely different domain
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: 'totally-not-cdiscount.com' };

      walk(container, callback, { currencyCode: 'EUR' });

      setTimeout(() => {
        // Should still detect the price pattern
        expect(callback).toHaveBeenCalled();

        // Restore window.location
        window.location = originalLocation;
        done();
      }, 10);
    });
  });
});
