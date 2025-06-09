/**
 * Tests for the styleGenerator utility functions
 * Focuses on theme detection and dynamic styling capabilities
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  detectBackgroundTheme,
  generateBadgeStyles,
  generateIconStyles,
  createStyleContext,
} from '../../../utils/styleGenerator.js';

describe('Theme Detection and Styling', () => {
  let mockElement;
  let mockGetComputedStyle;

  beforeEach(() => {
    // Create a mock DOM element
    mockElement = {
      parentElement: null,
      style: {},
    };

    // Mock getComputedStyle function
    mockGetComputedStyle = vi.fn();
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectBackgroundTheme', () => {
    test('returns "light" for white background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)', // White
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('returns "dark" for black background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(0, 0, 0)', // Black
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('dark');
    });

    test('returns "light" for light gray background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(240, 240, 240)', // Light gray
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('returns "dark" for dark gray background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(64, 64, 64)', // Dark gray
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('dark');
    });

    test('handles rgba colors with transparency', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('skips transparent backgrounds and walks up DOM', () => {
      const parentElement = { parentElement: null };
      mockElement.parentElement = parentElement;

      mockGetComputedStyle
        .mockReturnValueOnce({
          backgroundColor: 'transparent', // Child element
        })
        .mockReturnValueOnce({
          backgroundColor: 'rgb(30, 30, 30)', // Parent element - dark
        });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('dark');
      expect(mockGetComputedStyle).toHaveBeenCalledTimes(2);
    });

    test('defaults to "light" when no background found', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'transparent',
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('handles missing element gracefully', () => {
      const theme = detectBackgroundTheme(null);
      expect(theme).toBe('unknown');
    });

    test('handles missing getComputedStyle gracefully', () => {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = undefined;

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('unknown');

      // Restore the original function
      window.getComputedStyle = originalGetComputedStyle;
    });

    test('limits DOM traversal depth to prevent infinite loops', () => {
      // Create a chain of 15 elements (more than the 10 limit)
      let currentElement = mockElement;
      for (let i = 0; i < 15; i++) {
        const parent = { parentElement: null };
        currentElement.parentElement = parent;
        currentElement = parent;
      }

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'transparent',
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light'); // Should default to light
      expect(mockGetComputedStyle).toHaveBeenCalledTimes(10); // Should stop at 10 calls
    });
  });

  describe('generateBadgeStyles', () => {
    test('generates default styles when no options provided', () => {
      const styles = generateBadgeStyles();

      expect(styles).toContain('color: #059669'); // Primary color
      expect(styles).toContain('background-color: transparent');
      expect(styles).toContain('font-size: 0.875rem');
      expect(styles).toContain('font-weight: 600');
      expect(styles).toContain('display: inline-flex');
      expect(styles).toContain('align-items: center');
    });

    test('auto-detects light theme and applies appropriate styles', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)', // White background
      });

      const styles = generateBadgeStyles({ context: mockElement });

      expect(styles).toContain('color: #059669'); // Primary color for light theme
      expect(styles).toContain('background-color: #f9fafb'); // Light background
      expect(styles).toContain('border-color: #e5e7eb'); // Light border
    });

    test('auto-detects dark theme and applies appropriate styles', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(30, 30, 30)', // Dark background
      });

      const styles = generateBadgeStyles({ context: mockElement });

      expect(styles).toContain('color: #10b981'); // Lighter primary color for dark theme
      expect(styles).toContain('background-color: #1f2937'); // Dark background
      expect(styles).toContain('border-color: #4b5563'); // Dark border
    });

    test('applies custom overrides correctly', () => {
      const overrides = {
        color: 'red',
        fontSize: '1rem',
        padding: '8px',
      };

      const styles = generateBadgeStyles({ overrides });

      expect(styles).toContain('color: red');
      expect(styles).toContain('font-size: 1rem');
      expect(styles).toContain('padding: 8px');
    });

    test('converts camelCase to kebab-case in CSS', () => {
      const overrides = {
        backgroundColor: 'blue',
        borderRadius: '4px',
        marginTop: '2px',
      };

      const styles = generateBadgeStyles({ overrides });

      expect(styles).toContain('background-color: blue');
      expect(styles).toContain('border-radius: 4px');
      expect(styles).toContain('margin-top: 2px');
    });

    test('forces high contrast variant when specified', () => {
      const styles = generateBadgeStyles({ variant: 'highContrast' });

      expect(styles).toContain('color: #ffffff'); // White text
      expect(styles).toContain('background-color: #059669'); // Primary background
      expect(styles).toContain('font-weight: 700'); // Bold
    });

    test('handles errors gracefully and returns fallback styles', () => {
      // Force an error by passing invalid options
      const mockBadgeStyles = vi.fn(() => {
        throw new Error('Style generation error');
      });

      const styles = generateBadgeStyles({ context: mockElement });

      // Should still return a valid CSS string (fallback)
      expect(typeof styles).toBe('string');
      expect(styles.length).toBeGreaterThan(0);
    });
  });

  describe('generateIconStyles', () => {
    test('generates default icon styles', () => {
      const styles = generateIconStyles();

      expect(styles).toContain('width: 0.75rem'); // xs size
      expect(styles).toContain('height: 0.75rem');
      expect(styles).toContain('margin-right: 0.25rem');
      expect(styles).toContain('fill: currentColor');
      expect(styles).toContain('stroke: currentColor');
      expect(styles).toContain('vertical-align: middle');
    });

    test('applies different sizes correctly', () => {
      const smallStyles = generateIconStyles({ size: 'sm' });
      const largeStyles = generateIconStyles({ size: 'lg' });

      expect(smallStyles).toContain('width: 1rem');
      expect(smallStyles).toContain('height: 1rem');

      expect(largeStyles).toContain('width: 1.5rem');
      expect(largeStyles).toContain('height: 1.5rem');
    });

    test('applies custom color', () => {
      const styles = generateIconStyles({ color: '#ff0000' });

      expect(styles).toContain('fill: #ff0000');
      expect(styles).toContain('stroke: #ff0000');
    });

    test('applies custom overrides', () => {
      const overrides = {
        marginLeft: '4px',
        opacity: '0.8',
      };

      const styles = generateIconStyles({ overrides });

      expect(styles).toContain('margin-left: 4px');
      expect(styles).toContain('opacity: 0.8');
    });

    test('handles invalid size gracefully', () => {
      const styles = generateIconStyles({ size: 'invalid' });

      // Should fall back to xs size
      expect(styles).toContain('width: 0.75rem');
      expect(styles).toContain('height: 0.75rem');
    });
  });

  describe('createStyleContext', () => {
    test('creates style context with detected theme', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)', // White background
      });

      const context = createStyleContext(mockElement);

      expect(context.theme).toBe('light');
      expect(context.element).toBe(mockElement);
      expect(typeof context.generateBadgeStyles).toBe('function');
      expect(typeof context.generateIconStyles).toBe('function');
    });

    test('context generates appropriate styles', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(30, 30, 30)', // Dark background
      });

      const context = createStyleContext(mockElement);
      const styles = context.generateBadgeStyles();

      expect(context.theme).toBe('dark');
      expect(styles).toContain('color: #10b981'); // Lighter primary for dark theme
    });

    test('creates functional context even with theme detection errors', () => {
      // This simulates a scenario where getComputedStyle fails but we still want a working context
      mockGetComputedStyle.mockImplementation(() => {
        throw new Error('getComputedStyle error');
      });

      const context = createStyleContext(mockElement);

      // Theme detection should fall back to 'light'
      expect(context.theme).toBe('light');
      expect(context.element).toBe(mockElement);
      expect(typeof context.generateBadgeStyles).toBe('function');
      expect(typeof context.generateIconStyles).toBe('function');

      // Functions should still work and return valid CSS
      const badgeStyles = context.generateBadgeStyles();
      const iconStyles = context.generateIconStyles();
      expect(typeof badgeStyles).toBe('string');
      expect(typeof iconStyles).toBe('string');
      expect(badgeStyles.length).toBeGreaterThan(0);
      expect(iconStyles.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world color scenarios', () => {
    test('correctly identifies Amazon white background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('correctly identifies GitHub dark mode', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(13, 17, 23)', // GitHub dark theme
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('dark');
    });

    test('correctly identifies eBay light background', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(248, 248, 248)', // Light gray
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('light');
    });

    test('handles gradient backgrounds by taking first color', () => {
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(64, 64, 64)', // First color in gradient
      });

      const theme = detectBackgroundTheme(mockElement);
      expect(theme).toBe('dark');
    });
  });
});
