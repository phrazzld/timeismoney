/**
 * Integration tests for PriceBadge dynamic theme adaptation
 * Tests the end-to-end theme detection and style application
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { PriceBadge, createPriceBadge } from '../../../components/PriceBadge.js';

describe('PriceBadge Theme Adaptation Integration', () => {
  let mockGetComputedStyle;

  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';

    // Mock getComputedStyle for theme detection
    mockGetComputedStyle = vi.fn();
    Object.defineProperty(window, 'getComputedStyle', {
      value: mockGetComputedStyle,
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up any remaining elements
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Light Theme Adaptation', () => {
    test('applies light theme styles when placed on white background', () => {
      // Create a white background container
      const container = document.createElement('div');
      container.style.backgroundColor = 'white';
      document.body.appendChild(container);

      // Mock getComputedStyle to return white background
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      });

      // Create badge with the container as context
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        context: container,
      });

      const element = badge.render();
      expect(element).toBeTruthy();

      // Check that light theme styles are applied
      const styles = element.style.cssText;
      expect(styles).toContain('color: rgb(5, 150, 105)'); // Primary green for light theme (#059669 in RGB)
      expect(styles).toContain('background-color: rgb(249, 250, 251)'); // Light background (#f9fafb in RGB)
      expect(styles).toContain('border-color: #e5e7eb'); // Light border
    });

    test('factory function applies light theme correctly', () => {
      // Create a light gray background context
      const context = document.createElement('div');
      context.style.backgroundColor = '#f8f8f8';
      document.body.appendChild(context);

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(248, 248, 248)',
      });

      const element = createPriceBadge('$50.00', '5h 0m', context);

      expect(element).toBeTruthy();
      expect(element.style.cssText).toContain('color: rgb(5, 150, 105)'); // #059669 in RGB
      expect(element.getAttribute('data-original-price')).toBe('$50.00');
      expect(element.getAttribute('aria-label')).toContain('$50.00');
    });
  });

  describe('Dark Theme Adaptation', () => {
    test('applies dark theme styles when placed on dark background', () => {
      // Create a dark background container
      const container = document.createElement('div');
      container.style.backgroundColor = '#1a1a1a';
      document.body.appendChild(container);

      // Mock getComputedStyle to return dark background
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(26, 26, 26)',
      });

      const badge = new PriceBadge({
        originalPrice: '$100.00',
        timeDisplay: '10h 0m',
        context: container,
      });

      const element = badge.render();
      expect(element).toBeTruthy();

      // Check that dark theme styles are applied
      const styles = element.style.cssText;
      expect(styles).toContain('color: rgb(16, 185, 129)'); // Lighter green for dark theme (#10b981 in RGB)
      expect(styles).toContain('background-color: rgb(31, 41, 55)'); // Dark background (#1f2937 in RGB)
      expect(styles).toContain('border-color: #4b5563'); // Dark border
    });

    test('handles GitHub dark mode colors correctly', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      // GitHub dark mode background color
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(13, 17, 23)',
      });

      const element = createPriceBadge('$25.99', '2h 35m', container);

      expect(element).toBeTruthy();
      const styles = element.style.cssText;
      expect(styles).toContain('color: rgb(16, 185, 129)'); // Should use light variant (#10b981 in RGB)
    });
  });

  describe('Background Traversal', () => {
    test('walks up DOM tree to find meaningful background', () => {
      // Create nested structure with transparent child and colored parent
      const parent = document.createElement('div');
      parent.style.backgroundColor = '#2d3748'; // Dark gray
      document.body.appendChild(parent);

      const transparentChild = document.createElement('div');
      transparentChild.style.backgroundColor = 'transparent';
      parent.appendChild(transparentChild);

      const priceElement = document.createElement('span');
      transparentChild.appendChild(priceElement);

      // Mock getComputedStyle to return appropriate values for each element
      mockGetComputedStyle
        .mockReturnValueOnce({
          backgroundColor: 'transparent', // priceElement
        })
        .mockReturnValueOnce({
          backgroundColor: 'transparent', // transparentChild
        })
        .mockReturnValueOnce({
          backgroundColor: 'rgb(45, 55, 72)', // parent - dark
        });

      const badge = new PriceBadge({
        originalPrice: '$15.00',
        timeDisplay: '1h 30m',
        context: priceElement,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should detect dark theme from parent and apply appropriate styles
      expect(styles).toContain('color: rgb(16, 185, 129)'); // Light green for dark theme (#10b981 in RGB)
    });

    test('limits traversal depth to prevent infinite loops', () => {
      // Create a very deep structure
      let current = document.body;
      for (let i = 0; i < 15; i++) {
        const div = document.createElement('div');
        div.style.backgroundColor = 'transparent';
        current.appendChild(div);
        current = div;
      }

      // All elements return transparent
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'transparent',
      });

      const badge = new PriceBadge({
        originalPrice: '$20.00',
        timeDisplay: '2h 0m',
        context: current,
      });

      const element = badge.render();

      // Should not crash and should apply default light theme
      expect(element).toBeTruthy();
      expect(mockGetComputedStyle).toHaveBeenCalled();
      // Function should complete without hanging
    });
  });

  describe('Real-world Website Scenarios', () => {
    test('adapts to Amazon-style white backgrounds', () => {
      const amazonContainer = document.createElement('div');
      amazonContainer.className = 'a-offscreen'; // Typical Amazon class
      amazonContainer.style.backgroundColor = 'white';
      document.body.appendChild(amazonContainer);

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)',
      });

      const element = createPriceBadge('$39.99', '4h 0m', amazonContainer);

      expect(element.style.cssText).toContain('color: rgb(5, 150, 105)'); // #059669 in RGB
      expect(element.style.cssText).toContain('background-color: rgb(249, 250, 251)'); // #f9fafb in RGB
    });

    test('adapts to eBay-style light gray backgrounds', () => {
      const ebayContainer = document.createElement('div');
      ebayContainer.style.backgroundColor = '#f7f7f7';
      document.body.appendChild(ebayContainer);

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(247, 247, 247)',
      });

      const element = createPriceBadge('$12.50', '1h 15m', ebayContainer);

      expect(element.style.cssText).toContain('color: rgb(5, 150, 105)'); // Light theme (#059669 in RGB)
    });

    test('adapts to dark mode e-commerce sites', () => {
      const darkContainer = document.createElement('div');
      darkContainer.style.backgroundColor = '#121212'; // Material dark
      document.body.appendChild(darkContainer);

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(18, 18, 18)',
      });

      const element = createPriceBadge('$75.00', '7h 30m', darkContainer);

      expect(element.style.cssText).toContain('color: rgb(16, 185, 129)'); // Dark theme (#10b981 in RGB)
      expect(element.style.cssText).toContain('background-color: rgb(31, 41, 55)'); // #1f2937 in RGB
    });
  });

  describe('Theme Update Functionality', () => {
    test('re-evaluates theme when context changes', () => {
      // Start with light background
      const container = document.createElement('div');
      document.body.appendChild(container);

      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(255, 255, 255)', // White
      });

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        context: container,
      });

      const element = badge.render();

      // Should start with light theme
      expect(element.style.cssText).toContain('color: rgb(5, 150, 105)'); // #059669 in RGB

      // Change to dark background and update
      mockGetComputedStyle.mockReturnValue({
        backgroundColor: 'rgb(30, 30, 30)', // Dark
      });

      // Update the badge - this should re-evaluate the theme
      badge.update({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      // Should now have dark theme styles
      expect(element.style.cssText).toContain('color: rgb(16, 185, 129)'); // #10b981 in RGB
    });
  });

  describe('Fallback Behavior', () => {
    test('handles getComputedStyle errors gracefully', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Mock getComputedStyle to throw an error
      mockGetComputedStyle.mockImplementation(() => {
        throw new Error('getComputedStyle failed');
      });

      const badge = new PriceBadge({
        originalPrice: '$40.00',
        timeDisplay: '4h 0m',
        context: container,
      });

      const element = badge.render();

      // Should still create a working badge with fallback styles
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('4h 0m');
      expect(element.getAttribute('data-original-price')).toBe('$40.00');
      expect(element.getAttribute('aria-label')).toContain('$40.00');
    });

    test('works without context element', () => {
      const badge = new PriceBadge({
        originalPrice: '$60.00',
        timeDisplay: '6h 0m',
        context: null, // No context provided
      });

      const element = badge.render();

      // Should still work and apply default styles
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('6h 0m');
      expect(typeof element.style.cssText).toBe('string');
    });
  });
});
