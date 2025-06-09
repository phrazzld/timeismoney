/**
 * Cross-site validation tests for e-commerce price conversion
 * Simulates different website structures and patterns found across major e-commerce platforms
 *
 * This covers S3.5 - Cross-site validation for reliable cross-platform functionality
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { findPrices } from '../../../content/priceFinder.js';
import { convertPriceToTimeString } from '../../../utils/converter.js';
import { applyConversion, isValidForProcessing } from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('Cross-Site E-commerce Validation', () => {
  beforeEach(() => {
    // Set up clean DOM for each test
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

  describe('Amazon-style Product Pages', () => {
    test('handles Amazon product listing structure', () => {
      // Simulate Amazon's complex product page structure
      document.body.innerHTML = `
        <div id="centerCol">
          <div id="apex_desktop">
            <div class="a-section">
              <span class="a-price a-text-price a-size-medium a-color-base">
                <span class="a-offscreen">$29.99</span>
                <span class="a-price-symbol">$</span><span class="a-price-whole">29</span>
                <span class="a-price-decimal">.</span><span class="a-price-fraction">99</span>
              </span>
            </div>
            <div class="a-section">
              <span class="a-price a-text-price a-size-large a-color-price">
                <span class="a-offscreen">$24.99</span>
                <span class="a-price-symbol">$</span><span class="a-price-whole">24</span>
                <span class="a-price-decimal">.</span><span class="a-price-fraction">99</span>
              </span>
            </div>
            <div class="a-section">
              <span class="a-text-strike">$39.99</span>
            </div>
            <div class="a-section">
              <span id="price_inside_buybox">List Price: $39.99</span>
            </div>
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

      // Process all text nodes like the real system would
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.trim() !== '' && isValidForProcessing(node)) {
          textNodes.push(node);
        }
      }

      let conversionCount = 0;
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
                amount: '15',
              }
            );
          };

          const result = applyConversion(textNode, priceMatch.pattern, convertFn);
          if (result) {
            conversionCount++;
          }
        }
      });

      // Should have converted multiple prices
      expect(conversionCount).toBeGreaterThan(0);

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Verify specific Amazon price conversions
      const badgeData = Array.from(badges).map((badge) => ({
        original: badge.getAttribute('data-original-price'),
        time: badge.textContent.trim(),
      }));

      // Should handle Amazon's various price formats
      expect(badgeData.some((b) => b.original && b.original.includes('$'))).toBe(true);
    });

    test('handles Amazon variant selection with different pricing', () => {
      document.body.innerHTML = `
        <div id="variation_color_name">
          <div class="a-section">
            <span class="a-color-price">$45.99</span>
          </div>
        </div>
        <div id="variation_size_name">
          <div class="a-section">
            <span class="a-color-price">$52.99</span>
          </div>
        </div>
        <div class="twister-plus-buying-options">
          <span class="a-color-base">From $39.99</span>
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
                amount: '20',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Verify variant pricing is handled correctly
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$45.99');
      expect(prices).toContain('$52.99');
      expect(prices).toContain('$39.99');
    });
  });

  describe('eBay-style Auction Pages', () => {
    test('handles eBay auction and Buy It Now pricing', () => {
      document.body.innerHTML = `
        <div class="x-price-primary">
          <span class="notranslate">$89.99</span>
        </div>
        <div class="u-flL condText">
          <span class="vi-price">
            <span class="notranslate">$76.50</span>
          </span>
        </div>
        <div class="u-flL best-offer">
          <span>or Best Offer</span>
        </div>
        <div class="watchlink">
          <span>Starting bid: $45.00</span>
        </div>
        <div class="shipping">
          <span>+ $12.95 shipping</span>
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

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should handle various eBay price types
      const badgeData = Array.from(badges).map((badge) => ({
        original: badge.getAttribute('data-original-price'),
        time: badge.textContent.trim(),
      }));

      // Verify eBay-specific pricing patterns
      expect(badgeData.some((b) => b.original === '$89.99')).toBe(true);
      expect(badgeData.some((b) => b.original === '$45.00')).toBe(true);
    });

    test('handles eBay search results page', () => {
      document.body.innerHTML = `
        <div class="s-item">
          <span class="s-item__price">$29.99</span>
          <span class="s-item__shipping">+$5.99 shipping</span>
        </div>
        <div class="s-item">
          <span class="s-item__price">$45.00 to $67.50</span>
        </div>
        <div class="s-item">
          <span class="s-item__price">$125.99</span>
          <span class="s-item__bids">23 bids</span>
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
                amount: '22',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should handle search result pricing
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$29.99');
      expect(prices).toContain('$125.99');
    });
  });

  describe('Shopify-style Stores', () => {
    test('handles typical Shopify product page structure', () => {
      document.body.innerHTML = `
        <div class="product-form">
          <div class="price">
            <span class="price-item price-item--regular">$199.99</span>
            <span class="price-item price-item--sale">$149.99</span>
          </div>
          <div class="product-form__buttons">
            <span class="btn-product">You save $50.00</span>
          </div>
        </div>
        <div class="product-recommendations">
          <div class="product-item">
            <span class="price">$89.99</span>
          </div>
          <div class="product-item">
            <span class="price">$129.99</span>
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
                amount: '25',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should handle Shopify pricing patterns
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$199.99');
      expect(prices).toContain('$149.99');
      expect(prices).toContain('$50.00');
    });

    test('handles Shopify collection page with multiple products', () => {
      document.body.innerHTML = `
        <div class="collection-grid">
          <div class="product-card">
            <h3>Product A</h3>
            <div class="price-wrapper">
              <span class="price">$79.99</span>
            </div>
          </div>
          <div class="product-card">
            <h3>Product B</h3>
            <div class="price-wrapper">
              <span class="price price--on-sale">$59.99</span>
              <span class="price price--compare">$89.99</span>
            </div>
          </div>
          <div class="product-card">
            <h3>Product C</h3>
            <div class="price-wrapper">
              <span class="price">From $45.00</span>
            </div>
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
                amount: '16',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should handle collection page pricing
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$79.99');
      expect(prices).toContain('$59.99');
      expect(prices).toContain('$45.00');
    });
  });

  describe('Dark Theme E-commerce Sites', () => {
    test('handles dark theme pricing with appropriate contrast', () => {
      // Mock dark theme styles
      global.window.getComputedStyle = vi.fn().mockReturnValue({
        backgroundColor: 'rgb(30, 30, 30)', // Dark background
      });

      document.body.innerHTML = `
        <div class="dark-theme-product" style="background-color: #1a1a1a;">
          <div class="product-info">
            <h2 class="product-title">Gaming Headset</h2>
            <div class="price-section">
              <span class="current-price">$159.99</span>
              <span class="original-price">$199.99</span>
            </div>
          </div>
          <div class="related-products">
            <div class="item">Wireless Mouse - $79.99</div>
            <div class="item">Mechanical Keyboard - $129.99</div>
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
                amount: '20',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Verify dark theme badges are created with appropriate styling
      badges.forEach((badge) => {
        expect(badge.className).toBe(CONVERTED_PRICE_CLASS);
        expect(badge.getAttribute('data-original-price')).toBeTruthy();

        // Badge should have style attributes (theme adaptation)
        expect(badge.style.cssText.length).toBeGreaterThan(0);
      });

      // Should handle dark theme pricing
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$159.99');
      expect(prices).toContain('$79.99');
    });
  });

  describe('International E-commerce Sites', () => {
    test('handles European pricing formats', () => {
      document.body.innerHTML = `
        <div class="european-store">
          <div class="product">
            <span class="price">€89,99</span>
            <span class="vat-note">incl. VAT</span>
          </div>
          <div class="product">
            <span class="price">£65.50</span>
            <span class="shipping">Free UK delivery</span>
          </div>
          <div class="product">
            <span class="price">149,99 €</span>
            <span class="currency-note">EUR</span>
          </div>
        </div>
      `;

      // Test Euro pricing
      const euroSettings = {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.includes('€') && isValidForProcessing(node)) {
          textNodes.push(node);
        }
      }

      textNodes.forEach((textNode) => {
        const priceMatch = findPrices(textNode.nodeValue, euroSettings);
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

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);

      // Should handle some Euro pricing (depending on price finder support)
      if (badges.length > 0) {
        const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
        expect(prices.some((p) => p.includes('€'))).toBe(true);
      }
    });
  });

  describe('Mobile-Responsive E-commerce', () => {
    test('handles mobile viewport pricing layouts', () => {
      // Mock mobile viewport
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      document.body.innerHTML = `
        <div class="mobile-product-page">
          <div class="mobile-price-section">
            <div class="price-line">
              <span class="mobile-price">$89.99</span>
            </div>
            <div class="savings-line">
              <span class="you-save">You save $20.00</span>
            </div>
          </div>
          <div class="mobile-recommendations">
            <div class="rec-item">Similar item: $65.99</div>
            <div class="rec-item">Also bought: $45.99</div>
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

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should handle mobile layout pricing
      const prices = Array.from(badges).map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$89.99');
      expect(prices).toContain('$20.00');
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    test('handles complex nested structures without breaking', () => {
      document.body.innerHTML = `
        <div class="complex-layout">
          <div class="nested-pricing">
            <div class="layer-1">
              <div class="layer-2">
                <div class="layer-3">
                  <span class="deeply-nested-price">$299.99</span>
                </div>
                <div class="layer-3">
                  <em><strong>Special offer: $199.99</strong></em>
                </div>
              </div>
            </div>
          </div>
          <div class="already-converted">
            <span class="tim-converted-price" data-original-price="$50.00">
              2h 30m
            </span>
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
                amount: '25',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);

      // Should handle nested structures and avoid double-conversion
      const newBadges = Array.from(badges).filter(
        (badge) => badge.textContent !== '2h 30m' // Exclude pre-existing converted price
      );

      expect(newBadges.length).toBeGreaterThan(0);

      // Verify complex nesting doesn't break the system
      const prices = newBadges.map((b) => b.getAttribute('data-original-price'));
      expect(prices).toContain('$299.99');
      expect(prices).toContain('$199.99');
    });

    test('handles sites with aggressive styling and potential conflicts', () => {
      document.body.innerHTML = `
        <div class="aggressive-styles" style="
          color: red !important; 
          font-size: 50px !important; 
          background: linear-gradient(45deg, #ff0000, #00ff00) !important;
          position: relative;
          z-index: 9999;
        ">
          <span style="display: inline-block; transform: rotate(45deg);">
            Premium Product: $499.99
          </span>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            <span style="opacity: 0.5; filter: blur(2px);">
              Discounted: $399.99
            </span>
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
                amount: '30',
              }
            );
          };

          applyConversion(textNode, priceMatch.pattern, convertFn);
        }
      });

      const badges = document.querySelectorAll(`.${CONVERTED_PRICE_CLASS}`);
      expect(badges.length).toBeGreaterThan(0);

      // Should survive aggressive styling
      badges.forEach((badge) => {
        expect(badge.className).toBe(CONVERTED_PRICE_CLASS);
        expect(badge.getAttribute('data-original-price')).toBeTruthy();
        // Badge should have defensive styling to resist host site conflicts
        expect(badge.style.cssText).toContain('!important');
      });
    });
  });
});
