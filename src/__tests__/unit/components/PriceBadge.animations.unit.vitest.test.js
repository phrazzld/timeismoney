/**
 * Unit tests for PriceBadge animation functionality
 * Tests micro-interactions and animation states
 */

import { describe, test, expect, beforeEach, vi, afterEach } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../setup/vitest.setup.js';
import { PriceBadge } from '../../../components/PriceBadge.js';
import { clearAllCaches } from '../../../utils/styleCache.js';

describe('PriceBadge Animation Functionality', () => {
  beforeEach(() => {
    resetTestMocks();
    clearAllCaches();
    document.body.innerHTML = '';

    // Mock document.head for keyframe injection
    const mockHead = document.createElement('head');
    Object.defineProperty(document, 'head', {
      value: mockHead,
      writable: true,
    });

    // Mock getElementById for keyframe injection check
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'tim-badge-keyframes') {
        return null; // Keyframes not yet injected
      }
      return null;
    });
  });

  afterEach(() => {
    // Clean up any injected styles
    const keyframeStyle = document.getElementById('tim-badge-keyframes');
    if (keyframeStyle && keyframeStyle.parentNode) {
      keyframeStyle.parentNode.removeChild(keyframeStyle);
    }
  });

  describe('Animation Configuration', () => {
    test('creates badge with default animation settings', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
      });

      const config = badge.getConfig();
      expect(config.enableAnimations).toBe(true);
      expect(config.enableHover).toBe(true);
      expect(config.enableFocus).toBe(true);
      expect(config.animateEntrance).toBe(true);
      expect(config.animateExit).toBe(true);
      expect(config.animateUpdates).toBe(true);
    });

    test('creates badge with animations disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: false,
        enableHover: false,
        enableFocus: false,
      });

      const config = badge.getConfig();
      expect(config.enableAnimations).toBe(false);
      expect(config.enableHover).toBe(false);
      expect(config.enableFocus).toBe(false);
    });

    test('creates badge with selective animation settings', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateEntrance: true,
        animateExit: false,
        animateUpdates: true,
      });

      const config = badge.getConfig();
      expect(config.enableAnimations).toBe(true);
      expect(config.animateEntrance).toBe(true);
      expect(config.animateExit).toBe(false);
      expect(config.animateUpdates).toBe(true);
    });
  });

  describe('Entrance Animations', () => {
    test('applies entrance animation styles when rendering', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateEntrance: true,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should include animation properties for entrance
      expect(styles).toContain('animation-name: tim-badge-entrance');
      expect(styles).toContain('animation-duration: 250ms');
      expect(styles).toContain('animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1)');
      expect(styles).toContain('will-change: opacity, transform');
    });

    test('skips entrance animation when disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: false,
        animateEntrance: false,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should not include animation properties
      expect(styles).not.toContain('animation-name');
      expect(styles).not.toContain('will-change');
    });

    test('injects keyframes into document head during animation', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateEntrance: true,
      });

      badge.render();

      // Should have added keyframes to head
      const head = document.head;
      expect(head.children.length).toBeGreaterThan(0);
      const styleElement = head.children[0];
      expect(styleElement.id).toBe('tim-badge-keyframes');
      expect(styleElement.textContent).toContain('@keyframes tim-badge-entrance');
    });
  });

  describe('Hover and Focus Effects', () => {
    test('includes hover transition properties', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        enableHover: true,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should include hover transition properties
      expect(styles).toContain('transition');
      expect(styles).toContain('opacity');
      expect(styles).toContain('transform');
      expect(styles).toContain('150ms ease-out');
    });

    test('includes focus transition properties', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        enableFocus: true,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should include focus transition properties
      expect(styles).toContain('transition');
      expect(styles).toContain('box-shadow');
      expect(styles).toContain('outline');
      expect(styles).toContain('100ms ease-out');
    });

    test('excludes hover effects when disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        enableHover: false,
      });

      const element = badge.render();
      const styles = element.style.cssText;

      // Should not include hover-specific properties in transition
      const transitionMatch = styles.match(/transition: ([^;]+)/);
      if (transitionMatch) {
        const transition = transitionMatch[1];
        expect(transition).not.toContain('opacity 150ms ease-out');
        expect(transition).not.toContain('transform 150ms ease-out');
      }
    });
  });

  describe('Update Animations', () => {
    test('applies update animation during content changes', async () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateUpdates: true,
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Update the badge content
      badge.update({
        originalPrice: '$39.99',
        timeDisplay: '4h 0m',
      });

      // Should temporarily apply update animation
      const initialStyles = element.style.cssText;
      expect(initialStyles).toContain('animation-name: tim-badge-update');

      // Wait for update animation to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should have updated content
      expect(element.textContent).toContain('4h 0m');
    });

    test('updates content immediately when animations disabled', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: false,
        animateUpdates: false,
      });

      const element = badge.render();
      badge.update({
        originalPrice: '$39.99',
        timeDisplay: '4h 0m',
      });

      // Should update immediately without animation
      expect(element.textContent).toContain('4h 0m');
      expect(element.style.cssText).not.toContain('animation-name');
    });
  });

  describe('Exit Animations', () => {
    test('applies exit animation during destruction', async () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateExit: true,
      });

      const element = badge.render();
      document.body.appendChild(element);

      // Spy on the element's style to capture exit animation
      const styleSetSpy = vi.fn();
      const originalCssText = element.style.cssText;
      Object.defineProperty(element.style, 'cssText', {
        get: () => originalCssText,
        set: styleSetSpy,
      });

      await badge.destroy();

      // Should have applied exit animation styles
      expect(styleSetSpy).toHaveBeenCalledWith(
        expect.stringContaining('animation-name: tim-badge-exit')
      );
      expect(badge.isDestroyedState()).toBe(true);
    });

    test('destroys immediately when exit animation disabled', async () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: false,
        animateExit: false,
      });

      const element = badge.render();
      document.body.appendChild(element);

      const startTime = Date.now();
      await badge.destroy();
      const endTime = Date.now();

      // Should complete quickly without animation delay
      expect(endTime - startTime).toBeLessThan(50);
      expect(badge.isDestroyedState()).toBe(true);
    });
  });

  describe('Accessibility Compliance', () => {
    test.skip('respects prefers-reduced-motion in keyframes', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateEntrance: true,
      });

      badge.render();

      const keyframeStyle = document.getElementById('tim-badge-keyframes');
      expect(keyframeStyle).toBeTruthy();
      if (keyframeStyle) {
        expect(keyframeStyle.textContent).toContain(
          '@media (prefers-reduced-motion: no-preference)'
        );
      }
    });

    test('animation settings can be globally controlled', () => {
      // Test that animation settings respect user preferences
      const badge1 = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
      });

      const badge2 = new PriceBadge({
        originalPrice: '$39.99',
        timeDisplay: '4h 0m',
        enableAnimations: false, // User disabled animations
      });

      const element1 = badge1.render();
      const element2 = badge2.render();

      expect(element1.style.cssText).toContain('animation-name');
      expect(element2.style.cssText).not.toContain('animation-name');
    });
  });

  describe('Performance Optimization', () => {
    test('keyframes are injected only once per page', () => {
      // Mock getElementById to return existing keyframes after first injection
      let injected = false;
      vi.spyOn(document, 'getElementById').mockImplementation((id) => {
        if (id === 'tim-badge-keyframes') {
          if (injected) {
            return { id: 'tim-badge-keyframes' }; // Simulate existing element
          }
          injected = true;
          return null; // First time, not found
        }
        return null;
      });

      const badge1 = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
      });

      const badge2 = new PriceBadge({
        originalPrice: '$39.99',
        timeDisplay: '4h 0m',
        enableAnimations: true,
      });

      badge1.render();
      badge2.render();

      // Should only have one keyframe style element
      const head = document.head;
      const keyframeElements = Array.from(head.children).filter(
        (child) => child.id === 'tim-badge-keyframes'
      );
      expect(keyframeElements.length).toBeLessThanOrEqual(1);
    });

    test('will-change property is applied for performance', () => {
      const badge = new PriceBadge({
        originalPrice: '$29.99',
        timeDisplay: '3h 0m',
        enableAnimations: true,
        animateEntrance: true,
      });

      const element = badge.render();
      expect(element.style.cssText).toContain('will-change: opacity, transform');
    });
  });
});
