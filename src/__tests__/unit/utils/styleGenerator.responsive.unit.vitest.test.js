/**
 * Tests for responsive functionality in styleGenerator
 * Focuses on responsive value calculation and style generation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  getResponsiveValue,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveIconSize,
  generateBadgeStyles,
  generateIconStyles,
  createStyleContext,
} from '../../../utils/styleGenerator.js';
import { clearAllCaches } from '../../../utils/styleCache.js';

describe('StyleGenerator Responsive Functionality', () => {
  let mockElement;

  beforeEach(() => {
    // Clear caches before each test
    clearAllCaches();

    mockElement = {
      parentElement: null,
      style: {},
      tagName: 'DIV',
      className: '',
      id: '',
    };

    // Mock window for tests
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
      getComputedStyle: vi.fn().mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      }),
    };
  });

  afterEach(() => {
    clearAllCaches();
    vi.restoreAllMocks();
  });

  describe('getResponsiveValue', () => {
    test('returns desktop value for desktop context', () => {
      const responsiveScale = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        desktop: 'desktop-value',
      };

      const result = getResponsiveValue(responsiveScale, 'desktop');
      expect(result).toBe('desktop-value');
    });

    test('returns mobile value for mobile context', () => {
      const responsiveScale = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        desktop: 'desktop-value',
      };

      const result = getResponsiveValue(responsiveScale, 'mobile');
      expect(result).toBe('mobile-value');
    });

    test('falls back to desktop value when device type missing', () => {
      const responsiveScale = {
        desktop: 'desktop-value',
      };

      const result = getResponsiveValue(responsiveScale, 'mobile');
      expect(result).toBe('desktop-value');
    });

    test('returns original value when not a responsive scale', () => {
      const nonResponsiveValue = 'simple-value';
      const result = getResponsiveValue(nonResponsiveValue, 'mobile');
      expect(result).toBe('simple-value');
    });

    test('auto-detects device type from viewport', () => {
      global.window.innerWidth = 375; // Mobile width

      const responsiveScale = {
        mobile: 'mobile-value',
        desktop: 'desktop-value',
      };

      const result = getResponsiveValue(responsiveScale);
      expect(result).toBe('mobile-value');
    });
  });

  describe('getResponsiveFontSize', () => {
    test('returns mobile font size for mobile device', () => {
      const result = getResponsiveFontSize('sm', 'mobile');
      expect(result).toBe('0.75rem'); // Mobile sm size
    });

    test('returns tablet font size for tablet device', () => {
      const result = getResponsiveFontSize('sm', 'tablet');
      expect(result).toBe('0.8125rem'); // Tablet sm size
    });

    test('returns desktop font size for desktop device', () => {
      const result = getResponsiveFontSize('sm', 'desktop');
      expect(result).toBe('0.875rem'); // Desktop sm size
    });

    test('falls back to standard sizes when responsive size missing', () => {
      const result = getResponsiveFontSize('xl', 'mobile');
      expect(result).toBe('1.125rem'); // Mobile xl size
    });

    test('auto-detects device type when not provided', () => {
      global.window.innerWidth = 375; // Mobile width

      const result = getResponsiveFontSize('sm');
      expect(result).toBe('0.75rem'); // Should use mobile size
    });

    test('handles invalid size key gracefully', () => {
      const result = getResponsiveFontSize('invalid', 'desktop');
      expect(result).toBe('0.875rem'); // Should fall back to sm size
    });
  });

  describe('getResponsiveSpacing', () => {
    test('returns mobile spacing for mobile device', () => {
      const result = getResponsiveSpacing(2, 'mobile');
      expect(result).toBe('0.375rem'); // Mobile spacing[2]
    });

    test('returns desktop spacing for desktop device', () => {
      const result = getResponsiveSpacing(2, 'desktop');
      expect(result).toBe('0.5rem'); // Desktop spacing[2]
    });

    test('handles numeric and string keys', () => {
      const numericResult = getResponsiveSpacing(1, 'mobile');
      const stringResult = getResponsiveSpacing('1', 'mobile');

      expect(numericResult).toBe('0.1875rem');
      expect(stringResult).toBe('0.1875rem');
    });

    test('auto-detects device type when not provided', () => {
      // Set tablet-like window size
      global.window.innerWidth = 768;
      global.window.innerHeight = 1024;

      const result = getResponsiveSpacing(2);
      expect(result).toBe('0.4375rem'); // Should use tablet spacing
    });
  });

  describe('getResponsiveIconSize', () => {
    test('returns mobile icon size for mobile device', () => {
      const result = getResponsiveIconSize('sm', 'mobile');
      expect(result).toBe('0.75rem'); // Mobile sm icon size
    });

    test('returns desktop icon size for desktop device', () => {
      const result = getResponsiveIconSize('sm', 'desktop');
      expect(result).toBe('1rem'); // Desktop sm icon size
    });

    test('falls back to standard icon sizes', () => {
      const result = getResponsiveIconSize('lg', 'desktop');
      expect(result).toBe('1.5rem'); // Desktop lg icon size
    });

    test('auto-detects device type when not provided', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const result = getResponsiveIconSize('xs');
      expect(result).toBe('0.625rem'); // Should use mobile xs size
    });
  });

  describe('generateBadgeStyles with responsive', () => {
    test('applies responsive sizing when enabled', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const styles = generateBadgeStyles({
        context: mockElement,
        responsive: true,
      });

      expect(styles).toContain('font-size: 0.75rem'); // Mobile sm font size
      expect(styles).toContain('padding: 0.1875rem 0.375rem'); // Mobile spacing
    });

    test('uses standard sizing when responsive disabled', () => {
      const styles = generateBadgeStyles({
        context: mockElement,
        responsive: false,
      });

      expect(styles).toContain('font-size: 0.875rem'); // Standard sm font size
      expect(styles).toContain('padding: 0.25rem 0.5rem'); // Standard spacing
    });

    test('applies forced device type', () => {
      const styles = generateBadgeStyles({
        context: mockElement,
        responsive: true,
        deviceType: 'tablet',
      });

      expect(styles).toContain('font-size: 0.8125rem'); // Tablet sm font size
      expect(styles).toContain('padding: 0.21875rem 0.4375rem'); // Tablet spacing
    });

    test('responsive is enabled by default', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const styles = generateBadgeStyles({
        context: mockElement,
      });

      // Should use mobile responsive sizes by default
      expect(styles).toContain('font-size: 0.75rem');
    });
  });

  describe('generateIconStyles with responsive', () => {
    test('applies responsive sizing when enabled', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const styles = generateIconStyles({
        size: 'sm',
        responsive: true,
      });

      expect(styles).toContain('width: 0.75rem'); // Mobile sm icon size
      expect(styles).toContain('height: 0.75rem');
      expect(styles).toContain('margin-right: 0.1875rem'); // Mobile spacing[1]
    });

    test('uses standard sizing when responsive disabled', () => {
      const styles = generateIconStyles({
        size: 'sm',
        responsive: false,
      });

      expect(styles).toContain('width: 1rem'); // Standard sm icon size
      expect(styles).toContain('height: 1rem');
      expect(styles).toContain('margin-right: 0.25rem'); // Standard spacing[1]
    });

    test('applies forced device type', () => {
      const styles = generateIconStyles({
        size: 'sm',
        responsive: true,
        deviceType: 'tablet',
      });

      expect(styles).toContain('width: 0.875rem'); // Tablet sm icon size
      expect(styles).toContain('margin-right: 0.21875rem'); // Tablet spacing[1]
    });

    test('responsive is enabled by default', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const styles = generateIconStyles({
        size: 'xs',
      });

      // Should use mobile responsive sizes by default
      expect(styles).toContain('width: 0.625rem'); // Mobile xs icon size
    });
  });

  describe('createStyleContext with responsive', () => {
    test('includes responsive context by default', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const context = createStyleContext(mockElement);

      expect(context.responsive).toBeTruthy();
      expect(context.getDeviceType()).toBe('mobile');
      expect(context.isMobile()).toBe(true);
      expect(context.isDesktop()).toBe(false);
    });

    test('provides responsive utility functions', () => {
      // Set tablet window size
      global.window.innerWidth = 768;
      global.window.innerHeight = 1024;

      const context = createStyleContext(mockElement);

      expect(context.getFontSize('sm')).toBe('0.8125rem'); // Tablet sm
      expect(context.getSpacing(2)).toBe('0.4375rem'); // Tablet spacing[2]
      expect(context.getIconSize('xs')).toBe('0.6875rem'); // Tablet xs
    });

    test('can disable responsive features', () => {
      const context = createStyleContext(mockElement, { responsive: false });

      expect(context.responsive).toBeNull();
      expect(context.getDeviceType()).toBe('desktop'); // Fallback
      expect(context.getFontSize('sm')).toBe('0.875rem'); // Standard size
    });

    test('generated style functions use responsive context', () => {
      // Set mobile window size
      global.window.innerWidth = 375;
      global.window.innerHeight = 667;

      const context = createStyleContext(mockElement);
      const badgeStyles = context.generateBadgeStyles();

      expect(badgeStyles).toContain('font-size: 0.75rem'); // Mobile sizing
    });

    test('handles errors gracefully in responsive mode', () => {
      // Test by setting an invalid window configuration
      const originalWindow = global.window;
      global.window = null;

      const context = createStyleContext(mockElement);

      expect(context.getDeviceType()).toBe('desktop'); // Fallback
      expect(context.getFontSize('sm')).toBe('0.875rem'); // Standard fallback

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Cross-device consistency', () => {
    test('maintains proportional relationships across devices', () => {
      const mobileXs = getResponsiveFontSize('xs', 'mobile');
      const mobileSm = getResponsiveFontSize('sm', 'mobile');
      const mobileBase = getResponsiveFontSize('base', 'mobile');

      const desktopXs = getResponsiveFontSize('xs', 'desktop');
      const desktopSm = getResponsiveFontSize('sm', 'desktop');
      const desktopBase = getResponsiveFontSize('base', 'desktop');

      // Parse rem values to numbers for comparison
      const parseRem = (value) => parseFloat(value.replace('rem', ''));

      const mobileRatio1 = parseRem(mobileSm) / parseRem(mobileXs);
      const mobileRatio2 = parseRem(mobileBase) / parseRem(mobileSm);

      const desktopRatio1 = parseRem(desktopSm) / parseRem(desktopXs);
      const desktopRatio2 = parseRem(desktopBase) / parseRem(desktopSm);

      // Ratios should be approximately the same across devices
      expect(Math.abs(mobileRatio1 - desktopRatio1)).toBeLessThan(0.1);
      expect(Math.abs(mobileRatio2 - desktopRatio2)).toBeLessThan(0.1);
    });

    test('mobile sizes are consistently smaller than desktop', () => {
      const sizes = ['xs', 'sm', 'base', 'lg'];

      sizes.forEach((size) => {
        const mobileSize = parseFloat(getResponsiveFontSize(size, 'mobile').replace('rem', ''));
        const desktopSize = parseFloat(getResponsiveFontSize(size, 'desktop').replace('rem', ''));

        expect(mobileSize).toBeLessThan(desktopSize);
      });
    });

    test('tablet sizes are between mobile and desktop', () => {
      const sizes = ['xs', 'sm', 'base', 'lg'];

      sizes.forEach((size) => {
        const mobileSize = parseFloat(getResponsiveFontSize(size, 'mobile').replace('rem', ''));
        const tabletSize = parseFloat(getResponsiveFontSize(size, 'tablet').replace('rem', ''));
        const desktopSize = parseFloat(getResponsiveFontSize(size, 'desktop').replace('rem', ''));

        expect(tabletSize).toBeGreaterThan(mobileSize);
        expect(tabletSize).toBeLessThan(desktopSize);
      });
    });
  });
});
