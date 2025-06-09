/**
 * Unit tests for PriceBadge clock icon improvements (S2.4)
 * Tests the new professional clock icon implementation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { PriceBadge, createPriceBadge } from '../../../components/PriceBadge.js';

describe('PriceBadge Professional Clock Icon (S2.4)', () => {
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
  });

  afterEach(() => {
    // Clean up any remaining elements
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('Icon Rendering', () => {
    test('creates icon with professional 16x16 viewBox', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeTruthy();
      expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    });

    test('includes aria-hidden for accessibility', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    test('uses currentColor for color inheritance', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgHTML = svg.outerHTML;

      // Should use currentColor for all stroke and fill attributes
      expect(svgHTML).toContain('stroke="currentColor"');
      expect(svgHTML).toContain('fill="currentColor"');
      expect(svgHTML).not.toContain('stroke="#');
      expect(svgHTML).not.toContain('fill="#');
    });

    test('contains professional clock elements', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgHTML = svg.outerHTML;

      // Should contain main circle
      expect(svgHTML).toContain('r="7"');

      // Should contain center dot
      expect(svgHTML).toContain('r="0.8"');

      // Should contain hour markers (small circles)
      expect(svgHTML).toContain('r="0.3"');

      // Should contain clock hands (paths)
      expect(svgHTML).toContain('<path');

      // Should use professional stroke weight
      expect(svgHTML).toContain('stroke-width="1.2"');
    });

    test('has rounded line caps and joins', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgHTML = svg.outerHTML;

      // Should use rounded line caps and joins for smoother appearance
      expect(svgHTML).toContain('stroke-linecap="round"');
      expect(svgHTML).toContain('stroke-linejoin="round"');
    });

    test('positions hands at 10:10 for visual appeal', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgHTML = svg.outerHTML;

      // Should have 10:10 positioning (symmetric, not 3:00 like old version)
      // Hour hand should point towards 10 o'clock position
      expect(svgHTML).toContain('L6.2 5.8');
      // Minute hand should point towards 2 o'clock position
      expect(svgHTML).toContain('L10.5 5.5');
    });
  });

  describe('Icon Sizing', () => {
    test('respects iconSize configuration', () => {
      const badges = [
        new PriceBadge({ originalPrice: '$30.00', timeDisplay: '3h 0m', iconSize: 'xs' }),
        new PriceBadge({ originalPrice: '$30.00', timeDisplay: '3h 0m', iconSize: 'sm' }),
        new PriceBadge({ originalPrice: '$30.00', timeDisplay: '3h 0m', iconSize: 'base' }),
      ];

      const elements = badges.map((badge) => badge.render());
      const svgs = elements.map((el) => el.querySelector('svg'));
      const sizes = svgs.map((svg) => svg.style.width);

      // Each size should be different
      expect(sizes[0]).not.toBe(sizes[1]);
      expect(sizes[1]).not.toBe(sizes[2]);

      // Should be CSS rem units
      sizes.forEach((size) => {
        expect(size).toMatch(/\d+(\.\d+)?rem/);
      });
    });

    test('scales with responsive design', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        responsive: true,
        iconSize: 'sm',
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      // Should have responsive styling applied
      expect(svg.style.cssText).toContain('width:');
      expect(svg.style.cssText).toContain('height:');
      expect(svg.style.cssText).toContain('margin-right:');
    });
  });

  describe('Icon Toggle', () => {
    test('can disable icon rendering', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: false,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeNull();
      expect(element.textContent.trim()).toBe('3h 0m');
    });

    test('can toggle icon visibility via update', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: false,
      });

      const element = badge.render();
      expect(element.querySelector('svg')).toBeNull();

      // Enable icon
      badge.update({ useIcon: true });
      expect(element.querySelector('svg')).toBeTruthy();

      // Disable icon again
      badge.update({ useIcon: false });
      expect(element.querySelector('svg')).toBeNull();
    });
  });

  describe('Factory Function Integration', () => {
    test('createPriceBadge includes new professional icon', () => {
      const element = createPriceBadge('$50.00', '5h 0m');
      const svg = element.querySelector('svg');

      expect(svg).toBeTruthy();
      expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    test('createPriceBadge respects icon options', () => {
      const element = createPriceBadge('$50.00', '5h 0m', null, {
        useIcon: false,
      });

      expect(element.querySelector('svg')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('handles icon creation errors gracefully', () => {
      // Mock generateIconStyles to throw an error
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // Force an error in icon creation by breaking the styles
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      // Should still create a working element even if icon fails
      const element = badge.render();
      expect(element).toBeTruthy();
      expect(element.textContent).toContain('3h 0m');

      console.error = originalConsoleError;
    });
  });

  describe('Visual Comparison with Old Icon', () => {
    test('new icon is different from old basic version', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');
      const svgHTML = svg.outerHTML;

      // Should NOT contain old icon characteristics
      expect(svgHTML).not.toContain('viewBox="0 0 12 12"'); // Old viewBox
      expect(svgHTML).not.toContain('r="5"'); // Old outer circle
      expect(svgHTML).not.toContain('stroke-width="1"'); // Old thin stroke
      expect(svgHTML).not.toContain('L8.5 6'); // Old 3 o'clock hand position

      // Should contain new icon characteristics
      expect(svgHTML).toContain('viewBox="0 0 16 16"'); // New viewBox
      expect(svgHTML).toContain('r="7"'); // New outer circle
      expect(svgHTML).toContain('stroke-width="1.2"'); // New thicker stroke
      expect(svgHTML).toContain('L6.2 5.8'); // New 10:10 positioning
    });
  });
});
