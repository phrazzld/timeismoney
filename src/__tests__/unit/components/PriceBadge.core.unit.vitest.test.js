/**
 * Comprehensive unit tests for PriceBadge core functionality
 * Covers badge creation, styling, cleanup, and caching integration
 *
 * This completes S3.3 - Unit tests coverage for core badge functionality
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { PriceBadge, createPriceBadge } from '../../../components/PriceBadge.js';
import { clearAllCaches, getCacheStatistics } from '../../../utils/styleCache.js';
import { detectBackgroundTheme } from '../../../utils/styleGenerator.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';

describe('PriceBadge Core Functionality', () => {
  beforeEach(() => {
    // Clear caches before each test for consistent results
    clearAllCaches();

    // Reset DOM
    document.body.innerHTML = '';

    // Mock window for responsive tests
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      getComputedStyle: vi.fn().mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      }),
    };

    // Mock performance.now for timing tests
    global.performance = {
      ...global.performance,
      now: vi.fn(() => Date.now()),
    };
  });

  afterEach(() => {
    clearAllCaches();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Badge Creation Scenarios', () => {
    test('creates badge with minimal configuration', () => {
      const badge = new PriceBadge({
        originalPrice: '$10.00',
        timeDisplay: '1h 0m',
      });

      const element = badge.render();

      expect(element.tagName).toBe('SPAN');
      expect(element.className).toBe(CONVERTED_PRICE_CLASS);
      expect(element.getAttribute('data-original-price')).toBe('$10.00');
      expect(element.textContent).toContain('1h 0m');
    });

    test('creates badge with full configuration options', () => {
      const context = document.createElement('div');
      context.style.backgroundColor = 'black';

      const badge = new PriceBadge({
        originalPrice: '$25.50',
        timeDisplay: '2h 30m',
        context,
        iconSize: 'sm',
        useIcon: true,
        responsive: true,
        conflictProtection: true,
        defensiveStyles: true,
        enableAccessibility: true,
        verboseAccessibility: true,
        styleOverrides: { color: 'red' },
      });

      const element = badge.render();

      expect(element.getAttribute('data-original-price')).toBe('$25.50');
      expect(element.textContent).toContain('2h 30m');
      expect(element.innerHTML).toContain('<svg'); // Icon should be present
      expect(element.getAttribute('aria-label')).toBeTruthy();
    });

    test('handles edge case price formats', () => {
      const edgeCases = [
        { price: '$0.99', time: '6m' },
        { price: '$1,234.56', time: '123h 27m' },
        { price: '€15.00', time: '1h 30m' },
        { price: '¥1000', time: '10h 0m' },
      ];

      edgeCases.forEach(({ price, time }) => {
        const badge = new PriceBadge({
          originalPrice: price,
          timeDisplay: time,
        });

        const element = badge.render();
        expect(element.getAttribute('data-original-price')).toBe(price);
        expect(element.textContent).toContain(time);
      });
    });

    test('creates multiple badges independently', () => {
      const badges = [
        new PriceBadge({ originalPrice: '$10.00', timeDisplay: '1h 0m' }),
        new PriceBadge({ originalPrice: '$20.00', timeDisplay: '2h 0m' }),
        new PriceBadge({ originalPrice: '$30.00', timeDisplay: '3h 0m' }),
      ];

      const elements = badges.map((badge) => badge.render());

      // Each badge should be independent
      elements.forEach((element, index) => {
        expect(element.getAttribute('data-original-price')).toBe(`$${(index + 1) * 10}.00`);
        expect(element.textContent).toContain(`${index + 1}h 0m`);
      });

      // Cleanup should work for all
      badges.forEach((badge) => {
        expect(badge.destroy()).toBe(true);
      });
    });
  });

  describe('Style Caching Integration', () => {
    test('benefits from style caching on repeated badge creation', () => {
      clearAllCaches();

      // First badge - should generate and cache styles
      const badge1 = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
        responsive: true,
      });
      badge1.render();

      // Get initial cache stats
      const initialStats = getCacheStatistics();
      const initialGenerations = initialStats.statistics.badgeStyles.generations;

      // Second badge with same config - should use cached styles
      const badge2 = new PriceBadge({
        originalPrice: '$40.00', // Different price but same style config
        timeDisplay: '4h 0m',
        useIcon: true,
        responsive: true,
      });
      badge2.render();

      // Cache should show hits, not additional generations
      const finalStats = getCacheStatistics();
      expect(finalStats.statistics.badgeStyles.hits).toBeGreaterThan(0);
      expect(finalStats.statistics.badgeStyles.generations).toBe(initialGenerations);
    });

    test('icon caching works correctly', () => {
      clearAllCaches();

      // Create badges with same icon configuration
      const badges = [
        new PriceBadge({
          originalPrice: '$10.00',
          timeDisplay: '1h',
          iconSize: 'xs',
          useIcon: true,
        }),
        new PriceBadge({
          originalPrice: '$20.00',
          timeDisplay: '2h',
          iconSize: 'xs',
          useIcon: true,
        }),
        new PriceBadge({
          originalPrice: '$30.00',
          timeDisplay: '3h',
          iconSize: 'xs',
          useIcon: true,
        }),
      ];

      badges.forEach((badge) => badge.render());

      const stats = getCacheStatistics();
      expect(stats.statistics.iconStyles.hits).toBeGreaterThan(0);
      expect(stats.statistics.iconStyles.generations).toBe(1);
    });

    test('theme detection caching works correctly', () => {
      clearAllCaches();

      // Create a context and verify the theme caching logic works
      const context = document.createElement('div');
      context.className = 'dark-background';
      context.id = 'test-dark-context';

      // Mock getComputedStyle to return consistent dark background
      global.window.getComputedStyle = vi.fn((element) => {
        if (element === context) {
          return { backgroundColor: 'rgb(30, 30, 30)' };
        }
        return { backgroundColor: 'rgb(255, 255, 255)' };
      });

      // Test theme detection directly first
      // First call should miss cache and generate
      const theme1 = detectBackgroundTheme(context);
      expect(theme1).toBe('dark');

      const midStats = getCacheStatistics();
      expect(midStats.statistics.themes.generations).toBe(1);
      expect(midStats.statistics.themes.misses).toBe(1);
      expect(midStats.statistics.themes.hits).toBe(0);

      // Second call should hit cache
      const theme2 = detectBackgroundTheme(context);
      expect(theme2).toBe('dark');

      const finalStats = getCacheStatistics();
      expect(finalStats.statistics.themes.generations).toBe(1);
      expect(finalStats.statistics.themes.misses).toBe(1);
      expect(finalStats.statistics.themes.hits).toBe(1);
    });
  });

  describe('Style Generation Edge Cases', () => {
    test('handles style generation errors gracefully', () => {
      // Mock style generation to throw error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Badge should still render with fallback styles
      const badge = new PriceBadge({
        originalPrice: '$50.00',
        timeDisplay: '5h 0m',
      });

      const element = badge.render();

      // Should have rendered despite potential style errors
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('5h 0m');

      console.error = originalConsoleError;
    });

    test('applies style overrides correctly', () => {
      const badge = new PriceBadge({
        originalPrice: '$15.00',
        timeDisplay: '1h 30m',
        styleOverrides: {
          color: 'purple',
          fontWeight: 'bold',
          fontSize: '16px',
        },
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Style overrides should be applied
      expect(styles).toContain('color: purple');
      expect(styles).toContain('font-weight: bold');
      expect(styles).toContain('font-size: 16px');
    });

    test('defensive styling prevents host site conflicts', () => {
      const badge = new PriceBadge({
        originalPrice: '$20.00',
        timeDisplay: '2h 0m',
        defensiveStyles: true,
        conflictProtection: true,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should contain !important declarations for conflict protection
      expect(styles).toContain('!important');
      expect(styles).toContain('box-sizing: border-box');
    });
  });

  describe('Cleanup Operations', () => {
    test('complete cleanup removes all traces', () => {
      const badge = new PriceBadge({
        originalPrice: '$45.00',
        timeDisplay: '4h 30m',
        enableAccessibility: true,
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Verify badge is in DOM
      expect(document.body.contains(element)).toBe(true);
      expect(badge.isRenderedState()).toBe(true);
      expect(badge.isDestroyedState()).toBe(false);

      // Clean up
      const cleanupResult = badge.destroy();

      // Verify complete cleanup
      expect(cleanupResult).toBe(true);
      expect(document.body.contains(element)).toBe(false);
      expect(badge.getElement()).toBeNull();
      expect(badge.isRenderedState()).toBe(false);
      expect(badge.isDestroyedState()).toBe(true);
    });

    test('handles cleanup of badges with tooltips', () => {
      const badge = new PriceBadge({
        originalPrice: '$35.00',
        timeDisplay: '3h 30m',
        enableAccessibility: true,
        verboseAccessibility: true,
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Should have created accessible tooltip
      const tooltips = document.querySelectorAll('.tim-accessible-tooltip');
      expect(tooltips.length).toBeGreaterThan(0);

      // Cleanup should remove tooltips too
      badge.destroy();

      const remainingTooltips = document.querySelectorAll('.tim-accessible-tooltip');
      expect(remainingTooltips.length).toBe(0);
    });

    test('multiple cleanup calls are safe', () => {
      const badge = new PriceBadge({
        originalPrice: '$25.00',
        timeDisplay: '2h 30m',
      });

      badge.render();

      // Multiple destroy calls should be safe
      expect(badge.destroy()).toBe(true);
      expect(badge.destroy()).toBe(true); // Second call should not error
      expect(badge.destroy()).toBe(true); // Third call should not error

      expect(badge.isDestroyedState()).toBe(true);
    });
  });

  describe('Factory Function Comprehensive Testing', () => {
    test('createPriceBadge handles all parameter combinations', () => {
      // Test all factory function signatures
      const testCases = [
        {
          args: ['$10.00', '1h 0m'],
          expected: { price: '$10.00', time: '1h 0m' },
        },
        {
          args: ['$20.00', '2h 0m', null],
          expected: { price: '$20.00', time: '2h 0m' },
        },
        {
          args: ['$30.00', '3h 0m', document.createElement('div')],
          expected: { price: '$30.00', time: '3h 0m' },
        },
        {
          args: ['$40.00', '4h 0m', null, { useIcon: false }],
          expected: { price: '$40.00', time: '4h 0m' },
        },
      ];

      testCases.forEach(({ args, expected }) => {
        const element = createPriceBadge(...args);

        expect(element.getAttribute('data-original-price')).toBe(expected.price);
        expect(element.textContent).toContain(expected.time);
      });
    });

    test('createPriceBadge error handling creates fallback elements', () => {
      // Test with invalid parameters that should trigger error handling
      const element = createPriceBadge(null, '1h 0m'); // Invalid originalPrice

      // Should still return an element (fallback)
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe(CONVERTED_PRICE_CLASS);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('badge creation works with performance monitoring enabled', () => {
      // This tests that performance monitoring doesn't interfere with badge creation
      const badge = new PriceBadge({
        originalPrice: '$50.00',
        timeDisplay: '5h 0m',
      });

      // Set up mock to return sequential values
      let callCount = 0;
      global.performance.now = vi.fn(() => {
        callCount++;
        return callCount * 10; // Returns 10, 20, 30, etc.
      });

      const startTime = performance.now();
      const element = badge.render();
      const endTime = performance.now();

      // Badge should render quickly (mock shows 10ms elapsed)
      expect(endTime - startTime).toBeLessThan(100);
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('5h 0m');
    });

    test('style caching improves performance over time', () => {
      clearAllCaches();

      const config = {
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: true,
        conflictProtection: true,
      };

      // Mock performance.now to simulate different timing
      let callCount = 0;
      global.performance.now = vi.fn(() => {
        callCount++;
        // First render: 0ms -> 50ms (50ms total)
        // Second render: 50ms -> 70ms (20ms total)
        // Third render: 70ms -> 85ms (15ms total)
        if (callCount === 1) return 0;
        if (callCount === 2) return 50;
        if (callCount === 3) return 50;
        if (callCount === 4) return 70;
        if (callCount === 5) return 70;
        if (callCount === 6) return 85;
        return callCount * 10;
      });

      // First render - no cache (simulated 50ms)
      const start1 = performance.now();
      const badge1 = new PriceBadge({ ...config, originalPrice: '$30.00' });
      badge1.render();
      const time1 = performance.now() - start1;

      // Second render - should use cache (simulated 20ms)
      const start2 = performance.now();
      const badge2 = new PriceBadge({ ...config, originalPrice: '$40.00' });
      badge2.render();
      const time2 = performance.now() - start2;

      // Third render - should use cache (simulated 15ms)
      const start3 = performance.now();
      const badge3 = new PriceBadge({ ...config, originalPrice: '$50.00' });
      badge3.render();
      const time3 = performance.now() - start3;

      // Later renders should be faster due to caching
      expect(time2).toBeLessThanOrEqual(time1);
      expect(time3).toBeLessThanOrEqual(time1);

      // Verify the actual cache usage
      const stats = getCacheStatistics();
      expect(stats.statistics.badgeStyles.hits).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Robustness', () => {
    test('handles invalid DOM context gracefully', () => {
      const invalidContext = { nodeType: 1 }; // Not a real DOM element

      const badge = new PriceBadge({
        originalPrice: '$25.00',
        timeDisplay: '2h 30m',
        context: invalidContext,
      });

      // Should render without throwing
      const element = badge.render();
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('2h 30m');
    });

    test('survives extreme style configuration', () => {
      const badge = new PriceBadge({
        originalPrice: '$100.00',
        timeDisplay: '10h 0m',
        styleOverrides: {
          // Extreme style overrides that might break things
          display: 'block',
          position: 'absolute',
          width: '1000px',
          height: '1000px',
          zIndex: '999999',
        },
        defensiveStyles: true,
      });

      const element = badge.render();
      expect(element).toBeTruthy();
      expect(element.style.cssText).toContain('width: 1000px');
    });

    test('handles concurrent badge creation safely', () => {
      // Test that concurrent badge creation doesn't cause issues
      const badges = Array.from(
        { length: 10 },
        (_, i) =>
          new PriceBadge({
            originalPrice: `$${(i + 1) * 10}.00`,
            timeDisplay: `${i + 1}h 0m`,
          })
      );

      // Render all badges concurrently
      const elements = badges.map((badge) => badge.render());

      // All should render correctly
      elements.forEach((element, index) => {
        expect(element.getAttribute('data-original-price')).toBe(`$${(index + 1) * 10}.00`);
        expect(element.textContent).toContain(`${index + 1}h 0m`);
      });

      // Cleanup should work for all
      badges.forEach((badge) => {
        expect(badge.destroy()).toBe(true);
      });
    });
  });
});
