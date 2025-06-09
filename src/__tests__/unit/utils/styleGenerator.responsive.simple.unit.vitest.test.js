/**
 * Simplified tests for responsive functionality in styleGenerator
 * Focuses on core responsive value calculation without complex mocking
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  getResponsiveValue,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveIconSize,
} from '../../../utils/styleGenerator.js';

describe('StyleGenerator Responsive Core Functions', () => {
  beforeEach(() => {
    // Mock window for consistent testing
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getResponsiveValue', () => {
    test('returns correct value for each device type', () => {
      const responsiveScale = {
        mobile: 'mobile-value',
        tablet: 'tablet-value',
        desktop: 'desktop-value',
      };

      expect(getResponsiveValue(responsiveScale, 'mobile')).toBe('mobile-value');
      expect(getResponsiveValue(responsiveScale, 'tablet')).toBe('tablet-value');
      expect(getResponsiveValue(responsiveScale, 'desktop')).toBe('desktop-value');
    });

    test('falls back to desktop when device type missing', () => {
      const responsiveScale = {
        desktop: 'desktop-value',
      };

      expect(getResponsiveValue(responsiveScale, 'mobile')).toBe('desktop-value');
    });

    test('returns original value when not responsive', () => {
      const simpleValue = 'simple-value';
      expect(getResponsiveValue(simpleValue, 'mobile')).toBe('simple-value');
    });
  });

  describe('getResponsiveFontSize', () => {
    test('returns mobile font sizes', () => {
      expect(getResponsiveFontSize('xs', 'mobile')).toBe('0.6875rem');
      expect(getResponsiveFontSize('sm', 'mobile')).toBe('0.75rem');
      expect(getResponsiveFontSize('base', 'mobile')).toBe('0.875rem');
    });

    test('returns tablet font sizes', () => {
      expect(getResponsiveFontSize('xs', 'tablet')).toBe('0.75rem');
      expect(getResponsiveFontSize('sm', 'tablet')).toBe('0.8125rem');
      expect(getResponsiveFontSize('base', 'tablet')).toBe('0.9375rem');
    });

    test('returns desktop font sizes', () => {
      expect(getResponsiveFontSize('xs', 'desktop')).toBe('0.75rem');
      expect(getResponsiveFontSize('sm', 'desktop')).toBe('0.875rem');
      expect(getResponsiveFontSize('base', 'desktop')).toBe('1rem');
    });

    test('mobile sizes are smaller than desktop', () => {
      const mobileSize = parseFloat(getResponsiveFontSize('sm', 'mobile').replace('rem', ''));
      const desktopSize = parseFloat(getResponsiveFontSize('sm', 'desktop').replace('rem', ''));

      expect(mobileSize).toBeLessThan(desktopSize);
    });
  });

  describe('getResponsiveSpacing', () => {
    test('returns mobile spacing values', () => {
      expect(getResponsiveSpacing(1, 'mobile')).toBe('0.1875rem');
      expect(getResponsiveSpacing(2, 'mobile')).toBe('0.375rem');
      expect(getResponsiveSpacing(4, 'mobile')).toBe('0.75rem');
    });

    test('returns desktop spacing values', () => {
      expect(getResponsiveSpacing(1, 'desktop')).toBe('0.25rem');
      expect(getResponsiveSpacing(2, 'desktop')).toBe('0.5rem');
      expect(getResponsiveSpacing(4, 'desktop')).toBe('1rem');
    });

    test('mobile spacing is smaller than desktop', () => {
      const mobileSpacing = parseFloat(getResponsiveSpacing(2, 'mobile').replace('rem', ''));
      const desktopSpacing = parseFloat(getResponsiveSpacing(2, 'desktop').replace('rem', ''));

      expect(mobileSpacing).toBeLessThan(desktopSpacing);
    });
  });

  describe('getResponsiveIconSize', () => {
    test('returns mobile icon sizes', () => {
      expect(getResponsiveIconSize('xs', 'mobile')).toBe('0.625rem');
      expect(getResponsiveIconSize('sm', 'mobile')).toBe('0.75rem');
      expect(getResponsiveIconSize('base', 'mobile')).toBe('0.875rem');
    });

    test('returns desktop icon sizes', () => {
      expect(getResponsiveIconSize('xs', 'desktop')).toBe('0.75rem');
      expect(getResponsiveIconSize('sm', 'desktop')).toBe('1rem');
      expect(getResponsiveIconSize('base', 'desktop')).toBe('1.25rem');
    });

    test('mobile icons are smaller than desktop', () => {
      const mobileIcon = parseFloat(getResponsiveIconSize('sm', 'mobile').replace('rem', ''));
      const desktopIcon = parseFloat(getResponsiveIconSize('sm', 'desktop').replace('rem', ''));

      expect(mobileIcon).toBeLessThan(desktopIcon);
    });
  });

  describe('Proportional scaling', () => {
    test('maintains proportional relationships across devices', () => {
      const deviceTypes = ['mobile', 'tablet', 'desktop'];
      const sizes = ['xs', 'sm', 'base'];

      deviceTypes.forEach((deviceType) => {
        const fontSizes = sizes.map((size) =>
          parseFloat(getResponsiveFontSize(size, deviceType).replace('rem', ''))
        );

        // Each size should be larger than the previous
        expect(fontSizes[1]).toBeGreaterThan(fontSizes[0]); // sm > xs
        expect(fontSizes[2]).toBeGreaterThan(fontSizes[1]); // base > sm
      });
    });

    test('tablet sizes are between mobile and desktop', () => {
      const sizes = ['xs', 'sm', 'base'];

      sizes.forEach((size) => {
        const mobile = parseFloat(getResponsiveFontSize(size, 'mobile').replace('rem', ''));
        const tablet = parseFloat(getResponsiveFontSize(size, 'tablet').replace('rem', ''));
        const desktop = parseFloat(getResponsiveFontSize(size, 'desktop').replace('rem', ''));

        expect(tablet).toBeGreaterThan(mobile);
        expect(tablet).toBeLessThan(desktop);
      });
    });
  });

  describe('Viewport auto-detection', () => {
    test('detects mobile viewport', () => {
      global.window.innerWidth = 375; // Mobile

      const fontSize = getResponsiveFontSize('sm');
      expect(fontSize).toBe('0.75rem'); // Should use mobile size
    });

    test('detects tablet viewport', () => {
      global.window.innerWidth = 768; // Tablet

      const fontSize = getResponsiveFontSize('sm');
      expect(fontSize).toBe('0.8125rem'); // Should use tablet size
    });

    test('detects desktop viewport', () => {
      global.window.innerWidth = 1200; // Desktop

      const fontSize = getResponsiveFontSize('sm');
      expect(fontSize).toBe('0.875rem'); // Should use desktop size
    });
  });

  describe('Error handling', () => {
    test('handles invalid device types gracefully', () => {
      const fontSize = getResponsiveFontSize('sm', 'invalid-device');
      expect(fontSize).toBe('0.875rem'); // Should fall back to default
    });

    test('handles invalid size keys gracefully', () => {
      const fontSize = getResponsiveFontSize('invalid-size', 'mobile');
      expect(fontSize).toBe('0.75rem'); // Should fall back to sm
    });

    test('handles missing window object', () => {
      const originalWindow = global.window;
      global.window = undefined;

      const fontSize = getResponsiveFontSize('sm');
      expect(fontSize).toBe('0.875rem'); // Should fall back to desktop

      global.window = originalWindow;
    });
  });
});
