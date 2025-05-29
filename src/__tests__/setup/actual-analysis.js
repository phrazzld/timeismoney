/**
 * Actual analysis of current price detection against real site data
 * This replaces the theoretical analysis with empirical testing
 */

import { findPrices, mightContainPrice } from '../../content/priceFinder.js';
import { loadTestPage } from './price-detection-harness.js';

/**
 * Test current price detection against actual Gearbest formats
 */
export function testRealGearbestFormats() {
  const settings = {
    currencySymbol: '$',
    currencyCode: 'USD',
    thousands: 'commas',
    decimal: 'dot',
  };

  // Real formats from gearbest.ma
  const testCases = [
    {
      name: 'Simple price with $ after',
      text: '25.99$',
      expected: true,
    },
    {
      name: 'Price range with en dash',
      text: '6.00$ – 6.11$',
      expected: true,
    },
    {
      name: 'Price range with standard dash',
      text: '14.76$ - 15.36$',
      expected: true,
    },
    {
      name: 'Complex price text',
      text: '35.26$ Original price was: 35.26$. 30.20$ Current price is: 30.20$.',
      expected: true,
    },
  ];

  const results = testCases.map((testCase) => {
    // Test heuristic detection first
    const heuristicResult = mightContainPrice(testCase.text);

    // Test full price finding
    const findResult = findPrices(testCase.text, settings);

    // Test pattern matching if we got a pattern
    let patternMatches = null;
    if (findResult && findResult.pattern) {
      const matches = testCase.text.match(findResult.pattern);
      patternMatches = matches ? matches.length : 0;
    }

    return {
      ...testCase,
      heuristicDetected: heuristicResult,
      priceFinderResult: !!findResult,
      patternExists: !!(findResult && findResult.pattern),
      patternMatches,
      actualMatches:
        findResult && findResult.pattern ? testCase.text.match(findResult.pattern) : null,
    };
  });

  return results;
}

/**
 * Load and test the actual test pages
 */
export function testActualTestPages() {
  const results = {};

  try {
    // Test Gearbest page
    const gearbestDoc = loadTestPage('gearbest-test.html');
    const gearbestPrices = gearbestDoc.querySelectorAll('.price_count');

    results.gearbest = Array.from(gearbestPrices).map((element) => {
      const text = element.textContent.trim();
      return {
        html: element.outerHTML,
        text,
        heuristicResult: mightContainPrice(text),
        findPricesResult: findPrices(text, {
          currencySymbol: '$',
          currencyCode: 'USD',
          thousands: 'commas',
          decimal: 'dot',
        }),
      };
    });
  } catch (error) {
    results.gearbest = { error: error.message };
  }

  try {
    // Test Cdiscount page
    const cdiscountDoc = loadTestPage('cdiscount-test.html');
    const cdiscountPrices = cdiscountDoc.querySelectorAll('.price, .fpPrice');

    results.cdiscount = Array.from(cdiscountPrices).map((element) => {
      const text = element.textContent.trim();
      return {
        html: element.outerHTML,
        text,
        heuristicResult: mightContainPrice(text),
        findPricesResult: findPrices(text, {
          currencySymbol: '€',
          currencyCode: 'EUR',
          thousands: 'spacesAndDots',
          decimal: 'comma',
        }),
      };
    });
  } catch (error) {
    results.cdiscount = { error: error.message };
  }

  try {
    // Test AliExpress page
    const aliexpressDoc = loadTestPage('aliexpress-test.html');
    const aliexpressPrices = aliexpressDoc.querySelectorAll(
      '.product-price-value, .uniform-banner-box-price, .price-now'
    );

    results.aliexpress = Array.from(aliexpressPrices).map((element) => {
      const text = element.textContent.trim();
      return {
        html: element.outerHTML,
        text,
        heuristicResult: mightContainPrice(text),
        findPricesResult: findPrices(text, {
          currencySymbol: '$',
          currencyCode: 'USD',
          thousands: 'commas',
          decimal: 'dot',
        }),
      };
    });
  } catch (error) {
    results.aliexpress = { error: error.message };
  }

  return results;
}

/**
 * Run comprehensive actual analysis
 */
export function runActualAnalysis() {
  const results = {
    timestamp: new Date().toISOString(),
    gearbestFormatTests: testRealGearbestFormats(),
    testPageAnalysis: testActualTestPages(),
  };

  // Summary analysis
  const summary = {
    gearbestSuccess: results.gearbestFormatTests.filter(
      (r) => r.heuristicDetected && r.priceFinderResult
    ).length,
    gearbestTotal: results.gearbestFormatTests.length,
    gearbestFailures: results.gearbestFormatTests.filter(
      (r) => !r.heuristicDetected || !r.priceFinderResult
    ),
  };

  if (results.testPageAnalysis.gearbest && Array.isArray(results.testPageAnalysis.gearbest)) {
    summary.gearbestPageSuccess = results.testPageAnalysis.gearbest.filter(
      (r) => r.heuristicResult && r.findPricesResult
    ).length;
    summary.gearbestPageTotal = results.testPageAnalysis.gearbest.length;
  }

  if (results.testPageAnalysis.cdiscount && Array.isArray(results.testPageAnalysis.cdiscount)) {
    summary.cdiscountPageSuccess = results.testPageAnalysis.cdiscount.filter(
      (r) => r.heuristicResult && r.findPricesResult
    ).length;
    summary.cdiscountPageTotal = results.testPageAnalysis.cdiscount.length;
  }

  if (results.testPageAnalysis.aliexpress && Array.isArray(results.testPageAnalysis.aliexpress)) {
    summary.aliexpressPageSuccess = results.testPageAnalysis.aliexpress.filter(
      (r) => r.heuristicResult && r.findPricesResult
    ).length;
    summary.aliexpressPageTotal = results.testPageAnalysis.aliexpress.length;
  }

  results.summary = summary;
  return results;
}
