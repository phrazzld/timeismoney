/**
 * Test harness for price detection functionality.
 * Provides utilities for testing price detection across different scenarios
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load and parse an HTML test page
 *
 * @param {string} filename - Name of the test HTML file
 * @returns {Document} DOM document
 */
export function loadTestPage(filename) {
  const html = readFileSync(join(__dirname, '../test-pages', filename), 'utf-8');
  const dom = new JSDOM(html);
  return dom.window.document;
}

/**
 * Extract all text nodes from an element
 *
 * @param {Element} element - DOM element
 * @returns {string[]} Array of text content from all text nodes
 */
export function extractTextNodes(element) {
  const texts = [];
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.textContent.trim();
      return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    texts.push(node.textContent.trim());
  }
  return texts;
}

/**
 * Create a mock settings object for testing
 *
 * @param {object} overrides - Settings to override defaults
 * @returns {object} Settings object
 */
export function createMockSettings(overrides = {}) {
  return {
    hourlyRate: 50,
    currency: 'USD',
    enableDebug: false,
    ...overrides,
  };
}

/**
 * Verify price detection results
 *
 * @param {object} result - Price detection result
 * @param {object} expected - Expected values
 * @returns {object} Verification result with passed status and details
 */
export function verifyPriceDetection(result, expected) {
  const verification = {
    passed: true,
    details: {},
  };

  if (expected.hasPotentialPrice !== undefined) {
    verification.details.hasPotentialPrice = {
      expected: expected.hasPotentialPrice,
      actual: result.hasPotentialPrice,
      passed: result.hasPotentialPrice === expected.hasPotentialPrice,
    };
    if (!verification.details.hasPotentialPrice.passed) {
      verification.passed = false;
    }
  }

  if (expected.priceValue !== undefined && result.priceMatch) {
    const actualValue = parseFloat(result.priceMatch.value);
    verification.details.priceValue = {
      expected: expected.priceValue,
      actual: actualValue,
      passed: Math.abs(actualValue - expected.priceValue) < 0.01,
    };
    if (!verification.details.priceValue.passed) {
      verification.passed = false;
    }
  }

  if (expected.currency !== undefined && result.priceMatch) {
    verification.details.currency = {
      expected: expected.currency,
      actual: result.priceMatch.currency,
      passed: result.priceMatch.currency === expected.currency,
    };
    if (!verification.details.currency.passed) {
      verification.passed = false;
    }
  }

  return verification;
}

/**
 * Helper to simulate price detection on a DOM element
 *
 * @param {Element} element - DOM element to test
 * @param {Function} findPrices - Price detection function
 * @param {object} settings - Settings object
 * @returns {object} Detection results
 */
export function detectPricesInElement(element, findPrices, settings = {}) {
  const textNodes = extractTextNodes(element);
  const results = [];

  for (const text of textNodes) {
    const result = findPrices(text, settings);
    if (result.hasPotentialPrice) {
      results.push({
        text,
        ...result,
      });
    }
  }

  return {
    found: results.length > 0,
    results,
    count: results.length,
  };
}

/**
 * Create a test scenario runner
 *
 * @param {Function} findPrices - Price detection function to test
 * @returns {Function} Test runner function
 */
export function createTestRunner(findPrices) {
  return function runTest(testCase) {
    const { element, expected, settings = {} } = testCase;
    const detection = detectPricesInElement(element, findPrices, settings);

    return {
      testCase: testCase.name || 'Unnamed test',
      detection,
      verification:
        detection.found && detection.results[0]
          ? verifyPriceDetection(detection.results[0], expected)
          : { passed: !expected.hasPotentialPrice, details: { noPriceFound: true } },
    };
  };
}

/**
 * Generate a test report from test results
 *
 * @param {Array} results - Array of test results
 * @returns {object} Test report with summary
 */
export function generateTestReport(results) {
  const passed = results.filter((r) => r.verification.passed).length;
  const failed = results.length - passed;

  return {
    total: results.length,
    passed,
    failed,
    successRate: ((passed / results.length) * 100).toFixed(2) + '%',
    failures: results.filter((r) => !r.verification.passed),
  };
}
