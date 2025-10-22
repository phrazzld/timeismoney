/**
 * Unit tests for PriceBadge accessibility features (S3.1)
 * Tests ARIA attributes, screen reader support, and accessible tooltips
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { PriceBadge } from '../../../components/PriceBadge.js';

describe('PriceBadge Accessibility (S3.1)', () => {
  beforeEach(() => {
    // Set up clean DOM environment
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Accessibility Features', () => {
    test('creates badge with proper ARIA attributes by default', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();

      expect(element.getAttribute('role')).toBe('img');
      expect(element.getAttribute('aria-label')).toContain('3 hours work time');
      expect(element.getAttribute('aria-label')).toContain('originally $30.00');
      expect(element.getAttribute('aria-live')).toBe('polite');
      expect(element.getAttribute('aria-atomic')).toBe('true');
      expect(element.getAttribute('aria-describedby')).toBeTruthy();
    });

    test('creates accessible tooltip linked to badge', () => {
      const badge = new PriceBadge({
        originalPrice: '$45.99',
        timeDisplay: '2h 30m',
      });

      const element = badge.render();
      const tooltipId = element.getAttribute('aria-describedby');

      expect(tooltipId).toBeTruthy();

      const tooltip = document.getElementById(tooltipId!);
      expect(tooltip).toBeTruthy();
      expect(tooltip!.textContent).toContain('Originally $45.99');
      expect(tooltip!.textContent).toContain('2 hours and 30 minutes of work time');
      expect(tooltip!.className).toBe('tim-accessible-tooltip');

      // Tooltip should be visually hidden but accessible
      expect(tooltip!.style.position).toBe('absolute');
      expect(tooltip!.style.width).toBe('1px');
      expect(tooltip!.style.height).toBe('1px');
    });

    test('uses appropriate role based on configuration', () => {
      const badgeWithIcon = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const badgeWithoutIcon = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: false,
      });

      expect(badgeWithIcon.render().getAttribute('role')).toBe('img');
      expect(badgeWithoutIcon.render().getAttribute('role')).toBe('text');
    });

    test('formats time properly in ARIA labels', () => {
      const testCases = [
        { timeDisplay: '3h 0m', expected: '3 hours work time' },
        { timeDisplay: '45m', expected: '45 minutes work time' },
        { timeDisplay: '1h 15m', expected: '1 hour and 15 minutes work time' },
        { timeDisplay: '2h 1m', expected: '2 hours and 1 minute work time' },
      ];

      testCases.forEach(({ timeDisplay, expected }) => {
        const badge = new PriceBadge({
          originalPrice: '$30.00',
          timeDisplay,
        });

        const element = badge.render();
        expect(element.getAttribute('aria-label')).toContain(expected);
      });
    });
  });

  describe('Accessibility Configuration Options', () => {
    test('can disable accessibility features', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        enableAccessibility: false,
      });

      const element = badge.render();

      expect(element.getAttribute('role')).toBeNull();
      expect(element.getAttribute('aria-label')).toBeNull();
      expect(element.getAttribute('aria-describedby')).toBeNull();
      expect(element.title).toBe('Originally $30.00'); // Fallback to title
    });

    test('supports verbose accessibility descriptions', () => {
      const basicBadge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        verboseAccessibility: false,
      });

      const verboseBadge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        verboseAccessibility: true,
      });

      const basicLabel = basicBadge.render().getAttribute('aria-label')!;
      const verboseLabel = verboseBadge.render().getAttribute('aria-label')!;

      expect(verboseLabel.length).toBeGreaterThan(basicLabel.length);
      expect(verboseLabel).toContain('Price converted to work time equivalent');
    });

    test('supports screen reader announcements configuration', () => {
      // Test that announceChanges config is properly stored
      const badgeWithAnnouncements = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        announceChanges: true,
      });

      const badgeWithoutAnnouncements = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        announceChanges: false,
      });

      expect(badgeWithAnnouncements.getConfig().announceChanges).toBe(true);
      expect(badgeWithoutAnnouncements.getConfig().announceChanges).toBe(false);
    });

    test('does not announce by default', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        // announceChanges not specified - should default to false
      });

      expect(badge.getConfig().announceChanges).toBe(false);
    });
  });

  describe('Tooltip Management', () => {
    test('creates unique tooltip IDs for multiple badges', () => {
      const badge1 = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const badge2 = new PriceBadge({
        originalPrice: '$45.99',
        timeDisplay: '2h 30m',
      });

      const element1 = badge1.render();
      const element2 = badge2.render();

      const tooltipId1 = element1.getAttribute('aria-describedby')!;
      const tooltipId2 = element2.getAttribute('aria-describedby')!;

      expect(tooltipId1).not.toBe(tooltipId2);

      const tooltip1 = document.getElementById(tooltipId1);
      const tooltip2 = document.getElementById(tooltipId2);

      expect(tooltip1).toBeTruthy();
      expect(tooltip2).toBeTruthy();
      expect(tooltip1!.textContent).toContain('$30.00');
      expect(tooltip2!.textContent).toContain('$45.99');
    });

    test('cleans up tooltip on badge destruction', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();
      const tooltipId = element.getAttribute('aria-describedby')!;
      const tooltip = document.getElementById(tooltipId);

      expect(tooltip).toBeTruthy();

      badge.destroy();

      // Tooltip should be removed from DOM
      expect(document.getElementById(tooltipId)).toBeNull();
    });

    test('handles tooltip creation errors gracefully', () => {
      // Mock document.createElement to fail for tooltip creation
      const originalCreateElement = document.createElement;
      let callCount = 0;
      document.createElement = vi.fn().mockImplementation((tagName: string) => {
        callCount++;
        if (tagName === 'div' && callCount > 1) {
          throw new Error('Tooltip creation failed');
        }
        return originalCreateElement.call(document, tagName);
      }) as never;

      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      // Should not throw and should still create badge element
      expect(() => badge.render()).not.toThrow();

      const element = badge.render();
      expect(element).toBeTruthy();

      document.createElement = originalCreateElement.bind(document);
    });
  });

  describe('Update and Lifecycle', () => {
    test('maintains accessibility attributes on update', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      let element = badge.render();
      const originalTooltipId = element.getAttribute('aria-describedby');

      // Update badge
      badge.update({
        originalPrice: '$45.99',
        timeDisplay: '2h 30m',
      });

      element = badge.getElement()!;

      expect(element.getAttribute('aria-label')).toContain('2 hours and 30 minutes');
      expect(element.getAttribute('aria-label')).toContain('$45.99');
      expect(element.getAttribute('role')).toBe('img');

      // Tooltip should be updated but ID might be different
      const currentTooltipId = element.getAttribute('aria-describedby')!;
      const tooltip = document.getElementById(currentTooltipId);
      expect(tooltip!.textContent).toContain('$45.99');
    });

    test('handles accessibility attribute updates when accessibility disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        enableAccessibility: false,
      });

      const element = badge.render();

      expect(element.getAttribute('aria-label')).toBeNull();
      expect(element.title).toBe('Originally $30.00');

      badge.update({ originalPrice: '$45.99' });

      expect(element.getAttribute('aria-label')).toBeNull();
      expect(element.title).toBe('Originally $45.99');
    });
  });

  describe('Clock Icon Accessibility', () => {
    test('clock icon has proper accessibility attributes', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: true,
      });

      const element = badge.render();
      const svg = element.querySelector('svg');

      expect(svg).toBeTruthy();
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
    });

    test('badge without icon still has proper accessibility', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        useIcon: false,
      });

      const element = badge.render();

      expect(element.getAttribute('role')).toBe('text');
      expect(element.getAttribute('aria-label')).toContain('3 hours work time');
      expect(element.querySelector('svg')).toBeNull();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('handles accessibility configuration errors gracefully', () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
        enableAccessibility: true,
      });

      // Should still create badge even if accessibility features fail
      expect(() => badge.render()).not.toThrow();
      const element = badge.render();
      expect(element).toBeTruthy();
      expect(element.tagName).toBe('SPAN');
    });

    test('accessibility validation passes for properly configured badges', async () => {
      const badge = new PriceBadge({
        originalPrice: '$30.00',
        timeDisplay: '3h 0m',
      });

      const element = badge.render();

      // Import validation function
      const { validateAccessibility } = await import('../../../utils/accessibility.js');
      const validation = validateAccessibility(element);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('Integration with Different Price Formats', () => {
    test('handles various currency formats in accessibility labels', () => {
      const testCases = [
        { price: '$30.00', currency: 'USD' },
        { price: '€25.50', currency: 'EUR' },
        { price: '£40.99', currency: 'GBP' },
        { price: '¥3000', currency: 'JPY' },
      ];

      testCases.forEach(({ price, currency }) => {
        const badge = new PriceBadge({
          originalPrice: price,
          timeDisplay: '2h 0m',
        });

        const element = badge.render();
        const ariaLabel = element.getAttribute('aria-label')!;

        expect(ariaLabel).toContain(price);
        expect(ariaLabel).toContain('2 hours work time');
      });
    });

    test('handles complex time displays', () => {
      const badge = new PriceBadge({
        originalPrice: '$157.50',
        timeDisplay: '5h 15m',
      });

      const element = badge.render();
      const ariaLabel = element.getAttribute('aria-label')!;

      expect(ariaLabel).toContain('5 hours and 15 minutes work time');
      expect(ariaLabel).toContain('originally $157.50');
    });
  });
});
