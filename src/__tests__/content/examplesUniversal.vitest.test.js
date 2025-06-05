import { describe, it, expect } from '../setup/vitest-imports.js';
import { extractPrices } from '../../content/universalPriceExtractor.js';

describe('Examples.md patterns work universally', () => {
  describe('Cdiscount patterns', () => {
    it('should extract "272.46 €" format anywhere', () => {
      const element = document.createElement('div');
      element.innerHTML = '<font style="vertical-align: inherit;">272.46 €</font>';

      const prices = extractPrices(element, { currencyCode: 'EUR' });

      expect(prices.some((p) => p.text.includes('272.46') && p.text.includes('€'))).toBe(true);
    });

    it('should extract "596.62€" format anywhere', () => {
      const element = document.createElement('div');
      element.innerHTML = '<font style="vertical-align: inherit;">596.62€</font>';

      const prices = extractPrices(element, { currencyCode: 'EUR' });

      expect(prices.some((p) => p.text.includes('596.62') && p.text.includes('€'))).toBe(true);
    });

    it('should extract "449€ 00" split format anywhere', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <span class="c-price c-price--promo c-price--md">
          <font style="vertical-align: inherit;">
            <font style="vertical-align: inherit;">449€ </font>
          </font>
          <span itemprop="priceCurrency">
            <font style="vertical-align: inherit;">
              <font style="vertical-align: inherit;">00</font>
            </font>
          </span>
        </span>
      `;

      const prices = extractPrices(element, { currencyCode: 'EUR' });

      expect(prices.some((p) => p.text === '449€00')).toBe(true);
    });
  });

  describe('eBay patterns', () => {
    it('should extract standard price format', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span class="textual-display bsig__price bsig__price--displayprice">$350.00</span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$350.00')).toBe(true);
    });

    it('should extract strikethrough price', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span class="textual-display bsig__generic bsig__previousPrice strikethrough">$144.54<span class="textual-display clipped">was - US $144.54</span></span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$144.54')).toBe(true);
    });

    it('should extract ux-textspans price', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span class="ux-textspans">$122.49</span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$122.49')).toBe(true);
    });
  });

  describe('Amazon patterns', () => {
    it('should extract "Under $20" contextual price', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span class="a-size-small a-color-base truncate-2line">Under $20</span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$20')).toBe(true);
    });

    it('should extract "from $2.99" contextual price', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<h2 class="a-color-base headline truncate-2line">Crazy-good finds from $2.99</h2>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$2.99')).toBe(true);
    });

    it('should extract aria-label price', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span aria-label="$8.48" class="a-size-base a-color-price a-color-price"> $8.48 </span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$8.48')).toBe(true);
    });

    it('should extract split price components', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <span aria-hidden="true">
          <span class="a-price-symbol">$</span>
          <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
          <span class="a-price-fraction">48</span>
        </span>
      `;

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text.includes('8') && p.text.includes('48'))).toBe(true);
    });

    it('should extract data-attribute price', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span class="a-price a-text-price" data-a-size="s" data-a-strike="true" data-a-color="secondary"><span class="a-offscreen">$18.99</span><span aria-hidden="true">$18.99</span></span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$18.99')).toBe(true);
    });
  });

  describe('Gearbest patterns', () => {
    it('should extract WooCommerce format with currency after number', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span class="woocommerce-Price-amount amount"><bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi></span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text.includes('6.26') && p.text.includes('$'))).toBe(true);
    });
  });

  describe('Zillow patterns', () => {
    it('should extract data-test property price', () => {
      const element = document.createElement('div');
      element.innerHTML =
        '<span data-test="property-card-price" class="PropertyCardWrapper__StyledPriceLine-srp-8-109-3__sc-16e8gqd-1 jCoXOF">$2,500,000</span>';

      const prices = extractPrices(element, { currencyCode: 'USD' });

      expect(prices.some((p) => p.text === '$2,500,000')).toBe(true);
    });
  });

  describe('All patterns work without domain checks', () => {
    it('should extract all example prices in a single mixed HTML', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="mixed-prices">
          <!-- Cdiscount style -->
          <div>272.46 €</div>
          <div>449€ 00</div>
          
          <!-- eBay style -->
          <span>$350.00</span>
          
          <!-- Amazon style -->
          <span>Under $20</span>
          <span>from $2.99</span>
          <span aria-label="$8.48">$8.48</span>
          
          <!-- Gearbest style -->
          <span>6.26<span>$</span></span>
          
          <!-- Zillow style -->
          <span>$2,500,000</span>
        </div>
      `;

      const prices = extractPrices(element);

      // Should extract multiple different price patterns
      expect(prices.length).toBeGreaterThan(5);

      // Check specific patterns
      expect(prices.some((p) => p.text.includes('272.46'))).toBe(true);
      expect(prices.some((p) => p.text.includes('449') && p.text.includes('00'))).toBe(true);
      expect(prices.some((p) => p.text === '$350.00')).toBe(true);
      expect(prices.some((p) => p.text === '$20')).toBe(true);
      expect(prices.some((p) => p.text === '$2.99')).toBe(true);
    });
  });
});
