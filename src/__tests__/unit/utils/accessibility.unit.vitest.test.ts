/**
 * Unit tests for accessibility utilities (S3.1)
 * Tests ARIA label generation, screen reader support, and accessibility helpers
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  generateAccessibleLabel,
  formatTimeForScreenReader,
  generateAccessibleId,
  generateTooltipContent,
  getAccessibleRole,
  createAccessibilityAttributes,
  validateAccessibility,
  createLiveRegion,
  announceToScreenReader,
} from '../../../utils/accessibility.js';

describe('Accessibility Utilities (S3.1)', () => {
  beforeEach(() => {
    // Set up clean DOM environment
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessibleLabel', () => {
    test('creates basic accessible labels', () => {
      const label = generateAccessibleLabel('$30.00', '3h 0m');

      expect(label).toContain('3 hours work time');
      expect(label).toContain('originally $30.00');
      expect(label).not.toContain('3h 0m'); // Should be converted to readable format
    });

    test('handles verbose mode', () => {
      const basicLabel = generateAccessibleLabel('$30.00', '3h 0m');
      const verboseLabel = generateAccessibleLabel('$30.00', '3h 0m', { verbose: true });

      expect(verboseLabel.length).toBeGreaterThan(basicLabel.length);
      expect(verboseLabel).toContain('Price converted to work time equivalent');
    });

    test('handles minutes-only time display', () => {
      const label = generateAccessibleLabel('$15.50', '45m');

      expect(label).toContain('45 minutes work time');
      expect(label).toContain('originally $15.50');
    });

    test('handles zero minutes gracefully', () => {
      const label = generateAccessibleLabel('$30.00', '3h 0m');

      expect(label).toContain('3 hours work time');
      expect(label).not.toContain('0 minutes'); // Should omit zero minutes
    });

    test('handles single hour and minute', () => {
      const label = generateAccessibleLabel('$25.00', '1h 1m');

      expect(label).toContain('1 hour and 1 minute');
      expect(label).not.toContain('hours'); // Should use singular
      expect(label).not.toContain('minutes'); // Should use singular
    });

    test('handles error cases gracefully', () => {
      const label = generateAccessibleLabel('$30.00', null);

      expect(label).toBeTruthy();
      expect(label).toContain('$30.00');
    });
  });

  describe('formatTimeForScreenReader', () => {
    test('converts abbreviated time to full words', () => {
      expect(formatTimeForScreenReader('3h 15m')).toBe('3 hours and 15 minutes');
      expect(formatTimeForScreenReader('1h 1m')).toBe('1 hour and 1 minute');
      expect(formatTimeForScreenReader('45m')).toBe('45 minutes');
      expect(formatTimeForScreenReader('2h 0m')).toBe('2 hours');
    });

    test('handles edge cases', () => {
      expect(formatTimeForScreenReader('0h 0m')).toBe('less than a minute');
      expect(formatTimeForScreenReader('')).toBe('unknown time');
      expect(formatTimeForScreenReader(null)).toBe('unknown time');
      expect(formatTimeForScreenReader('invalid')).toBe('invalid');
    });

    test('handles various time formats', () => {
      expect(formatTimeForScreenReader('1h')).toBe('1 hour');
      expect(formatTimeForScreenReader('30m')).toBe('30 minutes');
      expect(formatTimeForScreenReader('2h30m')).toBe('2 hours and 30 minutes');
    });
  });

  describe('generateAccessibleId', () => {
    test('generates unique IDs with prefix', () => {
      const id1 = generateAccessibleId('tim-tooltip');
      const id2 = generateAccessibleId('tim-tooltip');

      expect(id1).toMatch(/^tim-tooltip-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^tim-tooltip-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    test('uses default prefix when none provided', () => {
      const id = generateAccessibleId();

      expect(id).toMatch(/^tim-a11y-\d+/);
    });

    test('handles error cases', () => {
      // Mock Math.random to throw
      const originalRandom = Math.random;
      Math.random = vi.fn().mockImplementation(() => {
        throw new Error('Random failed');
      });

      const id = generateAccessibleId('test');
      expect(id).toMatch(/^test-\d+$/); // Should fallback to simple format

      Math.random = originalRandom;
    });
  });

  describe('generateTooltipContent', () => {
    test('creates detailed tooltip content', () => {
      const content = generateTooltipContent('$30.00', '3h 0m');

      expect(content).toContain('Originally $30.00');
      expect(content).toContain('This price equals 3 hours of work time');
      expect(content).toContain('hourly wage');
    });

    test('supports basic mode without conversion note', () => {
      const basic = generateTooltipContent('$30.00', '3h 0m', { includeConversionNote: false });

      expect(basic).toBe('Originally $30.00');
      expect(basic).not.toContain('work time');
    });

    test('handles error cases gracefully', () => {
      const content = generateTooltipContent(null, '3h 0m');

      expect(content).toBeTruthy();
      expect(content).toContain('Originally null');
    });
  });

  describe('getAccessibleRole', () => {
    test('returns img role for icon badges that replace content', () => {
      const role = getAccessibleRole({ useIcon: true, isReplacement: true });

      expect(role).toBe('img');
    });

    test('returns text role for text-only or supplementary badges', () => {
      expect(getAccessibleRole({ useIcon: false, isReplacement: true })).toBe('text');
      expect(getAccessibleRole({ useIcon: true, isReplacement: false })).toBe('text');
    });

    test('handles missing config gracefully', () => {
      expect(getAccessibleRole()).toBe('text');
      expect(getAccessibleRole({})).toBe('text');
    });
  });

  describe('createAccessibilityAttributes', () => {
    test('creates complete accessibility attribute set', () => {
      const result = createAccessibilityAttributes('$30.00', '3h 0m');

      expect(result.attributes).toHaveProperty('role');
      expect(result.attributes).toHaveProperty('aria-label');
      expect(result.attributes).toHaveProperty('aria-describedby');
      expect(result.attributes).toHaveProperty('aria-live', 'polite');
      expect(result.attributes).toHaveProperty('aria-atomic', 'true');

      expect(result.tooltipId).toBeTruthy();
      expect(result.tooltipContent).toContain('Originally $30.00');
    });

    test('handles disabled tooltip option', () => {
      const result = createAccessibilityAttributes('$30.00', '3h 0m', { includeTooltip: false });

      expect(result.attributes).not.toHaveProperty('aria-describedby');
      expect(result.tooltipId).toBeNull();
      expect(result.tooltipContent).toBeNull();
    });

    test('applies verbose option to aria-label', () => {
      const basic = createAccessibilityAttributes('$30.00', '3h 0m', { verbose: false });
      const verbose = createAccessibilityAttributes('$30.00', '3h 0m', { verbose: true });

      expect(verbose.attributes['aria-label'].length).toBeGreaterThan(
        basic.attributes['aria-label'].length
      );
    });

    test('handles errors gracefully', () => {
      const result = createAccessibilityAttributes(null, null);

      expect(result.attributes).toHaveProperty('role');
      expect(result.attributes).toHaveProperty('aria-label');
    });
  });

  describe('validateAccessibility', () => {
    test('validates properly configured badge element', () => {
      const element = document.createElement('span');
      element.setAttribute('role', 'img');
      element.setAttribute(
        'aria-label',
        'Price converted to work time: 3 hours, originally $30.00'
      );
      element.setAttribute('aria-live', 'polite');

      const result = validateAccessibility(element);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('identifies missing accessibility attributes', () => {
      const element = document.createElement('span');

      const result = validateAccessibility(element);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('aria-label'))).toBe(true);
      expect(result.issues.some((issue) => issue.includes('role'))).toBe(true);
    });

    test('validates aria-describedby relationships', () => {
      const element = document.createElement('span');
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', 'Valid label here');
      element.setAttribute('aria-describedby', 'non-existent-tooltip');

      const result = validateAccessibility(element);

      expect(result.isValid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('non-existent-tooltip'))).toBe(true);
    });

    test('validates with existing tooltip element', () => {
      const element = document.createElement('span');
      const tooltip = document.createElement('div');
      tooltip.id = 'existing-tooltip';
      document.body.appendChild(tooltip);

      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', 'Valid label here');
      element.setAttribute('aria-describedby', 'existing-tooltip');

      const result = validateAccessibility(element);

      expect(result.isValid).toBe(true);
    });

    test('handles null element gracefully', () => {
      const result = validateAccessibility(null);

      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('null or not a DOM element');
    });
  });

  describe('createLiveRegion', () => {
    test('creates properly configured live region', () => {
      const liveRegion = createLiveRegion('test-region');

      expect(liveRegion.id).toBe('test-region');
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('false');
      expect(liveRegion.className).toBe('tim-live-region');

      // Should be visually hidden but accessible
      expect(liveRegion!.style.position).toBe('absolute');
      expect(liveRegion!.style.width).toBe('1px');
      expect(liveRegion!.style.height).toBe('1px');
    });

    test('works without ID parameter', () => {
      const liveRegion = createLiveRegion();

      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.className).toBe('tim-live-region');
    });

    test('handles creation errors', () => {
      // Mock document.createElement to throw
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation(() => {
        throw new Error('createElement failed');
      });

      const liveRegion = createLiveRegion();

      // Should return fallback element
      expect(liveRegion.tagName).toBeTruthy();
      expect(liveRegion!.style.display).toBe('none');

      document.createElement = originalCreateElement;
    });
  });

  describe('announceToScreenReader', () => {
    test('creates and uses live region for announcements', () => {
      announceToScreenReader('Test announcement');

      const liveRegion = document.querySelector('.tim-live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion!.textContent).toBe('Test announcement');
    });

    test('uses existing live region if available', () => {
      const existingRegion = createLiveRegion();
      document.body.appendChild(existingRegion);

      announceToScreenReader('Test message', existingRegion);

      expect(existingRegion!.textContent).toBe('Test message');
    });

    test('clears message after delay', (done) => {
      const liveRegion = createLiveRegion();
      document.body.appendChild(liveRegion);

      announceToScreenReader('Temporary message', liveRegion, 100);

      expect(liveRegion!.textContent).toBe('Temporary message');

      setTimeout(() => {
        expect(liveRegion!.textContent).toBe('');
        done();
      }, 150);
    });

    test('does not clear message when clearDelay is 0', () => {
      const liveRegion = createLiveRegion();
      document.body.appendChild(liveRegion);

      announceToScreenReader('Persistent message', liveRegion, 0);

      expect(liveRegion!.textContent).toBe('Persistent message');

      // Message should still be there after some time
      setTimeout(() => {
        expect(liveRegion!.textContent).toBe('Persistent message');
      }, 100);
    });

    test('handles empty message gracefully', () => {
      announceToScreenReader('');

      // Should not create live region for empty message
      const liveRegion = document.querySelector('.tim-live-region');
      expect(liveRegion).toBeNull();
    });

    test('handles errors gracefully', () => {
      // Mock document.querySelector to throw
      const originalQuerySelector = document.querySelector;
      document.querySelector = vi.fn().mockImplementation(() => {
        throw new Error('querySelector failed');
      });

      // Should not throw
      expect(() => announceToScreenReader('Test message')).not.toThrow();

      document.querySelector = originalQuerySelector;
    });
  });

  describe('Integration Scenarios', () => {
    test('complete accessibility workflow for badge creation', () => {
      // Simulate creating a fully accessible badge
      const originalPrice = '$45.99';
      const timeDisplay = '2h 30m';

      const accessibilityConfig = createAccessibilityAttributes(originalPrice, timeDisplay);

      // Create badge element
      const badge = document.createElement('span');
      Object.entries(accessibilityConfig.attributes).forEach(([key, value]) => {
        badge.setAttribute(key, value);
      });

      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.id = accessibilityConfig.tooltipId;
      tooltip.textContent = accessibilityConfig.tooltipContent;

      document.body.appendChild(badge);
      document.body.appendChild(tooltip);

      // Validate the complete setup
      const validation = validateAccessibility(badge);
      expect(validation.isValid).toBe(true);

      // Test screen reader announcement
      announceToScreenReader(`Price converted: ${timeDisplay}`);

      const liveRegion = document.querySelector('.tim-live-region');
      expect(liveRegion!.textContent).toContain(timeDisplay);
    });

    test('accessibility gracefully degrades when features disabled', () => {
      const accessibilityConfig = createAccessibilityAttributes('$30.00', '3h 0m', {
        includeTooltip: false,
        verbose: false,
      });

      expect(accessibilityConfig.attributes['aria-label']).toBeTruthy();
      expect(accessibilityConfig.tooltipId).toBeNull();
      expect(accessibilityConfig.tooltipContent).toBeNull();
    });
  });
});
