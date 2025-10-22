/**
 * Advanced theme detection for image backgrounds
 * Analyzes background images, gradients, and complex backgrounds
 *
 * @module utils/imageThemeDetector
 */

import * as logger from './logger.js';

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

type Theme = 'light' | 'dark' | 'unknown';

/**
 * Cache for image analysis results to avoid repeated processing
 */
const imageAnalysisCache = new Map<string, RGBColor | null>();

/**
 * Maximum number of pixels to sample for performance
 */
const MAX_SAMPLE_PIXELS = 1000;

/**
 * Canvas size for image analysis (small for performance)
 */
const ANALYSIS_CANVAS_SIZE = 50;

/**
 * Extracts dominant color from an image URL using canvas analysis
 */
export const analyzeImageColors = async (imageUrl: string): Promise<RGBColor | null> => {
  try {
    // Check cache first
    const cacheKey = imageUrl;
    if (imageAnalysisCache.has(cacheKey)) {
      logger.debug('Image analysis cache hit', { imageUrl });
      return imageAnalysisCache.get(cacheKey)!;
    }

    // Create canvas for analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = ANALYSIS_CANVAS_SIZE;
    canvas.height = ANALYSIS_CANVAS_SIZE;

    // Load image
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to handle CORS

    const result = await new Promise<RGBColor | null>((resolve) => {
      img.onload = () => {
        try {
          // Draw image scaled down for analysis
          ctx.drawImage(img, 0, 0, ANALYSIS_CANVAS_SIZE, ANALYSIS_CANVAS_SIZE);

          // Get image data
          const imageData = ctx.getImageData(0, 0, ANALYSIS_CANVAS_SIZE, ANALYSIS_CANVAS_SIZE);
          const pixels = imageData.data;

          // Sample pixels and calculate average color
          const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
          let totalSamples = 0;

          // Sample every nth pixel for performance
          const sampleStep = Math.max(1, Math.floor(pixels.length / (MAX_SAMPLE_PIXELS * 4)));

          for (let i = 0; i < pixels.length; i += sampleStep * 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;

            // Group similar colors to find dominant one
            const colorKey = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
            colorCounts[colorKey] = colorCounts[colorKey] || { count: 0, r: 0, g: 0, b: 0 };
            colorCounts[colorKey].count++;
            colorCounts[colorKey].r += r;
            colorCounts[colorKey].g += g;
            colorCounts[colorKey].b += b;
            totalSamples++;
          }

          if (totalSamples === 0) {
            resolve(null);
            return;
          }

          // Find most common color group
          let dominantColor: RGBColor | null = null;
          let maxCount = 0;

          for (const colorGroup of Object.values(colorCounts)) {
            if (colorGroup.count > maxCount) {
              maxCount = colorGroup.count;
              dominantColor = {
                r: Math.round(colorGroup.r / colorGroup.count),
                g: Math.round(colorGroup.g / colorGroup.count),
                b: Math.round(colorGroup.b / colorGroup.count),
              };
            }
          }

          resolve(dominantColor);
        } catch (analysisError) {
          const err = analysisError as Error;
          logger.debug('Image analysis failed:', err.message);
          resolve(null);
        }
      };

      img.onerror = () => {
        logger.debug('Image loading failed:', imageUrl);
        resolve(null);
      };

      // Timeout after 3 seconds to prevent hanging
      setTimeout(() => {
        logger.debug('Image analysis timeout:', imageUrl);
        resolve(null);
      }, 3000);

      // Set image source after setting up handlers
      img.src = imageUrl;
    });

    // Cache result (even if null)
    imageAnalysisCache.set(cacheKey, result);

    // Limit cache size
    if (imageAnalysisCache.size > 50) {
      const firstKey = imageAnalysisCache.keys().next().value;
      if (firstKey) imageAnalysisCache.delete(firstKey);
    }

    return result;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error in image color analysis:', err.message);
    return null;
  }
};

/**
 * Parses CSS gradients and extracts representative colors
 */
export const parseGradientColors = (gradientValue: string): RGBColor[] => {
  try {
    const colors: RGBColor[] = [];

    // Match color values in the gradient (simplified regex)
    const colorMatches = gradientValue.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,6}|[a-zA-Z]+/g);

    if (!colorMatches) return colors;

    for (const colorStr of colorMatches) {
      const rgb = parseColorToRgb(colorStr);
      if (rgb) {
        colors.push(rgb);
      }
    }

    return colors;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error parsing gradient colors:', err.message);
    return [];
  }
};

/**
 * Converts various CSS color formats to RGB
 */
export const parseColorToRgb = (colorStr: string): RGBColor | null => {
  try {
    if (!colorStr) return null;

    // Handle rgb/rgba format
    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }

    // Handle hex format
    const hexMatch = colorStr.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }

    // Handle named colors (basic set)
    const namedColors: Record<string, RGBColor> = {
      black: { r: 0, g: 0, b: 0 },
      white: { r: 255, g: 255, b: 255 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 },
    };

    const lowerColor = colorStr.toLowerCase();
    if (namedColors[lowerColor]) {
      return namedColors[lowerColor];
    }

    return null;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error parsing color:', err.message);
    return null;
  }
};

/**
 * Calculates luminance from RGB values
 */
export const calculateLuminance = (rgb: RGBColor): number => {
  if (!rgb || typeof rgb.r !== 'number') return 0.5;

  // Use the same relative luminance formula as the original detection
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
};

/**
 * Determines theme from multiple colors by averaging luminance
 */
export const determineThemeFromColors = (colors: RGBColor[]): Theme => {
  if (!colors || colors.length === 0) return 'light';

  const totalLuminance = colors.reduce((sum, color) => {
    return sum + calculateLuminance(color);
  }, 0);

  const averageLuminance = totalLuminance / colors.length;
  return averageLuminance > 0.5 ? 'light' : 'dark';
};

/**
 * Extracts background image URL from CSS value
 */
export const extractImageUrl = (backgroundImage: string): string | null => {
  try {
    if (!backgroundImage || backgroundImage === 'none') return null;

    // Match url() format
    const urlMatch = backgroundImage.match(/url\(['"]?([^'"()]+)['"]?\)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    return null;
  } catch (error) {
    const err = error as Error;
    logger.debug('Error extracting image URL:', err.message);
    return null;
  }
};

/**
 * Checks if background contains gradient
 */
export const isGradient = (backgroundImage: string): boolean => {
  if (!backgroundImage) return false;
  return /gradient\(/i.test(backgroundImage);
};

/**
 * Main function to analyze background images and determine theme
 */
export const detectBackgroundImageTheme = async (element: HTMLElement): Promise<Theme> => {
  try {
    if (!element || !window.getComputedStyle) {
      return 'unknown';
    }

    const styles = window.getComputedStyle(element);
    const backgroundImage = styles.backgroundImage;

    if (!backgroundImage || backgroundImage === 'none') {
      return 'unknown'; // No background image
    }

    // Handle gradients
    if (isGradient(backgroundImage)) {
      const gradientColors = parseGradientColors(backgroundImage);
      if (gradientColors.length > 0) {
        return determineThemeFromColors(gradientColors);
      }
    }

    // Handle image URLs
    const imageUrl = extractImageUrl(backgroundImage);
    if (imageUrl) {
      const dominantColor = await analyzeImageColors(imageUrl);
      if (dominantColor) {
        const luminance = calculateLuminance(dominantColor);
        return luminance > 0.5 ? 'light' : 'dark';
      }
    }

    return 'unknown';
  } catch (error) {
    const err = error as Error;
    logger.debug('Error detecting background image theme:', err.message);
    return 'unknown';
  }
};
