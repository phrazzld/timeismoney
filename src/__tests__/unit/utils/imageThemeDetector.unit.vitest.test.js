/**
 * Unit tests for imageThemeDetector utility
 * Tests advanced theme detection for background images and gradients
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../setup/vitest.setup.js';
import {
  analyzeImageColors,
  parseGradientColors,
  parseColorToRgb,
  calculateLuminance,
  determineThemeFromColors,
  extractImageUrl,
  isGradient,
  detectBackgroundImageTheme,
} from '../../../utils/imageThemeDetector.js';

describe('Image Theme Detector', () => {
  beforeEach(() => {
    resetTestMocks();

    // Clear DOM
    document.body.innerHTML = '';

    // Mock Image constructor for canvas tests
    global.Image = vi.fn(() => ({
      crossOrigin: '',
      onload: null,
      onerror: null,
      src: '',
    }));

    // Mock canvas for image analysis
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]), // White and black pixels
        })),
      })),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas;
      }
      return vi.fn();
    });
  });

  describe('Color Parsing', () => {
    test('parseColorToRgb handles RGB format correctly', () => {
      expect(parseColorToRgb('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0 });
      expect(parseColorToRgb('rgba(100, 150, 200, 0.5)')).toEqual({ r: 100, g: 150, b: 200 });
    });

    test('parseColorToRgb handles hex format correctly', () => {
      expect(parseColorToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
      expect(parseColorToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
    });

    test('parseColorToRgb handles named colors', () => {
      expect(parseColorToRgb('white')).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseColorToRgb('black')).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseColorToRgb('red')).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('parseColorToRgb returns null for invalid colors', () => {
      expect(parseColorToRgb('invalid')).toBeNull();
      expect(parseColorToRgb('')).toBeNull();
      expect(parseColorToRgb(null)).toBeNull();
    });
  });

  describe('Luminance Calculation', () => {
    test('calculateLuminance returns correct values', () => {
      expect(calculateLuminance({ r: 255, g: 255, b: 255 })).toBe(1); // White = max luminance
      expect(calculateLuminance({ r: 0, g: 0, b: 0 })).toBe(0); // Black = min luminance
      expect(calculateLuminance({ r: 128, g: 128, b: 128 })).toBeCloseTo(0.502, 3); // Mid gray
    });

    test('calculateLuminance handles invalid input', () => {
      expect(calculateLuminance(null)).toBe(0.5);
      expect(calculateLuminance({})).toBe(0.5);
      expect(calculateLuminance({ r: 'invalid' })).toBe(0.5);
    });
  });

  describe('Theme Determination', () => {
    test('determineThemeFromColors correctly averages luminance', () => {
      const lightColors = [
        { r: 255, g: 255, b: 255 }, // White
        { r: 200, g: 200, b: 200 }, // Light gray
      ];
      expect(determineThemeFromColors(lightColors)).toBe('light');

      const darkColors = [
        { r: 0, g: 0, b: 0 }, // Black
        { r: 50, g: 50, b: 50 }, // Dark gray
      ];
      expect(determineThemeFromColors(darkColors)).toBe('dark');
    });

    test('determineThemeFromColors handles edge cases', () => {
      expect(determineThemeFromColors([])).toBe('light');
      expect(determineThemeFromColors(null)).toBe('light');
    });
  });

  describe('URL Extraction', () => {
    test('extractImageUrl parses CSS url() values', () => {
      expect(extractImageUrl('url("image.jpg")')).toBe('image.jpg');
      expect(extractImageUrl("url('image.png')")).toBe('image.png');
      expect(extractImageUrl('url(image.gif)')).toBe('image.gif');
      expect(extractImageUrl('url(https://example.com/image.jpg)')).toBe(
        'https://example.com/image.jpg'
      );
    });

    test('extractImageUrl handles invalid values', () => {
      expect(extractImageUrl('none')).toBeNull();
      expect(extractImageUrl('')).toBeNull();
      expect(extractImageUrl('invalid')).toBeNull();
    });
  });

  describe('Gradient Detection', () => {
    test('isGradient detects gradient functions', () => {
      expect(isGradient('linear-gradient(to right, red, blue)')).toBe(true);
      expect(isGradient('radial-gradient(circle, white, black)')).toBe(true);
      expect(isGradient('repeating-linear-gradient(45deg, red, blue)')).toBe(true);
      expect(isGradient('conic-gradient(red, blue)')).toBe(true);
    });

    test('isGradient returns false for non-gradients', () => {
      expect(isGradient('url(image.jpg)')).toBe(false);
      expect(isGradient('none')).toBe(false);
      expect(isGradient('')).toBe(false);
    });
  });

  describe('Gradient Color Parsing', () => {
    test('parseGradientColors extracts colors from gradients', () => {
      const colors = parseGradientColors('linear-gradient(to right, red, rgb(0, 255, 0), #0000ff)');
      expect(colors).toHaveLength(3);
      expect(colors[0]).toEqual({ r: 255, g: 0, b: 0 }); // red
      expect(colors[1]).toEqual({ r: 0, g: 255, b: 0 }); // green
      expect(colors[2]).toEqual({ r: 0, g: 0, b: 255 }); // blue
    });

    test('parseGradientColors handles complex gradients', () => {
      const colors = parseGradientColors(
        'radial-gradient(circle, rgba(255,255,255,0.8), black 50%)'
      );
      expect(colors.length).toBeGreaterThan(0);
    });

    test('parseGradientColors handles invalid gradients', () => {
      expect(parseGradientColors('invalid')).toEqual([]);
      expect(parseGradientColors('')).toEqual([]);
    });
  });

  describe('Image Analysis', () => {
    test('analyzeImageColors handles successful image loading', async () => {
      // Mock successful image loading
      const mockImg = {
        crossOrigin: '',
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImg);

      // Trigger the analysis
      const analysisPromise = analyzeImageColors('test-image.jpg', document.body);

      // Simulate successful image load
      setTimeout(() => {
        if (mockImg.onload) mockImg.onload();
      }, 0);

      const result = await analysisPromise;

      // Should return a color object (based on our mocked canvas data)
      expect(result).toBeTruthy();
      expect(typeof result.r).toBe('number');
      expect(typeof result.g).toBe('number');
      expect(typeof result.b).toBe('number');
    });

    test('analyzeImageColors handles image loading errors', async () => {
      const mockImg = {
        crossOrigin: '',
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImg);

      const analysisPromise = analyzeImageColors('invalid-image.jpg', document.body);

      // Simulate image error
      setTimeout(() => {
        if (mockImg.onerror) mockImg.onerror();
      }, 0);

      const result = await analysisPromise;
      expect(result).toBeNull();
    });

    test('analyzeImageColors uses caching', async () => {
      const mockImg = {
        crossOrigin: '',
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImg);

      // First call
      const promise1 = analyzeImageColors('cached-image.jpg', document.body);
      setTimeout(() => {
        if (mockImg.onload) mockImg.onload();
      }, 0);
      await promise1;

      // Second call should use cache
      const promise2 = analyzeImageColors('cached-image.jpg', document.body);
      const result2 = await promise2;

      // Should have been called only once due to caching
      expect(global.Image).toHaveBeenCalledTimes(1);
    });
  });

  describe('Background Image Theme Detection', () => {
    test('detectBackgroundImageTheme detects gradients', async () => {
      const element = document.createElement('div');

      // Mock getComputedStyle to return a gradient
      const mockGetComputedStyle = vi.fn(() => ({
        backgroundImage: 'linear-gradient(to right, black, white)',
      }));
      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const theme = await detectBackgroundImageTheme(element);
      expect(['light', 'dark']).toContain(theme);
    });

    test('detectBackgroundImageTheme handles image URLs', async () => {
      const element = document.createElement('div');

      const mockGetComputedStyle = vi.fn(() => ({
        backgroundImage: 'url("test-image.jpg")',
      }));
      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const mockImg = {
        crossOrigin: '',
        onload: null,
        onerror: null,
        src: '',
      };

      global.Image = vi.fn(() => mockImg);

      const themePromise = detectBackgroundImageTheme(element);

      // Simulate successful image load
      setTimeout(() => {
        if (mockImg.onload) mockImg.onload();
      }, 0);

      const theme = await themePromise;
      expect(['light', 'dark', 'unknown']).toContain(theme);
    });

    test('detectBackgroundImageTheme returns unknown for no background', async () => {
      const element = document.createElement('div');

      const mockGetComputedStyle = vi.fn(() => ({
        backgroundImage: 'none',
      }));
      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const theme = await detectBackgroundImageTheme(element);
      expect(theme).toBe('unknown');
    });

    test('detectBackgroundImageTheme handles errors gracefully', async () => {
      const element = null; // Invalid element

      const theme = await detectBackgroundImageTheme(element);
      expect(theme).toBe('unknown');
    });
  });

  describe('Integration', () => {
    test('full workflow with gradient background', async () => {
      const element = document.createElement('div');

      const mockGetComputedStyle = vi.fn(() => ({
        backgroundImage: 'linear-gradient(to right, #000000, #ffffff)',
      }));
      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const theme = await detectBackgroundImageTheme(element);
      expect(['light', 'dark']).toContain(theme);
    });

    test('performance with large number of elements', async () => {
      const elements = Array.from({ length: 10 }, () => document.createElement('div'));

      const mockGetComputedStyle = vi.fn(() => ({
        backgroundImage: 'linear-gradient(to right, red, blue)',
      }));
      Object.defineProperty(window, 'getComputedStyle', {
        value: mockGetComputedStyle,
        writable: true,
      });

      const startTime = performance.now();

      const themes = await Promise.all(elements.map((el) => detectBackgroundImageTheme(el)));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(themes).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
