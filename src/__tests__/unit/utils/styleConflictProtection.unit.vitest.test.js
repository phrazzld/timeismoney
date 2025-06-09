/**
 * Unit tests for Style Conflict Protection utilities (S2.5)
 * Tests protection against host site CSS interference
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  CRITICAL_STYLE_PROPERTIES,
  DEFENSIVE_STYLE_PROPERTIES,
  addStyleProtection,
  addDefensiveStyles,
  getMinimalDefensiveStyles,
  generateConflictResistantStyles,
  validateStyleProtection,
  generateUniqueClassName,
  createStyleConflictTestElement,
} from '../../../utils/styleConflictProtection.js';

describe('Style Conflict Protection (S2.5)', () => {
  beforeEach(() => {
    // Set up clean DOM environment
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Critical Style Properties Configuration', () => {
    test('defines critical properties correctly', () => {
      expect(CRITICAL_STYLE_PROPERTIES.display).toBe(true);
      expect(CRITICAL_STYLE_PROPERTIES.fontSize).toBe(true);
      expect(CRITICAL_STYLE_PROPERTIES.color).toBe(true);
      expect(CRITICAL_STYLE_PROPERTIES.padding).toBe(true);
      expect(CRITICAL_STYLE_PROPERTIES.userSelect).toBe(true);

      // Non-critical properties
      expect(CRITICAL_STYLE_PROPERTIES.margin).toBe(false);
      expect(CRITICAL_STYLE_PROPERTIES.fontFamily).toBe(false);
    });

    test('provides comprehensive defensive properties', () => {
      expect(DEFENSIVE_STYLE_PROPERTIES.textTransform).toBe('none');
      expect(DEFENSIVE_STYLE_PROPERTIES.letterSpacing).toBe('normal');
      expect(DEFENSIVE_STYLE_PROPERTIES.float).toBe('none');
      expect(DEFENSIVE_STYLE_PROPERTIES.listStyle).toBe('none');
    });
  });

  describe('addStyleProtection', () => {
    test('adds !important to critical properties', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: '14px',
        margin: '10px', // Non-critical
        color: '#059669',
      };

      const protectedStyles = addStyleProtection(styles);

      expect(protectedStyles.display).toBe('inline-flex !important');
      expect(protectedStyles.fontSize).toBe('14px !important');
      expect(protectedStyles.color).toBe('#059669 !important');
      expect(protectedStyles.margin).toBe('10px'); // No !important added
    });

    test('does not add !important to properties that already have it', () => {
      const styles = {
        display: 'inline-flex !important',
        fontSize: '14px',
      };

      const protectedStyles = addStyleProtection(styles);

      expect(protectedStyles.display).toBe('inline-flex !important'); // Unchanged
      expect(protectedStyles.fontSize).toBe('14px !important'); // Added
    });

    test('respects forceImportant option', () => {
      const styles = {
        display: 'inline-flex',
        margin: '10px', // Normally non-critical
      };

      const protectedStyles = addStyleProtection(styles, { forceImportant: true });

      expect(protectedStyles.display).toBe('inline-flex !important');
      expect(protectedStyles.margin).toBe('10px !important'); // Forced
    });

    test('respects excludeProperties option', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: '14px',
        color: '#059669',
      };

      const protectedStyles = addStyleProtection(styles, {
        excludeProperties: ['fontSize'],
      });

      expect(protectedStyles.display).toBe('inline-flex !important');
      expect(protectedStyles.fontSize).toBe('14px'); // Excluded
      expect(protectedStyles.color).toBe('#059669 !important');
    });

    test('handles empty styles gracefully', () => {
      const protectedStyles = addStyleProtection({});
      expect(protectedStyles).toEqual({});
    });

    test('handles null/undefined values gracefully', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: null,
        color: undefined,
      };

      const protectedStyles = addStyleProtection(styles);

      expect(protectedStyles.display).toBe('inline-flex !important');
      expect(protectedStyles.fontSize).toBe(null);
      expect(protectedStyles.color).toBe(undefined);
    });
  });

  describe('addDefensiveStyles', () => {
    test('adds defensive properties while preserving explicit styles', () => {
      const styles = {
        fontSize: '14px',
        color: '#059669',
      };

      const defensive = addDefensiveStyles(styles);

      // Should include defensive properties
      expect(defensive.textTransform).toBe('none');
      expect(defensive.letterSpacing).toBe('normal');
      expect(defensive.float).toBe('none');

      // Should preserve explicit styles
      expect(defensive.fontSize).toBe('14px');
      expect(defensive.color).toBe('#059669');
    });

    test('explicit styles override defensive styles', () => {
      const styles = {
        textTransform: 'uppercase', // Override defensive value
        fontSize: '14px',
      };

      const defensive = addDefensiveStyles(styles);

      expect(defensive.textTransform).toBe('uppercase'); // Explicit wins
      expect(defensive.letterSpacing).toBe('normal'); // Defensive
      expect(defensive.fontSize).toBe('14px'); // Explicit
    });

    test('respects minimal option', () => {
      const styles = { fontSize: '14px' };

      const fullDefensive = addDefensiveStyles(styles);
      const minimalDefensive = addDefensiveStyles(styles, { minimal: true });

      // Full defensive should have more properties
      expect(Object.keys(fullDefensive).length).toBeGreaterThan(
        Object.keys(minimalDefensive).length
      );

      // Both should have explicit styles
      expect(fullDefensive.fontSize).toBe('14px');
      expect(minimalDefensive.fontSize).toBe('14px');
    });
  });

  describe('getMinimalDefensiveStyles', () => {
    test('returns essential defensive properties only', () => {
      const minimal = getMinimalDefensiveStyles();

      expect(minimal.textTransform).toBe('none');
      expect(minimal.letterSpacing).toBe('normal');
      expect(minimal.float).toBe('none');
      expect(minimal.listStyle).toBe('none');

      // Should not include extensive table/grid resets
      expect(minimal.borderCollapse).toBeUndefined();
      expect(minimal.tableLayout).toBeUndefined();
    });
  });

  describe('generateConflictResistantStyles', () => {
    test('combines protection and defensive styling by default', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: '14px',
        color: '#059669',
      };

      const resistant = generateConflictResistantStyles(styles);

      // Should be a CSS string
      expect(typeof resistant).toBe('string');

      // Should contain protected critical properties
      expect(resistant).toContain('display: inline-flex !important');
      expect(resistant).toContain('font-size: 14px !important');
      expect(resistant).toContain('color: #059669 !important');

      // Should contain defensive properties
      expect(resistant).toContain('text-transform: none');
      expect(resistant).toContain('letter-spacing: normal');
    });

    test('can disable protection', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: '14px',
      };

      const unprotected = generateConflictResistantStyles(styles, {
        protection: false,
      });

      expect(unprotected).toContain('display: inline-flex');
      expect(unprotected).not.toContain('!important');
    });

    test('can disable defensive styling', () => {
      const styles = {
        display: 'inline-flex',
        fontSize: '14px',
      };

      const noDefensive = generateConflictResistantStyles(styles, {
        defensive: false,
      });

      expect(noDefensive).toContain('display: inline-flex !important');
      expect(noDefensive).not.toContain('text-transform: none');
    });

    test('converts camelCase to kebab-case', () => {
      const styles = {
        fontSize: '14px',
        textDecoration: 'none',
        verticalAlign: 'baseline',
      };

      const resistant = generateConflictResistantStyles(styles);

      expect(resistant).toContain('font-size: 14px');
      expect(resistant).toContain('text-decoration: none');
      expect(resistant).toContain('vertical-align: baseline');
    });

    test('handles minimal defensive styling', () => {
      const styles = { fontSize: '14px' };

      const full = generateConflictResistantStyles(styles, { minimal: false });
      const minimal = generateConflictResistantStyles(styles, { minimal: true });

      // Minimal should be shorter (fewer defensive properties)
      expect(minimal.length).toBeLessThan(full.length);

      // Both should contain the explicit style
      expect(full).toContain('font-size: 14px');
      expect(minimal).toContain('font-size: 14px');
    });

    test('filters out null/undefined values', () => {
      const styles = {
        fontSize: '14px',
        color: null,
        margin: undefined,
        display: 'inline-flex',
      };

      const resistant = generateConflictResistantStyles(styles);

      expect(resistant).toContain('font-size: 14px');
      expect(resistant).toContain('display: inline-flex');
      expect(resistant).not.toContain('color: null');
      expect(resistant).not.toContain('margin: undefined');
    });
  });

  describe('validateStyleProtection', () => {
    test('validates correct protection', () => {
      const cssString =
        'display: inline-flex !important; font-size: 14px !important; color: #059669 !important';

      const result = validateStyleProtection(cssString);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.protectedProperties).toEqual(['display', 'font-size', 'color']);
    });

    test('identifies missing protection', () => {
      const cssString = 'display: inline-flex; font-size: 14px !important; color: #059669';

      const result = validateStyleProtection(cssString);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('display');
      expect(result.issues[1]).toContain('color');
    });

    test('provides helpful suggestions', () => {
      const cssString = 'display: inline-flex; font-size: 14px';

      const result = validateStyleProtection(cssString);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.includes('!important'))).toBe(true);
    });
  });

  describe('generateUniqueClassName', () => {
    test('generates unique class names with random suffix', () => {
      const className1 = generateUniqueClassName('tim-badge');
      const className2 = generateUniqueClassName('tim-badge');

      expect(className1).toMatch(/^tim-badge-[a-z0-9]{8}$/);
      expect(className2).toMatch(/^tim-badge-[a-z0-9]{8}$/);
      expect(className1).not.toBe(className2); // Should be different
    });

    test('respects custom random length', () => {
      const className = generateUniqueClassName('tim-badge', 12);

      expect(className).toMatch(/^tim-badge-[a-z0-9]{12}$/);
    });

    test('handles errors gracefully', () => {
      // Test with invalid parameters
      const className = generateUniqueClassName('tim-badge', -1);

      expect(className).toBe('tim-badge'); // Should fallback to base name
    });
  });

  describe('createStyleConflictTestElement', () => {
    test('creates test element with applied styles', () => {
      const testStyles = 'color: red !important; font-size: 14px !important';
      const element = createStyleConflictTestElement(testStyles, 'Test Content');

      expect(element.tagName).toBe('SPAN');
      expect(element.className).toBe('tim-style-conflict-test');
      expect(element.textContent).toBe('Test Content');
      expect(element.style.cssText).toContain('color: red');
      expect(element.style.cssText).toContain('font-size: 14px');
    });

    test('includes debugging attributes', () => {
      const testStyles = 'color: red !important';
      const element = createStyleConflictTestElement(testStyles);

      expect(element.getAttribute('data-test-styles')).toBe(testStyles);
      expect(element.getAttribute('data-test-timestamp')).toBeTruthy();
    });

    test('handles errors gracefully', () => {
      // Mock document.createElement to throw
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation(() => {
        throw new Error('Create element failed');
      });

      const element = createStyleConflictTestElement('color: red');

      expect(element.tagName).toBe('SPAN'); // Should create fallback element
      expect(element.textContent).toBe('Test Badge'); // Default text

      // Restore
      document.createElement = originalCreateElement;
    });
  });

  describe('Integration with Real-world Scenarios', () => {
    test('protects badge styles against common host site interference', () => {
      const badgeStyles = {
        display: 'inline-flex',
        fontSize: '14px',
        color: '#059669',
        padding: '4px 8px',
        textDecoration: 'none',
      };

      const protectedStyles = generateConflictResistantStyles(badgeStyles);

      // Verify critical properties are protected
      expect(protectedStyles).toContain('display: inline-flex !important');
      expect(protectedStyles).toContain('font-size: 14px !important');
      expect(protectedStyles).toContain('color: #059669 !important');
      expect(protectedStyles).toContain('padding: 4px 8px !important');
      expect(protectedStyles).toContain('text-decoration: none !important');

      // Verify defensive properties are included
      expect(protectedStyles).toContain('text-transform: none');
      expect(protectedStyles).toContain('float: none');
    });

    test('icon styles get appropriate protection level', () => {
      const iconStyles = {
        width: '12px',
        height: '12px',
        fill: 'currentColor',
        verticalAlign: 'middle',
      };

      const protectedStyles = generateConflictResistantStyles(iconStyles, {
        defensive: false, // Icons typically need less defensive styling
        minimal: true,
      });

      // Critical properties should be protected
      expect(protectedStyles).toContain('vertical-align: middle !important');

      // Should not include extensive defensive properties
      expect(protectedStyles).not.toContain('border-collapse');
      expect(protectedStyles).not.toContain('table-layout');
    });
  });
});
