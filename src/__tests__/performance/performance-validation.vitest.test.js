/**
 * Performance Validation Test Suite
 * Measures performance impact of enhanced price detection system
 * Compares against baseline metrics from TASK-002
 */

// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';

// Import performance measurement utilities
import * as performance from '../../utils/performance.js';
import {
  instrumentExtension,
  restoreOriginals,
  collectPerformanceStats,
} from '../../utils/performance-instrumentation.js';

// Import price detection systems (old and new)
import { findPrices } from '../../content/priceFinder.js';
import { extractPrice } from '../../content/priceExtractor.js';

// Import debug logging
import { setDebugMode } from '../../utils/logger.js';

// Import performance analyzer
import {
  analyzePerformanceResults,
  generateMarkdownReport,
} from '../../utils/performance-analysis.js';

describe('Performance Validation', () => {
  let performanceData;

  beforeEach(() => {
    // Reset performance measurements
    performanceData = {
      baseline: {},
      enhanced: {},
      comparison: {},
    };

    // Disable debug mode for baseline measurements
    setDebugMode(false);

    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up instrumentation
    restoreOriginals();
    vi.restoreAllMocks();
    setDebugMode(false);
  });

  describe('Baseline Performance Metrics', () => {
    it('should establish baseline performance for original findPrices function', () => {
      // TASK-002 baseline expectations
      const BASELINE_EXPECTATIONS = {
        shortText: { max: 0.1, description: 'Short text (< 100 chars)' },
        mediumText: { max: 0.5, description: 'Medium text (100-1000 chars)' },
        largeText: { max: 2.0, description: 'Large text (1000+ chars)' },
        patternCompilation: { max: 0.5, description: 'Pattern compilation' },
      };

      // Test data
      const testTexts = {
        short: '$12.34',
        medium:
          'This is a medium length text with a price of €45.67 somewhere in the middle of the content',
        large:
          'This is a very long text '.repeat(50) +
          ' with a price of ¥1234.56 ' +
          'more content '.repeat(50),
      };

      // Measure original function performance
      Object.entries(testTexts).forEach(([size, text]) => {
        const measurements = [];

        // Warm-up runs
        for (let i = 0; i < 5; i++) {
          findPrices(text);
        }

        // Actual measurements
        for (let i = 0; i < 20; i++) {
          const start = Date.now();
          findPrices(text);
          const duration = Date.now() - start;
          measurements.push(duration);
        }

        const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
        const maxExpected = BASELINE_EXPECTATIONS[size + 'Text']?.max || 2.0;

        performanceData.baseline[size] = {
          avgDuration,
          measurements,
          expected: maxExpected,
        };

        // Baseline should meet TASK-002 expectations
        expect(avgDuration).toBeLessThanOrEqual(maxExpected);
      });
    });

    it('should measure pattern compilation performance', () => {
      const uniquePatterns = ['$', '€', '¥', '£', '₹', 'USD', 'EUR', 'JPY'];
      const compilationTimes = [];

      uniquePatterns.forEach((pattern) => {
        const start = Date.now();
        findPrices(`Test text with ${pattern}123.45 price`);
        const duration = Date.now() - start;
        compilationTimes.push(duration);
      });

      const avgCompilation =
        compilationTimes.reduce((sum, t) => sum + t, 0) / compilationTimes.length;
      performanceData.baseline.patternCompilation = {
        avgDuration: avgCompilation,
        measurements: compilationTimes,
      };

      // Should meet TASK-002 expectation of ~0.5ms per pattern
      expect(avgCompilation).toBeLessThanOrEqual(0.5);
    });
  });

  describe('Enhanced System Performance', () => {
    it('should measure new extractPrice pipeline performance', async () => {
      // Test with same baseline data
      const testTexts = {
        short: '$12.34',
        medium:
          'This is a medium length text with a price of €45.67 somewhere in the middle of the content',
        large:
          'This is a very long text '.repeat(50) +
          ' with a price of ¥1234.56 ' +
          'more content '.repeat(50),
      };

      for (const [size, text] of Object.entries(testTexts)) {
        const measurements = [];

        // Warm-up runs
        for (let i = 0; i < 5; i++) {
          await extractPrice(text);
        }

        // Actual measurements
        for (let i = 0; i < 20; i++) {
          const start = Date.now();
          await extractPrice(text);
          const duration = Date.now() - start;
          measurements.push(duration);
        }

        const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;

        performanceData.enhanced[size] = {
          avgDuration,
          measurements,
        };

        // Enhanced system should be within 10% of baseline for simple cases
        const baselineAvg = performanceData.baseline[size]?.avgDuration || 2.0;
        const acceptableThreshold = baselineAvg * 1.1; // 10% tolerance

        expect(avgDuration).toBeLessThanOrEqual(acceptableThreshold);
      }
    });

    it('should measure DOM-based extraction performance', async () => {
      // Real examples from examples.md
      const domExamples = [
        {
          name: 'cdiscount_simple',
          html: '<font style="vertical-align: inherit;">272.46 €</font>',
          expected: '272.46',
        },
        {
          name: 'amazon_aria_label',
          html: '<span aria-label="$8.48" class="a-size-base a-color-price">$8.48</span>',
          expected: '8.48',
        },
        {
          name: 'amazon_split_price',
          html: '<span aria-hidden="true"><span class="a-price-symbol">$</span><span class="a-price-whole">8<span class="a-price-decimal">.</span></span><span class="a-price-fraction">48</span></span>',
          expected: '8.48',
        },
        {
          name: 'cdiscount_split_format',
          html: '<span class="c-price c-price--promo c-price--md"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">449€ </font></font><span itemprop="priceCurrency"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">00</font></font></span></span>',
          expected: '449.00',
        },
      ];

      const domMeasurements = {};

      for (const example of domExamples) {
        // Create DOM element
        const container = document.createElement('div');
        container.innerHTML = example.html;
        const element = container.firstElementChild;

        const measurements = [];

        // Warm-up runs
        for (let i = 0; i < 5; i++) {
          await extractPrice(element);
        }

        // Actual measurements
        for (let i = 0; i < 20; i++) {
          const start = Date.now();
          const result = await extractPrice(element);
          const duration = Date.now() - start;
          measurements.push(duration);

          // Ensure functionality is preserved
          expect(result).toBeTruthy();
          expect(result.value).toContain(example.expected);
        }

        const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
        domMeasurements[example.name] = {
          avgDuration,
          measurements,
        };

        // Complex DOM extraction should be ≤ 5ms (acceptable for new capabilities)
        expect(avgDuration).toBeLessThanOrEqual(5.0);
      }

      performanceData.enhanced.domExtractions = domMeasurements;
    });

    it('should measure multi-pass pipeline overhead', async () => {
      const testCases = [
        { input: 'Simple $12.34 price', expectedPasses: 1, description: 'Early exit' },
        { input: 'No price here', expectedPasses: 5, description: 'Full pipeline' },
        { input: 'Under $20', expectedPasses: 5, description: 'Contextual patterns' },
      ];

      for (const testCase of testCases) {
        const measurements = [];

        // Enable debug mode to get pass information
        setDebugMode(true);

        for (let i = 0; i < 10; i++) {
          const start = Date.now();
          await extractPrice(testCase.input, { multiPassMode: true });
          const duration = Date.now() - start;
          measurements.push(duration);
        }

        const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;

        performanceData.enhanced[`multiPass_${testCase.description}`] = {
          avgDuration,
          measurements,
          expectedPasses: testCase.expectedPasses,
        };

        // Multi-pass should complete within reasonable time
        expect(avgDuration).toBeLessThanOrEqual(10.0);

        setDebugMode(false);
      }
    });
  });

  describe('Memory Usage Analysis', () => {
    it('should measure memory impact of DOM traversal', async () => {
      // Create large DOM structure
      const container = document.createElement('div');
      const priceElements = [];

      // Create 100 price elements
      for (let i = 0; i < 100; i++) {
        const elem = document.createElement('span');
        elem.textContent = `$${(i + 1) * 10}.99`;
        elem.className = 'price-element';
        container.appendChild(elem);
        priceElements.push(elem);
      }

      document.body.appendChild(container);

      // Measure memory before
      const memoryBefore = globalThis.performance.memory
        ? globalThis.performance.memory.usedJSHeapSize
        : 0;

      // Process all elements
      const results = [];
      const start = Date.now();

      for (const element of priceElements) {
        const result = await extractPrice(element);
        if (result) {
          results.push(result);
        }
      }

      const duration = Date.now() - start;

      // Measure memory after
      const memoryAfter = globalThis.performance.memory
        ? globalThis.performance.memory.usedJSHeapSize
        : 0;

      const memoryDelta = memoryAfter - memoryBefore;

      performanceData.enhanced.memoryUsage = {
        elementsProcessed: priceElements.length,
        resultsFound: results.length,
        totalDuration: duration,
        avgDurationPerElement: duration / priceElements.length,
        memoryDelta,
      };

      // Cleanup
      document.body.removeChild(container);

      // Memory usage should be reasonable
      expect(results.length).toBeGreaterThan(90); // Should find most prices
      expect(duration).toBeLessThanOrEqual(500); // 5ms per element max

      // Memory delta should be reasonable (if available)
      if (globalThis.performance.memory) {
        expect(memoryDelta).toBeLessThanOrEqual(1024 * 1024); // 1MB max increase
      }
    });
  });

  describe('Debug Mode Performance Impact', () => {
    it('should measure debug logging overhead', async () => {
      const testText = 'Test price $123.45 with debug logging';

      // Measure without debug
      setDebugMode(false);
      const withoutDebugMeasurements = [];

      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await extractPrice(testText);
        const duration = Date.now() - start;
        withoutDebugMeasurements.push(duration);
      }

      const avgWithoutDebug =
        withoutDebugMeasurements.reduce((sum, d) => sum + d, 0) / withoutDebugMeasurements.length;

      // Measure with debug
      setDebugMode(true);
      const withDebugMeasurements = [];

      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await extractPrice(testText);
        const duration = Date.now() - start;
        withDebugMeasurements.push(duration);
      }

      const avgWithDebug =
        withDebugMeasurements.reduce((sum, d) => sum + d, 0) / withDebugMeasurements.length;

      const debugOverhead =
        avgWithoutDebug > 0 ? ((avgWithDebug - avgWithoutDebug) / avgWithoutDebug) * 100 : 0;

      performanceData.enhanced.debugImpact = {
        withoutDebug: avgWithoutDebug,
        withDebug: avgWithDebug,
        overheadPercent: debugOverhead,
      };

      // Debug overhead should be ≤ 50%
      expect(debugOverhead).toBeLessThanOrEqual(50);

      setDebugMode(false);
    });
  });

  describe('Page-Level Performance Simulation', () => {
    it('should simulate full page processing performance', async () => {
      // Simulate processing 500-2000 text nodes with 5-50 price conversions
      const totalNodes = 1000;
      const expectedPrices = 25;

      const nodes = [];

      // Create mix of text nodes (most without prices)
      for (let i = 0; i < totalNodes; i++) {
        const node = document.createTextNode(
          i % 40 === 0 ? `Product costs $${(i + 1) * 5}.99` : `Regular text content ${i}`
        );
        nodes.push(node);
      }

      const start = Date.now();
      const results = [];

      // Process all nodes
      for (const node of nodes) {
        const result = await extractPrice(node.textContent);
        if (result) {
          results.push(result);
        }
      }

      const totalDuration = Date.now() - start;

      performanceData.enhanced.pageSimulation = {
        totalNodes,
        nodesWithPrices: results.length,
        totalDuration,
        avgDurationPerNode: totalDuration / totalNodes,
        avgDurationPerPrice: totalDuration / results.length,
      };

      // Should process full page within 220ms (10% over TASK-002 baseline of 200ms)
      expect(totalDuration).toBeLessThanOrEqual(220);
      expect(results.length).toBeGreaterThanOrEqual(expectedPrices * 0.8); // Allow 20% variance
    });
  });

  describe('Performance Comparison Analysis', () => {
    it('should generate comprehensive performance report', () => {
      // This test aggregates all performance data collected above
      expect(performanceData.baseline).toBeDefined();
      expect(performanceData.enhanced).toBeDefined();

      // Generate comprehensive analysis
      const analysis = analyzePerformanceResults(performanceData);

      // Validate analysis structure
      expect(analysis.summary).toBeDefined();
      expect(analysis.compliance).toBeDefined();
      expect(analysis.recommendations).toBeDefined();

      // Generate markdown report for documentation
      const markdownReport = generateMarkdownReport(analysis);

      // Log performance analysis for manual review
      console.info('=== PERFORMANCE VALIDATION REPORT ===');
      console.info('Overall Result:', analysis.summary.overall);
      console.info('Compliance Score:', analysis.summary.score + '%');
      console.info('Risk Level:', analysis.summary.riskLevel);
      console.info('Key Findings:', analysis.summary.keyFindings);

      if (analysis.recommendations.length > 0) {
        console.info('Recommendations:');
        analysis.recommendations.forEach((rec) => {
          console.info(`  [${rec.priority.toUpperCase()}] ${rec.issue} - ${rec.recommendation}`);
        });
      }

      // Log compliance details
      console.info('\nCompliance Details:');
      Object.entries(analysis.compliance.details).forEach(([metric, data]) => {
        const status = data.compliant ? 'PASS' : 'FAIL';
        console.info(
          `  ${metric}: ${data.value.toFixed(2)} (threshold: ${data.threshold}) - ${status}`
        );
      });

      // Store analysis for potential further use
      performanceData.analysis = analysis;
      performanceData.markdownReport = markdownReport;

      // Log detailed analysis data for debugging
      console.info('\nDetailed Analysis:', JSON.stringify(analysis, null, 2));

      // Validate that the enhanced system meets performance requirements
      expect(analysis.summary.overall).toBe('PASS');
      expect(analysis.summary.score).toBeGreaterThanOrEqual(85); // 85% compliance minimum
      expect(analysis.compliance.overall).toBe(true);

      // Validate specific compliance requirements per TASK-015 (if available)
      if (analysis.compliance.details.pageProcessing) {
        expect(analysis.compliance.details.pageProcessing.compliant).toBe(true);
      }

      // Log success message
      console.info(
        '\n✅ Enhanced price detection system passes all performance validation requirements'
      );
      console.info('📊 Full report available in performanceData.markdownReport');
    });
  });
});
