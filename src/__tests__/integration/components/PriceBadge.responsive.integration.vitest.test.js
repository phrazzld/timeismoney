/**
 * Integration tests for PriceBadge responsive design functionality
 * Tests end-to-end responsive behavior across different viewport sizes
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';

// Mock the viewport detector before importing components
vi.mock('../../../utils/viewportDetector.js', () => ({
  createResponsiveContext: vi.fn(),
}));

import { PriceBadge, createPriceBadge } from '../../../components/PriceBadge.js';
import { createResponsiveContext } from '../../../utils/viewportDetector.js';

describe('PriceBadge Responsive Integration', () => {
  let mockGetComputedStyle;

  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';

    // Mock getComputedStyle for theme detection
    mockGetComputedStyle = vi.fn().mockReturnValue({
      backgroundColor: 'rgb(255, 255, 255)',
    });
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });

    // Default to desktop context
    createResponsiveContext.mockReturnValue({
      deviceType: 'desktop',
      width: 1024,
      height: 768,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });
  });

  afterEach(() => {
    // Clean up any remaining elements
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Mobile Responsive Behavior', () => {
    beforeEach(() => {
      // Mock mobile viewport
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    test('creates smaller badge on mobile devices', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should use mobile font size (0.75rem instead of 0.875rem)
      expect(styles).toContain('font-size: 0.75rem');

      // Should use mobile padding (reduced spacing)
      expect(styles).toContain('padding: 0.1875rem 0.375rem');
    });

    test('creates smaller icon on mobile devices', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
        iconSize: 'sm',
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeTruthy();
      const svgStyles = svg.style.cssText;

      // Should use mobile icon size (0.75rem instead of 1rem for 'sm')
      expect(svgStyles).toContain('width: 0.75rem');
      expect(svgStyles).toContain('height: 0.75rem');

      // Should use mobile margin spacing
      expect(svgStyles).toContain('margin-right: 0.1875rem');
    });

    test('factory function works with mobile responsive sizing', () => {
      const element = createPriceBadge('$50.00', '5h 0m');

      expect(element).toBeTruthy();
      const styles = element.style.cssText;

      expect(styles).toContain('font-size: 0.75rem'); // Mobile size
      expect(element.textContent).toContain('5h 0m');
    });

    test('responsive can be disabled for mobile', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: false, // Disable responsive behavior
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should use standard desktop sizes even on mobile
      expect(styles).toContain('font-size: 0.875rem'); // Desktop size
      expect(styles).toContain('padding: 0.25rem 0.5rem'); // Desktop padding
    });
  });

  describe('Tablet Responsive Behavior', () => {
    beforeEach(() => {
      // Mock tablet viewport
      createResponsiveContext.mockReturnValue({
        deviceType: 'tablet',
        width: 768,
        height: 1024,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    test('creates medium-sized badge on tablet devices', () => {
      const badge = new PriceBadge({
        originalPrice: '$100.00',
        timeDisplay: '10h 0m',
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should use tablet font size (between mobile and desktop)
      expect(styles).toContain('font-size: 0.8125rem');

      // Should use tablet padding
      expect(styles).toContain('padding: 0.21875rem 0.4375rem');
    });

    test('creates appropriately sized icon on tablet', () => {
      const badge = new PriceBadge({
        originalPrice: '$75.00',
        timeDisplay: '7h 30m',
        useIcon: true,
        iconSize: 'xs',
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgStyles = svg.style.cssText;

      // Should use tablet icon size
      expect(svgStyles).toContain('width: 0.6875rem');
      expect(svgStyles).toContain('height: 0.6875rem');
    });
  });

  describe('Desktop Responsive Behavior', () => {
    beforeEach(() => {
      // Mock desktop viewport (already default, but explicit)
      createResponsiveContext.mockReturnValue({
        deviceType: 'desktop',
        width: 1440,
        height: 900,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    test('creates full-sized badge on desktop devices', () => {
      const badge = new PriceBadge({
        originalPrice: '$200.00',
        timeDisplay: '20h 0m',
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should use desktop font size
      expect(styles).toContain('font-size: 0.875rem');

      // Should use desktop padding
      expect(styles).toContain('padding: 0.25rem 0.5rem');
    });

    test('creates full-sized icon on desktop', () => {
      const badge = new PriceBadge({
        originalPrice: '$150.00',
        timeDisplay: '15h 0m',
        useIcon: true,
        iconSize: 'sm',
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgStyles = svg.style.cssText;

      // Should use desktop icon size
      expect(svgStyles).toContain('width: 1rem');
      expect(svgStyles).toContain('height: 1rem');
    });
  });

  describe('Responsive Update Behavior', () => {
    test('re-applies responsive sizing when updated', () => {
      // Start with desktop
      createResponsiveContext.mockReturnValue({
        deviceType: 'desktop',
        width: 1440,
        height: 900,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();

      // Should start with desktop sizing
      expect(element.style.cssText).toContain('font-size: 0.875rem');

      // Simulate viewport change to mobile
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });

      // Update the badge - should re-evaluate responsive context
      badge.update({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      // Should now use mobile sizing
      expect(element.style.cssText).toContain('font-size: 0.75rem');
    });

    test('maintains responsive setting when updating other properties', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: true,
      });

      const element = badge.render();

      // Update with different content but same responsive setting
      badge.update({
        originalPrice: '$50.00',
        timeDisplay: '5h 0m',
      });

      // Should still use mobile responsive sizing
      expect(element.style.cssText).toContain('font-size: 0.75rem');
    });

    test('can change responsive setting during update', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: true,
      });

      const element = badge.render();

      // Should start with mobile responsive sizing
      expect(element.style.cssText).toContain('font-size: 0.75rem');

      // Update to disable responsive behavior
      badge.update({
        responsive: false,
      });

      // Should now use standard desktop sizing
      expect(element.style.cssText).toContain('font-size: 0.875rem');
    });
  });

  describe('Cross-Device Proportional Scaling', () => {
    test('icon scales proportionally with text across devices', () => {
      const deviceTypes = ['mobile', 'tablet', 'desktop'];
      const results = {};

      deviceTypes.forEach((deviceType) => {
        createResponsiveContext.mockReturnValue({
          deviceType,
          isMobile: deviceType === 'mobile',
          isTablet: deviceType === 'tablet',
          isDesktop: deviceType === 'desktop',
        });

        const badge = new PriceBadge({
          originalPrice: '$30.00',
          timeDisplay: '3h 0m',
          useIcon: true,
          iconSize: 'xs',
        });

        const element = badge.render();
        const svg = element.querySelector('svg');

        const textSize = parseFloat(element.style.fontSize.replace('rem', ''));
        const iconSize = parseFloat(svg.style.width.replace('rem', ''));

        results[deviceType] = {
          textSize,
          iconSize,
          ratio: iconSize / textSize,
        };
      });

      // Icon-to-text ratios should be similar across devices
      const mobileRatio = results.mobile.ratio;
      const tabletRatio = results.tablet.ratio;
      const desktopRatio = results.desktop.ratio;

      expect(Math.abs(mobileRatio - tabletRatio)).toBeLessThan(0.1);
      expect(Math.abs(tabletRatio - desktopRatio)).toBeLessThan(0.1);
    });

    test('maintains visual hierarchy across device sizes', () => {
      const iconSizes = ['xs', 'sm', 'base'];
      const deviceTypes = ['mobile', 'desktop'];

      deviceTypes.forEach((deviceType) => {
        createResponsiveContext.mockReturnValue({
          deviceType,
        });

        const sizes = iconSizes.map((iconSize) => {
          const badge = new PriceBadge({
            originalPrice: '$30.00',
            timeDisplay: '3h 0m',
            useIcon: true,
            iconSize,
          });

          const element = badge.render();
          const svg = element.querySelector('svg');
          return parseFloat(svg.style.width.replace('rem', ''));
        });

        // Sizes should be in ascending order
        expect(sizes[0]).toBeLessThan(sizes[1]); // xs < sm
        expect(sizes[1]).toBeLessThan(sizes[2]); // sm < base
      });
    });
  });

  describe('Responsive Error Handling', () => {
    test('handles viewport detector errors gracefully', () => {
      createResponsiveContext.mockImplementation(() => {
        throw new Error('Viewport detection failed');
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: true,
      });

      const element = badge.render();

      // Should still create a working badge with fallback sizing
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('3h 0m');
      expect(element.getAttribute('data-original-price')).toBe('$30.00');
    });

    test('handles missing responsive constants gracefully', () => {
      // Mock incomplete responsive context
      createResponsiveContext.mockReturnValue({
        deviceType: 'unknown-device',
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();

      // Should fall back to standard sizes
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('3h 0m');
    });
  });

  describe('Real-world Responsive Scenarios', () => {
    test('works correctly on small mobile screens', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
        width: 320, // Very small mobile
        height: 568,
        isMobile: true,
        isSmallMobile: true,
      });

      const badge = new PriceBadge({
        originalPrice: '$19.99',
        timeDisplay: '2h 0m',
      });

      const element = badge.render();

      // Should use mobile sizing for very small screens
      expect(element.style.cssText).toContain('font-size: 0.75rem');
      expect(element.textContent).toContain('2h 0m');
    });

    test('works correctly on large mobile screens', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'mobile',
        width: 414, // Large mobile (iPhone Plus)
        height: 736,
        isMobile: true,
        isLargeMobile: true,
      });

      const element = createPriceBadge('$99.99', '10h 0m');

      // Should still use mobile sizing even on large mobile
      expect(element.style.cssText).toContain('font-size: 0.75rem');
    });

    test('works correctly on iPad-sized tablets', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'tablet',
        width: 768,
        height: 1024,
        isTablet: true,
      });

      const element = createPriceBadge('$149.99', '15h 0m');

      // Should use tablet sizing
      expect(element.style.cssText).toContain('font-size: 0.8125rem');
    });

    test('works correctly on large desktop monitors', () => {
      createResponsiveContext.mockReturnValue({
        deviceType: 'desktop',
        width: 2560, // Large monitor
        height: 1440,
        isDesktop: true,
      });

      const element = createPriceBadge('$299.99', '30h 0m');

      // Should use desktop sizing even on very large screens
      expect(element.style.cssText).toContain('font-size: 0.875rem');
    });
  });
});
