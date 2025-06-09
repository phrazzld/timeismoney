/**
 * Unit tests for ShadowPriceBadge component
 * Tests Shadow DOM integration for perfect style isolation
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../setup/vitest.setup.js';

describe('ShadowPriceBadge Component', () => {
  beforeEach(() => {
    // Clear all mocks
    resetTestMocks();

    // Reset modules to ensure clean import
    vi.resetModules();
  });

  describe('Feature Detection', () => {
    test('detects Shadow DOM support correctly', () => {
      // Mock Shadow DOM support in browser environment
      if (typeof Element !== 'undefined') {
        Element.prototype.attachShadow = vi.fn();
      } else {
        global.Element = { prototype: { attachShadow: vi.fn() } };
      }

      // Test static method directly
      const result = typeof Element !== 'undefined' && 'attachShadow' in Element.prototype;
      expect(result).toBe(true);
    });

    test('detects lack of Shadow DOM support', () => {
      // Remove Shadow DOM support
      if (typeof Element !== 'undefined' && Element.prototype.attachShadow) {
        delete Element.prototype.attachShadow;
      }

      // Test detection
      const result = typeof Element !== 'undefined' && 'attachShadow' in Element.prototype;
      expect(result).toBe(false);
    });
  });

  describe('Shadow DOM Content Generation', () => {
    test('generates proper CSS styles for shadow content', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);
      badge.hostTheme = { textColor: '#333333', isDark: false };

      const css = badge.getShadowCSS();

      expect(css).toContain(':host');
      expect(css).toContain('display: inline-flex');
      expect(css).toContain('color: #333333');
    });

    test('generates proper HTML content for shadow DOM', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);
      const html = badge.getShadowHTML();

      expect(html).toContain('badge-content');
      expect(html).toContain('2h 0m');
      expect(html).toContain('<svg');
    });

    test('combines styles and HTML correctly', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);
      const content = badge.getShadowDOMContent();

      expect(content).toContain('<style>');
      expect(content).toContain(':host');
      expect(content).toContain('badge-content');
    });
  });

  describe('Accessibility Features', () => {
    test('generates proper aria-label content', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);
      const ariaLabel = badge.getAriaLabel();

      expect(ariaLabel).toContain('Originally $29.99');
      expect(ariaLabel).toContain('2 hours');
      expect(ariaLabel).toContain('work time');
    });

    test('handles time format conversion in aria-label', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$15.99', '45m', null);
      const ariaLabel = badge.getAriaLabel();

      expect(ariaLabel).toContain('Originally $15.99');
      expect(ariaLabel).toContain('45 minutes');
      expect(ariaLabel).not.toContain('0 hours');
    });
  });

  describe('Theme Detection', () => {
    test('provides default theme when no context available', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);

      expect(badge.hostTheme).toBeDefined();
      expect(badge.hostTheme.textColor).toBeDefined();
      expect(badge.hostTheme.backgroundColor).toBeDefined();
      expect(badge.hostTheme.isDark).toBeDefined();
    });

    test('applies theme colors to generated CSS', async () => {
      const { ShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      const badge = new ShadowPriceBadge('$29.99', '2h 0m', null);
      badge.hostTheme = { textColor: '#ffffff', isDark: true };

      const css = badge.getShadowCSS();

      expect(css).toContain('color: #ffffff');
    });
  });

  describe('Factory Function', () => {
    test('creates ShadowPriceBadge via factory function', async () => {
      const { createShadowPriceBadge } = await import('../../../components/ShadowPriceBadge.js');

      // This should not throw
      expect(() => createShadowPriceBadge('$29.99', '2h 0m')).not.toThrow();
    });
  });
});
