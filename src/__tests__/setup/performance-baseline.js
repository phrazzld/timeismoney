/**
 * Performance baseline measurement tool for price detection
 * Captures current system performance metrics for comparison with enhancements
 */

import { findPrices, mightContainPrice, detectCultureFromText } from '../../content/priceFinder.js';
import { loadTestPage } from './price-detection-harness.js';

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurement {
  constructor() {
    this.measurements = [];
  }

  /**
   * Measure execution time of a function
   *
   * @param {string} name - Name of the measurement
   * @param {Function} fn - Function to measure
   * @returns {object} Result with timing data
   */
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    const measurement = {
      name,
      duration: end - start,
      timestamp: new Date().toISOString(),
      result,
    };

    this.measurements.push(measurement);
    return measurement;
  }

  /**
   * Get statistics for measurements with the same name
   *
   * @param {string} name - Name of measurements to analyze
   * @returns {object} Statistics object
   */
  getStats(name) {
    const filtered = this.measurements.filter((m) => m.name === name);
    if (filtered.length === 0) return null;

    const durations = filtered.map((m) => m.duration);
    durations.sort((a, b) => a - b);

    return {
      count: filtered.length,
      min: durations[0],
      max: durations[durations.length - 1],
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
    };
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.measurements = [];
  }

  /**
   * Export measurements as JSON
   *
   * @returns {object} All measurements and statistics
   */
  export() {
    const measurementNames = [...new Set(this.measurements.map((m) => m.name))];
    const stats = {};

    measurementNames.forEach((name) => {
      stats[name] = this.getStats(name);
    });

    return {
      timestamp: new Date().toISOString(),
      totalMeasurements: this.measurements.length,
      measurements: this.measurements,
      statistics: stats,
    };
  }
}

/**
 * Baseline performance test suite
 */
export class BaselineTestSuite {
  constructor() {
    this.measurement = new PerformanceMeasurement();
  }

  /**
   * Test pattern matching performance with different text sizes
   *
   * @returns {object} Statistics for small text pattern matching
   */
  testPatternPerformance() {
    const settings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
    };

    // Test different text sizes
    const textSizes = [
      { name: 'small', text: '$12.34 product price' },
      {
        name: 'medium',
        text: 'Product costs $45.67 with shipping $8.99 total $54.66 ' + 'x'.repeat(100),
      },
      { name: 'large', text: 'Many products: $12.34, $56.78, $90.12 ' + 'x'.repeat(1000) },
      { name: 'xlarge', text: 'Store inventory: $1.99, $2.99, $3.99 ' + 'x'.repeat(10000) },
    ];

    textSizes.forEach(({ name, text }) => {
      // Warm up
      for (let i = 0; i < 5; i++) {
        findPrices(text, settings);
      }

      // Actual measurements
      for (let i = 0; i < 20; i++) {
        this.measurement.measure(`findPrices_${name}`, () => {
          return findPrices(text, settings);
        });
      }
    });

    return this.measurement.getStats('findPrices_small');
  }

  /**
   * Test heuristic detection performance
   *
   * @returns {Array} Array of test results with statistics
   */
  testHeuristicPerformance() {
    const testTexts = [
      '$12.34',
      'No price here',
      'Product costs $45.67 with free shipping',
      'USD 99.99 special offer',
      '€15,50 European price',
      'Many items: $1.99, $2.99, $3.99, $4.99, $5.99',
      'x'.repeat(1000) + ' $12.34 ' + 'x'.repeat(1000),
    ];

    testTexts.forEach((text, index) => {
      // Warm up
      for (let i = 0; i < 10; i++) {
        mightContainPrice(text);
      }

      // Measurements
      for (let i = 0; i < 50; i++) {
        this.measurement.measure(`heuristic_test${index}`, () => {
          return mightContainPrice(text);
        });
      }
    });

    return testTexts.map((text, index) => ({
      text: text.length > 50 ? text.substring(0, 50) + '...' : text,
      stats: this.measurement.getStats(`heuristic_test${index}`),
    }));
  }

  /**
   * Test culture detection performance
   *
   * @returns {Array} Array of culture detection results with statistics
   */
  testCultureDetection() {
    const testTexts = ['$12.34', '€15,50', '£99.99', '¥1,234', 'USD 49.99', 'EUR 25.99'];

    testTexts.forEach((text, index) => {
      // Warm up
      for (let i = 0; i < 10; i++) {
        detectCultureFromText(text);
      }

      // Measurements
      for (let i = 0; i < 30; i++) {
        this.measurement.measure(`culture_detection_${index}`, () => {
          return detectCultureFromText(text);
        });
      }
    });

    return testTexts.map((text, index) => ({
      text,
      culture: detectCultureFromText(text),
      stats: this.measurement.getStats(`culture_detection_${index}`),
    }));
  }

  /**
   * Test performance on actual site HTML
   *
   * @returns {Array} Array of site performance results
   */
  testSitePerformance() {
    const sites = ['gearbest-test.html', 'cdiscount-test.html', 'aliexpress-test.html'];
    const settings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
    };

    sites.forEach((site) => {
      try {
        const document = loadTestPage(site);
        const textNodes = [];

        // Extract all text content from the test page
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);

        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim().length > 0) {
            textNodes.push(node.textContent.trim());
          }
        }

        // Measure performance on each text node
        textNodes.forEach((text, index) => {
          if (text.length > 5) {
            // Skip very short text
            for (let i = 0; i < 10; i++) {
              this.measurement.measure(`site_${site}_node${index}`, () => {
                return findPrices(text, settings);
              });
            }
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Could not load test page ${site}:`, error.message);
      }
    });

    return sites.map((site) => {
      const siteStats = this.measurement.measurements
        .filter((m) => m.name.includes(`site_${site}`))
        .map((m) => m.duration);

      if (siteStats.length === 0) return { site, error: 'No measurements' };

      return {
        site,
        nodeCount: siteStats.length,
        totalTime: siteStats.reduce((sum, d) => sum + d, 0),
        avgTime: siteStats.reduce((sum, d) => sum + d, 0) / siteStats.length,
        maxTime: Math.max(...siteStats),
      };
    });
  }

  /**
   * Run complete baseline test suite
   *
   * @returns {object} Complete performance baseline data
   */
  runBaseline() {
    // eslint-disable-next-line no-console
    console.log('Running baseline performance tests...');

    this.measurement.clear();

    const results = {
      timestamp: new Date().toISOString(),
      patternPerformance: this.testPatternPerformance(),
      heuristicPerformance: this.testHeuristicPerformance(),
      cultureDetection: this.testCultureDetection(),
      sitePerformance: this.testSitePerformance(),
      fullExport: this.measurement.export(),
    };

    // eslint-disable-next-line no-console
    console.log('Baseline tests completed');
    return results;
  }
}

/**
 * Generate baseline performance report
 *
 * @returns {object} Performance baseline data
 */
export function generateBaseline() {
  const suite = new BaselineTestSuite();
  return suite.runBaseline();
}
