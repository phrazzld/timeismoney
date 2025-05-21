/**
 * Performance Test Runner
 *
 * Executes performance benchmarks for the Time Is Money extension
 * using Puppeteer to load test pages and measure performance metrics.
 *
 * Usage:
 *   node scripts/performance-test.js
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const testPagesDir = path.join(projectRoot, 'test-pages');
const reportDir = path.join(projectRoot, 'performance-reports');

// Create report directory if it doesn't exist
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Define test configurations
const testPages = [
  { name: 'simple', filePath: path.join(testPagesDir, 'simple.html') },
  { name: 'medium', filePath: path.join(testPagesDir, 'medium.html') },
  { name: 'complex', filePath: path.join(testPagesDir, 'complex.html') },
];

// Ensure extension is built before testing
const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Error: Extension is not built. Please run `npm run build` first.');
  process.exit(1);
}

/**
 * Runs the performance tests on each test page
 *
 * @returns {object} Performance test report
 */
async function runPerformanceTests() {
  console.log('Starting performance tests...');

  // Load or create the report file
  const reportFile = path.join(
    reportDir,
    `performance-report-${new Date().toISOString().split('T')[0]}.json`
  );
  const report = {
    timestamp: new Date().toISOString(),
    results: [],
    summary: {},
  };

  try {
    // Launch browser with extension loaded
    const browser = await puppeteer.launch({
      headless: false, // Headless doesn't work well with extensions
      args: [
        `--disable-extensions-except=${distDir}`,
        `--load-extension=${distDir}`,
        '--no-sandbox',
      ],
    });

    // Get the extension ID - this is complex and requires a background page
    const extensionTarget = await browser.waitForTarget(
      (target) => target.type() === 'background_page'
    );
    const extensionId = extensionTarget.url().split('/')[2];
    console.log(`Extension loaded with ID: ${extensionId}`);

    // Run tests for each page
    for (const testPage of testPages) {
      console.log(`\nTesting ${testPage.name} page...`);
      const pageResults = await runPageTest(browser, testPage, extensionId);
      report.results.push(pageResults);
    }

    // Close browser after tests
    await browser.close();

    // Create summary statistics
    report.summary = generateSummary(report.results);

    // Save report
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\nPerformance report saved to: ${reportFile}`);

    // Also save a performance-summary.md markdown file
    const summaryFile = path.join(reportDir, 'performance-summary.md');
    const markdownSummary = generateMarkdownSummary(report);
    fs.writeFileSync(summaryFile, markdownSummary);
    console.log(`Performance summary saved to: ${summaryFile}`);

    return report;
  } catch (error) {
    console.error('Error running performance tests:', error);
    process.exit(1);
  }
}

/**
 * Tests a specific page and gathers performance metrics
 *
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 * @param {object} testPage - Test page configuration
 * @param {string} extensionId - Chrome extension ID
 * @returns {object} Performance metrics for the page
 */
async function runPageTest(browser, testPage, extensionId) {
  const page = await browser.newPage();

  // Enable performance metrics collection
  await page.coverage.startJSCoverage();

  // Set up performance observers and listeners
  await page.evaluateOnNewDocument(() => {
    window.performanceResults = {
      marks: [],
      measures: [],
      resources: [],
      timings: {},
    };

    // Create a performance observer for marks and measures
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'mark') {
          window.performanceResults.marks.push({
            name: entry.name,
            startTime: entry.startTime,
          });
        } else if (entry.entryType === 'measure') {
          window.performanceResults.measures.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });
    });

    // Observe marks and measures
    observer.observe({ entryTypes: ['mark', 'measure'] });

    // Record performance timings at page load
    window.addEventListener('load', () => {
      // Get basic page timings
      const timing = performance.timing;
      window.performanceResults.timings = {
        pageLoad: timing.loadEventEnd - timing.navigationStart,
        domComplete: timing.domComplete - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        firstPaint: window.performance.getEntriesByType('paint')[0]?.startTime || 0,
      };

      // Get resource timings
      window.performance.getEntriesByType('resource').forEach((resource) => {
        if (
          resource.name.includes('chrome-extension') ||
          resource.name.includes('content.bundle.js') ||
          resource.name.includes('converter.js')
        ) {
          window.performanceResults.resources.push({
            name: resource.name,
            duration: resource.duration,
            transferSize: resource.transferSize,
            type: resource.initiatorType,
          });
        }
      });
    });
  });

  // Navigate to the test page
  const fileUrl = `file://${testPage.filePath}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Wait to ensure extension has time to process the page
  await page.waitForTimeout(2000);

  // Collect JavaScript coverage
  const jsCoverage = await page.coverage.stopJSCoverage();

  // Calculate JS coverage statistics
  let totalBytes = 0;
  let usedBytes = 0;

  for (const entry of jsCoverage) {
    // Only consider extension scripts
    if (
      entry.url.includes('chrome-extension') ||
      entry.url.includes('content.bundle.js') ||
      entry.url.includes('converter.js')
    ) {
      totalBytes += entry.text.length;

      for (const range of entry.ranges) {
        usedBytes += range.end - range.start;
      }
    }
  }

  // Collect DOM statistics
  const domStats = await page.evaluate(() => {
    return {
      totalNodes: document.querySelectorAll('*').length,
      textNodes: document.evaluate(
        '//text()',
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      ).snapshotLength,
      convertedPrices: document.querySelectorAll('.tim-converted-price').length || 0,
      performanceResults: window.performanceResults || {},
    };
  });

  // Take a screenshot for the report
  const screenshotPath = path.join(reportDir, `${testPage.name}-screenshot.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Close the page
  await page.close();

  // Capture extension specific metrics from background page
  const backgroundTarget = await browser.waitForTarget(
    (target) => target.type() === 'background_page' && target.url().includes(extensionId)
  );
  const backgroundPage = await backgroundTarget.page();

  // Collect any metrics the extension exposes
  const extensionMetrics = await backgroundPage.evaluate(() => {
    return window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType('measure').map((m) => ({
          name: m.name,
          duration: m.duration,
        }))
      : [];
  });

  // Create and return the page result object
  return {
    pageName: testPage.name,
    timestamp: new Date().toISOString(),
    coverage: {
      totalBytes,
      usedBytes,
      percentUsed: (usedBytes / totalBytes) * 100,
    },
    domStats: {
      totalNodes: domStats.totalNodes,
      textNodes: domStats.textNodes,
      convertedPrices: domStats.convertedPrices,
    },
    performanceResults: domStats.performanceResults,
    extensionMetrics,
    screenshotPath,
  };
}

/**
 * Generates summary statistics from test results
 *
 * @param {Array<object>} results - Array of page test results
 * @returns {object} Summary statistics
 */
function generateSummary(results) {
  const summary = {
    avgPageLoad: 0,
    avgDomComplete: 0,
    avgFirstConversion: 0,
    avgConvertedPrices: 0,
    avgJsUsage: 0,
    timePerPrice: {},
  };

  // Calculate averages
  let pageLoadTotal = 0;
  let domCompleteTotal = 0;
  let firstConversionTotal = 0;
  let convertedPricesTotal = 0;
  let jsUsageTotal = 0;

  results.forEach((result) => {
    pageLoadTotal += result.performanceResults.timings.pageLoad || 0;
    domCompleteTotal += result.performanceResults.timings.domComplete || 0;

    // Find first conversion time if available
    const firstConversion = result.performanceResults.measures.find(
      (m) => m.name === 'first_conversion_attempt'
    );
    if (firstConversion) {
      firstConversionTotal += firstConversion.duration;
    }

    convertedPricesTotal += result.domStats.convertedPrices;
    jsUsageTotal += result.coverage.percentUsed;
  });

  summary.avgPageLoad = pageLoadTotal / results.length;
  summary.avgDomComplete = domCompleteTotal / results.length;
  summary.avgFirstConversion = firstConversionTotal / results.length;
  summary.avgConvertedPrices = convertedPricesTotal / results.length;
  summary.avgJsUsage = jsUsageTotal / results.length;

  // Calculate time per price for each page type
  results.forEach((result) => {
    if (result.domStats.convertedPrices > 0) {
      const firstConversion = result.performanceResults.measures.find(
        (m) => m.name === 'first_conversion_attempt'
      );
      if (firstConversion) {
        summary.timePerPrice[result.pageName] =
          firstConversion.duration / result.domStats.convertedPrices;
      }
    }
  });

  return summary;
}

/**
 * Generates a markdown summary report
 *
 * @param {object} report - Performance report object
 * @returns {string} Markdown report content
 */
function generateMarkdownSummary(report) {
  let markdown = `# Time Is Money Performance Report\n\n`;
  markdown += `**Date:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `| ------ | ----- |\n`;
  markdown += `| Average Page Load Time | ${report.summary.avgPageLoad.toFixed(2)}ms |\n`;
  markdown += `| Average DOM Complete Time | ${report.summary.avgDomComplete.toFixed(2)}ms |\n`;
  markdown += `| Average First Conversion Time | ${report.summary.avgFirstConversion.toFixed(2)}ms |\n`;
  markdown += `| Average Converted Prices | ${report.summary.avgConvertedPrices.toFixed(2)} |\n`;
  markdown += `| Average JS Usage | ${report.summary.avgJsUsage.toFixed(2)}% |\n`;

  markdown += `\n## Time Per Price (ms)\n\n`;
  markdown += `| Page Type | Time per Price |\n`;
  markdown += `| --------- | -------------- |\n`;
  for (const [pageName, time] of Object.entries(report.summary.timePerPrice)) {
    markdown += `| ${pageName} | ${time.toFixed(2)}ms |\n`;
  }

  markdown += `\n## Detailed Results\n\n`;
  for (const result of report.results) {
    markdown += `### ${result.pageName} Page\n\n`;

    markdown += `**DOM Statistics:**\n`;
    markdown += `- Total Nodes: ${result.domStats.totalNodes}\n`;
    markdown += `- Text Nodes: ${result.domStats.textNodes}\n`;
    markdown += `- Converted Prices: ${result.domStats.convertedPrices}\n\n`;

    markdown += `**Performance Timings:**\n`;
    markdown += `- Page Load: ${result.performanceResults.timings.pageLoad}ms\n`;
    markdown += `- DOM Complete: ${result.performanceResults.timings.domComplete}ms\n`;
    markdown += `- DOM Interactive: ${result.performanceResults.timings.domInteractive}ms\n`;
    markdown += `- First Paint: ${result.performanceResults.timings.firstPaint}ms\n\n`;

    if (result.performanceResults.measures.length > 0) {
      markdown += `**Key Measures:**\n`;
      const sortedMeasures = [...result.performanceResults.measures].sort(
        (a, b) => b.duration - a.duration
      );
      sortedMeasures.slice(0, 10).forEach((measure) => {
        markdown += `- ${measure.name}: ${measure.duration.toFixed(2)}ms\n`;
      });
      markdown += `\n`;
    }

    markdown += `**Code Coverage:**\n`;
    markdown += `- Used: ${result.coverage.usedBytes} bytes (${result.coverage.percentUsed.toFixed(2)}%)\n`;
    markdown += `- Total: ${result.coverage.totalBytes} bytes\n\n`;

    markdown += `![${result.pageName} Screenshot](${path.basename(result.screenshotPath)})\n\n`;
    markdown += `---\n\n`;
  }

  markdown += `\n## Key Observations\n\n`;
  markdown += `- The extension processes pages with varying complexity effectively\n`;
  markdown += `- First price conversion happens in ${report.summary.avgFirstConversion.toFixed(2)}ms on average\n`;

  // Detect potential issues
  if (report.summary.avgFirstConversion > 500) {
    markdown += `- **Potential Issue:** First conversion time is relatively high (>${report.summary.avgFirstConversion.toFixed(0)}ms)\n`;
  }

  if (report.summary.avgJsUsage < 50) {
    markdown += `- **Potential Issue:** JavaScript usage is quite low (${report.summary.avgJsUsage.toFixed(0)}%), suggesting dead code\n`;
  }

  // Add recommendations
  markdown += `\n## Recommendations\n\n`;

  // Based on summary, provide targeted recommendations
  if (report.summary.avgFirstConversion > 500) {
    markdown += `- Consider optimizing the initial recognition and conversion flow\n`;
    markdown += `- Implement faster early-detection of price elements\n`;
  }

  if (report.summary.avgJsUsage < 50) {
    markdown += `- Remove unused code to reduce bundle size\n`;
    markdown += `- Consider code splitting for less frequently used features\n`;
  }

  return markdown;
}

// Execute the performance tests
runPerformanceTests().catch(console.error);
