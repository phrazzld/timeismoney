/**
 * Tests for the PriceBadge component class
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { PriceBadge, createPriceBadge } from '../../components/PriceBadge.js';
import { CONVERTED_PRICE_CLASS } from '../../utils/constants.js';

describe('PriceBadge Component', () => {
  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up any remaining elements
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    test('creates instance with valid configuration', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      expect(badge.config.originalPrice).toBe('$30.00');
      expect(badge.config.timeDisplay).toBe('3h 0m');
      expect(badge.config.context).toBeNull();
      expect(badge.config.useIcon).toBe(true);
      expect(badge.config.iconSize).toBe('xs');
      expect(badge.isRendered).toBe(false);
      expect(badge.isDestroyed).toBe(false);
    });

    test('throws error for missing originalPrice', () => {
      expect(() => {
        new PriceBadge({
          timeDisplay: '3h 0m',
        } as never);
      }).toThrow('PriceBadge: originalPrice is required and must be a string');
    });

    test('throws error for missing timeDisplay', () => {
      expect(() => {
        new PriceBadge({
          originalPrice: '$30.00',
        } as never);
      }).toThrow('PriceBadge: timeDisplay is required and must be a string');
    });

    test('throws error for invalid originalPrice type', () => {
      expect(() => {
        new PriceBadge({
          originalPrice: 30,
          timeDisplay: '3h 0m',
        } as never);
      }).toThrow('PriceBadge: originalPrice is required and must be a string');
    });

    test('applies custom configuration options', () => {
      const context = document.createElement('div');
      const badge = new PriceBadge({
        originalPrice: '$50.00',
        timeDisplay: '5h 0m',
        context: context,
        iconSize: 'sm',
        useIcon: false,
        styleOverrides: { color: 'red' },
      });

      expect(badge.config.context).toBe(context);
      expect(badge.config.iconSize).toBe('sm');
      expect(badge.config.useIcon).toBe(false);
      expect(badge.config.styleOverrides.color).toBe('red');
    });
  });

  describe('Render Method', () => {
    test('creates and returns DOM element on first render', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.tagName).toBe('SPAN');
      expect(element.className).toBe(CONVERTED_PRICE_CLASS);
      expect(element.getAttribute('data-original-price')).toBe('$30.00');
      // With accessibility enabled (default), uses ARIA attributes instead of title
      expect(element.getAttribute('aria-label')).toContain('$30.00');
      expect(element.textContent).toContain('3h 0m');
      expect(badge.isRendered).toBe(true);
    });

    test('uses title attribute when accessibility is disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        enableAccessibility: false,
      });

      const element = badge.render();
      expect(element.title).toBe('Originally $30.00');
      expect(element.getAttribute('aria-label')).toBeNull();
    });

    test('returns same element on subsequent renders', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element1 = badge.render();
      const element2 = badge.render();

      expect(element1).toBe(element2);
    });

    test('includes clock icon by default', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeTruthy();
      expect(svg!.tagName).toBe('svg');
    });

    test('excludes clock icon when useIcon is false', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: false,
        enableHoverToggle: true, // Enable modern time-only display
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeFalsy();
      expect(element.textContent).toBe('3h 0m');
    });

    test('throws error when rendering destroyed badge', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      await badge.destroy();

      expect(() => {
        badge.render();
      }).toThrow('Cannot render a destroyed PriceBadge instance');
    });
  });

  describe('Update Method', () => {
    test('updates configuration and re-renders element', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        enableHoverToggle: true, // Enable modern time-only display
        enableAnimations: false, // Disable animations for synchronous testing
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Update the badge
      badge.update({
        originalPrice: '$50.00',
        timeDisplay: '5h 0m',
      });

      expect(element.getAttribute('data-original-price')).toBe('$50.00');
      expect(element.getAttribute('aria-label')).toContain('$50.00');
      expect(element.textContent).toContain('5h 0m');
    });

    test('can toggle icon visibility', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
        enableHoverToggle: true, // Enable modern time-only display
        enableAnimations: false, // Disable animations for synchronous testing
      });

      const element = badge.render();

      // Initially has icon
      expect(element.querySelector('svg')).toBeTruthy();

      // Update to remove icon
      badge.update({ useIcon: false });

      expect(element.querySelector('svg')).toBeFalsy();
      expect(element.textContent).toBe('3h 0m');
    });

    test('throws error when updating destroyed badge', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      await badge.destroy();

      expect(() => {
        badge.update({ timeDisplay: '5h 0m' });
      }).toThrow('Cannot update a destroyed PriceBadge instance');
    });

    test('validates updated configuration', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      expect(() => {
        badge.update({ originalPrice: '' });
      }).toThrow('PriceBadge: originalPrice is required and must be a string');
    });
  });

  describe('Destroy Method', () => {
    test('removes element from DOM and cleans up state', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Verify element is in DOM
      expect(document.body.contains(element)).toBe(true);

      // Destroy the badge
      const result = await badge.destroy();

      expect(result).toBe(true);
      expect(badge.isDestroyed).toBe(true);
      expect(badge.isRendered).toBe(false);
      expect(badge.element).toBeNull();
      expect(document.body.contains(element)).toBe(false);
    });

    test('handles destroying badge not in DOM', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      badge.render(); // Create element but don't add to DOM

      const result = await badge.destroy();

      expect(result).toBe(true);
      expect(badge.isDestroyed).toBe(true);
    });

    test('returns true when destroying already destroyed badge', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      await badge.destroy();
      const result = await badge.destroy();

      expect(result).toBe(true);
    });
  });

  describe('State Methods', () => {
    test('getConfig returns current configuration', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        iconSize: 'sm',
      });

      const config = badge.getConfig();

      expect(config.originalPrice).toBe('$30.00');
      expect(config.timeDisplay).toBe('3h 0m');
      expect(config.iconSize).toBe('sm');
      expect(config).not.toBe(badge.config); // Should be a copy
    });

    test('getElement returns current DOM element', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      expect(badge.getElement()).toBeNull();

      const element = badge.render();

      expect(badge.getElement()).toBe(element);
    });

    test('isRenderedState returns correct state', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      expect(badge.isRenderedState()).toBe(false);

      badge.render();

      expect(badge.isRenderedState()).toBe(true);

      await badge.destroy();

      expect(badge.isRenderedState()).toBe(false);
    });

    test('isDestroyedState returns correct state', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      expect(badge.isDestroyedState()).toBe(false);

      await badge.destroy();

      expect(badge.isDestroyedState()).toBe(true);
    });
  });

  describe('Factory Function', () => {
    test('createPriceBadge returns rendered element', () => {
      const element = createPriceBadge('$30.00', '3h 0m');

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.tagName).toBe('SPAN');
      expect(element.className).toBe(CONVERTED_PRICE_CLASS);
      expect(element.getAttribute('data-original-price')).toBe('$30.00');
      expect(element.getAttribute('aria-label')).toContain('$30.00');
      expect(element.textContent).toContain('3h 0m');
    });

    test('createPriceBadge accepts context parameter', () => {
      const context = document.createElement('div');
      const element = createPriceBadge('$30.00', '3h 0m', context);

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.className).toBe(CONVERTED_PRICE_CLASS);
    });

    test('createPriceBadge accepts options parameter', () => {
      const element = createPriceBadge('$30.00', '3h 0m', null, {
        useIcon: false,
        iconSize: 'lg',
      });

      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.querySelector('svg')).toBeFalsy();
    });

    test('createPriceBadge handles errors gracefully', () => {
      // Force an error by passing invalid parameters
      const element = createPriceBadge('', ''); // Empty strings should cause validation error

      // Should still return an element (fallback)
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.tagName).toBe('SPAN');
    });
  });
});
