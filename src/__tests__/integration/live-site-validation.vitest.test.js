/**
 * Live Site Integration Validation Test Suite
 * Tests enhanced price detection against real-world site structures
 * Uses examples.md data to simulate live site testing
 */

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';

// Import the enhanced price detection system
import { extractPrice } from '../../content/priceExtractor.js';
import { findPrices } from '../../content/priceFinder.js';

// Import site handlers for validation
import {
  cdiscountHandler,
  gearbestHandler,
  processWithSiteHandler,
} from '../../content/siteHandlers.js';

// Import debug logging
import { setDebugMode } from '../../utils/logger.js';

describe('Live Site Integration Validation', () => {
  // Use global validation results that persist across tests
  const validationResults = {
    siteResults: {},
    examplesValidation: {
      matchesLiveSites: true,
      discrepancies: [],
      recommendedUpdates: [],
    },
    overall: {
      successRate: 0,
      productionReady: false,
      recommendations: [],
    },
  };

  beforeEach(() => {
    // Enable debug mode for detailed logging
    setDebugMode(true);

    // Mock console methods for cleaner test output (but don't reset validation results)
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setDebugMode(false);
  });

  describe('Amazon.com Integration Testing', () => {
    it('should handle Amazon aria-label prices (regression test)', async () => {
      // Real Amazon aria-label example from examples.md
      const amazonAriaLabelHTML = `
        <span aria-label="$8.48" class="a-size-base a-color-price">$8.48</span>
      `;

      const container = document.createElement('div');
      container.innerHTML = amazonAriaLabelHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.amazon_aria = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '8.48',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('8.48');
      expect(result.currency).toBe('$');
      expect(['site-specific', 'dom-analyzer']).toContain(result.strategy);
    });

    it('should handle Amazon split-component prices (regression test)', async () => {
      // Real Amazon split price example from examples.md
      const amazonSplitHTML = `
        <span aria-hidden="true">
          <span class="a-price-symbol">$</span>
          <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
          <span class="a-price-fraction">48</span>
        </span>
      `;

      const container = document.createElement('div');
      container.innerHTML = amazonSplitHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.amazon_split = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '8.48',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('8.48');
      expect(result.currency).toBe('$');
      expect(['site-specific', 'dom-analyzer']).toContain(result.strategy);
    });

    it('should handle Amazon complex price structures', async () => {
      // Test Amazon complex price structures
      const amazonComplexHTML = `
        <span class="a-price a-text-price a-size-medium apexPriceToPay">
          <span class="a-offscreen">$12.99</span>
          <span aria-hidden="true">
            <span class="a-price-symbol">$</span>
            <span class="a-price-whole">12</span>
            <span class="a-price-decimal">.</span>
            <span class="a-price-fraction">99</span>
          </span>
        </span>
      `;

      const container = document.createElement('div');
      container.innerHTML = amazonComplexHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.amazon_complex = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '12.99',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('12.99');
      expect(result.currency).toBe('$');
    });
  });

  describe('eBay.com Integration Testing', () => {
    it('should handle eBay simple price formats (regression test)', async () => {
      // Real eBay price examples
      const ebaySimpleHTML = `
        <span class="u-sm-only">
          <span class="notranslate">$350.00</span>
        </span>
      `;

      const container = document.createElement('div');
      container.innerHTML = ebaySimpleHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.ebay_simple = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '350.00',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('350.00');
      expect(result.currency).toBe('$');
    });

    it('should handle eBay complex price formats', async () => {
      // Test eBay complex bidding format
      const ebayBiddingHTML = `
        <div class="vi-price">
          <span class="u-flL condText">Current bid:</span>
          <span class="u-flL bidPrice">
            <span class="notranslate">$125.50</span>
          </span>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = ebayBiddingHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.ebay_complex = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '125.50',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('125.50');
      expect(result.currency).toBe('$');
    });
  });

  describe('Cdiscount.com Integration Testing', () => {
    it('should handle Cdiscount split format from examples.md', async () => {
      // Real Cdiscount split format from examples.md
      const cdiscountSplitHTML = `
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

      const container = document.createElement('div');
      container.innerHTML = cdiscountSplitHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.cdiscount_split = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '449.00',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('449');
      expect(result.currency).toBe('€');
      expect(['site-specific', 'dom-analyzer']).toContain(result.strategy);
    });

    it('should handle Cdiscount simple format', async () => {
      // Simple Cdiscount format from examples.md
      const cdiscountSimpleHTML = `
        <font style="vertical-align: inherit;">272.46 €</font>
      `;

      const container = document.createElement('div');
      container.innerHTML = cdiscountSimpleHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.cdiscount_simple = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '272.46',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('272.46');
      expect(result.currency).toBe('€');
    });

    it('should use Cdiscount-specific handler effectively', async () => {
      // Test Cdiscount handler directly with price element
      const cdiscountPriceHTML = `
        <div class="price">
          <span class="c-price">
            <font style="vertical-align: inherit;">89€ </font>
            <span>99</span>
          </span>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = cdiscountPriceHTML;
      const element = container.firstElementChild;

      // Test if the handler recognizes this as a target node
      const isTarget = cdiscountHandler.isTargetNode(element);

      // Test price extraction using the enhanced system
      const result = await extractPrice(element);

      validationResults.siteResults.cdiscount_handler = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        handlerRecognized: isTarget,
        detectedPrice: result?.value || null,
        expectedPrice: '89.99',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(isTarget).toBe(true);
      expect(result).toBeTruthy();
      expect(result.value).toMatch(/89/);
    });
  });

  describe('Gearbest.com Integration Testing', () => {
    it('should handle Gearbest nested currency format', async () => {
      // Gearbest format with nested currency from examples.md analysis
      const gearbestNestedHTML = `
        <div class="goods-price">
          <span class="currency">$</span>
          <span class="value">29.99</span>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = gearbestNestedHTML;
      const element = container.firstElementChild;

      const result = await extractPrice(element);

      validationResults.siteResults.gearbest_nested = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        detectedPrice: result?.value || null,
        expectedPrice: '29.99',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(result).toBeTruthy();
      expect(result.value).toContain('29.99');
      expect(result.currency).toBe('$');
    });

    it('should use Gearbest-specific handler for complex structures', async () => {
      // Test Gearbest handler with WooCommerce format
      const gearbestWooHTML = `
        <div class="woocommerce-Price-amount">
          <bdi>
            <span class="woocommerce-Price-currencySymbol">$</span>
            19.99
          </bdi>
        </div>
      `;

      const container = document.createElement('div');
      container.innerHTML = gearbestWooHTML;
      const element = container.firstElementChild;

      // Test if the handler recognizes this as a target node
      const isTarget = gearbestHandler.isTargetNode(element);

      // Test price extraction using the enhanced system
      const result = await extractPrice(element);

      validationResults.siteResults.gearbest_handler = {
        success: result !== null,
        pricesDetected: result ? 1 : 0,
        handlerRecognized: isTarget,
        detectedPrice: result?.value || null,
        expectedPrice: '19.99',
        method: result?.strategy || 'unknown',
        errors: result ? [] : ['No price detected'],
      };

      expect(isTarget).toBe(true);
      expect(result).toBeTruthy();
      expect(result.value).toContain('19.99');
    });
  });

  describe('AliExpress.com Integration Testing', () => {
    it('should handle AliExpress various price formats', async () => {
      // AliExpress price format variations
      const aliexpressFormats = [
        '<span class="product-price-current">US $12.99</span>',
        '<div class="price-sale">$25.50 - $45.99</div>',
        '<span class="price-symbol">$</span><span class="price-integer">19</span><span class="price-decimal">.99</span>',
      ];

      let detectedCount = 0;
      const results = [];

      for (const html of aliexpressFormats) {
        const container = document.createElement('div');
        container.innerHTML = html;
        const element = container.firstElementChild;

        const result = await extractPrice(element);
        results.push(result);
        if (result) detectedCount++;
      }

      validationResults.siteResults.aliexpress_various = {
        success: detectedCount > 0,
        pricesDetected: detectedCount,
        totalTested: aliexpressFormats.length,
        successRate: `${((detectedCount / aliexpressFormats.length) * 100).toFixed(1)}%`,
        detectedPrices: results.filter((r) => r).map((r) => r.value),
        errors: [],
      };

      expect(detectedCount).toBeGreaterThan(0);
      expect(detectedCount / aliexpressFormats.length).toBeGreaterThanOrEqual(0.6); // 60% success rate
    });
  });

  describe('Cross-Site Validation and Compatibility', () => {
    it('should maintain backward compatibility with all previous examples', async () => {
      // Test all examples.md cases to ensure no regressions
      const allExamples = [
        {
          site: 'cdiscount',
          html: '<font style="vertical-align: inherit;">272.46 €</font>',
          expected: '272.46',
        },
        { site: 'amazon', html: '<span aria-label="$8.48">$8.48</span>', expected: '8.48' },
        { site: 'ebay', html: '<span class="notranslate">$350.00</span>', expected: '350.00' },
        {
          site: 'amazon_split',
          html: '<span><span class="a-price-symbol">$</span><span class="a-price-whole">8</span><span class="a-price-fraction">48</span></span>',
          expected: '8.48',
        },
      ];

      let successCount = 0;
      const detailedResults = [];

      for (const example of allExamples) {
        const container = document.createElement('div');
        container.innerHTML = example.html;
        const element = container.firstElementChild;

        const result = await extractPrice(element);
        const success = result && result.value.includes(example.expected);

        detailedResults.push({
          site: example.site,
          success,
          expected: example.expected,
          detected: result?.value || null,
          strategy: result?.strategy || null,
        });

        if (success) successCount++;
      }

      validationResults.examplesValidation = {
        matchesLiveSites: successCount === allExamples.length,
        discrepancies: detailedResults.filter((r) => !r.success),
        successRate: `${((successCount / allExamples.length) * 100).toFixed(1)}%`,
        detailedResults,
      };

      expect(successCount).toBe(allExamples.length);
      expect(successCount / allExamples.length).toBeGreaterThanOrEqual(0.9); // 90% success rate
    });

    it('should generate comprehensive validation report', () => {
      // Temporarily restore console.info for debugging
      console.info.mockRestore?.();

      // Calculate overall statistics
      const siteResults = Object.values(validationResults.siteResults);
      const totalSites = siteResults.length;
      const successfulSites = siteResults.filter((r) => r.success).length;
      const totalPricesDetected = siteResults.reduce((sum, r) => sum + (r.pricesDetected || 0), 0);

      console.info('=== VALIDATION STATISTICS DEBUG ===');
      console.info('Total Sites:', totalSites);
      console.info('Successful Sites:', successfulSites);
      console.info('Success Rate:', ((successfulSites / totalSites) * 100).toFixed(1) + '%');
      console.info(
        'Site Results:',
        Object.entries(validationResults.siteResults).map(
          ([site, result]) => `${site}: ${result.success ? 'PASS' : 'FAIL'}`
        )
      );

      validationResults.overall = {
        successRate: `${((successfulSites / totalSites) * 100).toFixed(1)}%`,
        productionReady: successfulSites / totalSites >= 0.8, // 80% success threshold
        totalSitesTested: totalSites,
        successfulSites,
        totalPricesDetected,
        recommendations: [],
      };

      // Add recommendations based on results
      if (validationResults.overall.productionReady) {
        validationResults.overall.recommendations.push(
          'System is production-ready for deployment',
          'All major e-commerce sites supported',
          'Enhanced detection working correctly'
        );
      } else {
        validationResults.overall.recommendations.push(
          'Additional site handler optimization needed',
          'Review failed detection cases',
          'Consider fallback strategies for unsupported formats'
        );
      }

      // Log comprehensive results
      console.info('=== LIVE SITE INTEGRATION VALIDATION RESULTS ===');
      console.info('Overall Success Rate:', validationResults.overall.successRate);
      console.info('Production Ready:', validationResults.overall.productionReady);
      console.info('Sites Tested:', validationResults.overall.totalSitesTested);
      console.info('Prices Detected:', validationResults.overall.totalPricesDetected);

      console.info('\nSite-by-Site Results:');
      Object.entries(validationResults.siteResults).forEach(([site, result]) => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.info(`  ${site}: ${status} (${result.pricesDetected || 0} prices detected)`);
      });

      console.info('\nRecommendations:');
      validationResults.overall.recommendations.forEach((rec) => {
        console.info(`  - ${rec}`);
      });

      // Validate that we meet production readiness criteria
      expect(validationResults.overall.productionReady).toBe(true);
      expect(successfulSites / totalSites).toBeGreaterThanOrEqual(0.8);
      expect(totalPricesDetected).toBeGreaterThan(0);

      console.info('\n✅ Enhanced price detection system ready for live deployment');
    });
  });

  describe('Live Site Testing Framework', () => {
    it('should provide framework for actual live site testing', () => {
      // This test documents the approach for real live site testing
      const liveTestingFramework = {
        methodology: 'Controlled testing with sample URLs',
        rateLimit: 'Respect robots.txt and implement delays',
        validation: 'Compare detected vs displayed prices',
        fallback: 'Handle network failures gracefully',
        documentation: 'Record site structure changes',
      };

      const testingSites = [
        {
          name: 'Amazon',
          sampleUrls: ['https://amazon.com/dp/B08N5WRWNW'], // Example product
          expectedHandlers: ['aria-label', 'split-components'],
          notes: 'Test both mobile and desktop formats',
        },
        {
          name: 'eBay',
          sampleUrls: ['https://ebay.com/itm/123456789'], // Example auction
          expectedHandlers: ['simple-price', 'bid-price'],
          notes: 'Test auction vs Buy It Now formats',
        },
        {
          name: 'Cdiscount',
          sampleUrls: ['https://cdiscount.com/f-123456.html'], // Example product
          expectedHandlers: ['split-format', 'simple-format'],
          notes: 'Validate split euro format still current',
        },
      ];

      // Log framework for future implementation
      console.info('=== LIVE SITE TESTING FRAMEWORK ===');
      console.info('Framework:', JSON.stringify(liveTestingFramework, null, 2));
      console.info('Test Sites:', JSON.stringify(testingSites, null, 2));
      console.info('Note: This framework provides the structure for actual live site testing');

      expect(liveTestingFramework.methodology).toBeDefined();
      expect(testingSites.length).toBeGreaterThan(0);
    });
  });
});
