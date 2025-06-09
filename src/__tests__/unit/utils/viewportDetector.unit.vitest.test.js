/**
 * Tests for the viewportDetector utility functions
 * Focuses on device type detection and responsive context creation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  BREAKPOINTS,
  detectDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  getScreenWidth,
  getScreenHeight,
  isTouchDevice,
  createResponsiveContext,
  addResponsiveListener,
} from '../../../utils/viewportDetector.js';

describe('Viewport Detector', () => {
  let originalWindow;
  let mockWindow;

  beforeEach(() => {
    originalWindow = global.window;

    // Mock window object
    mockWindow = {
      innerWidth: 1024,
      innerHeight: 768,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    global.window = mockWindow;
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      maxTouchPoints: 0,
    };
  });

  afterEach(() => {
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('BREAKPOINTS constant', () => {
    test('defines correct breakpoint ranges', () => {
      expect(BREAKPOINTS.mobile.max).toBe(767);
      expect(BREAKPOINTS.tablet.max).toBe(1023);
      expect(BREAKPOINTS.desktop.min).toBe(1024);
      expect(BREAKPOINTS.small.max).toBe(479);
      expect(BREAKPOINTS.medium.max).toBe(767);
    });
  });

  describe('detectDeviceType', () => {
    test('returns desktop for wide screen', () => {
      mockWindow.innerWidth = 1200;
      expect(detectDeviceType()).toBe('desktop');
    });

    test('returns tablet for medium screen', () => {
      mockWindow.innerWidth = 800;
      expect(detectDeviceType()).toBe('tablet');
    });

    test('returns mobile for narrow screen', () => {
      mockWindow.innerWidth = 375;
      expect(detectDeviceType()).toBe('mobile');
    });

    test('returns desktop when window is undefined', () => {
      global.window = undefined;
      expect(detectDeviceType()).toBe('desktop');
    });

    test('returns desktop when innerWidth is missing', () => {
      delete mockWindow.innerWidth;
      expect(detectDeviceType()).toBe('desktop');
    });

    test('handles edge cases at breakpoint boundaries', () => {
      // Exactly at mobile/tablet boundary
      mockWindow.innerWidth = 767;
      expect(detectDeviceType()).toBe('mobile');

      mockWindow.innerWidth = 768;
      expect(detectDeviceType()).toBe('tablet');

      // Exactly at tablet/desktop boundary
      mockWindow.innerWidth = 1023;
      expect(detectDeviceType()).toBe('tablet');

      mockWindow.innerWidth = 1024;
      expect(detectDeviceType()).toBe('desktop');
    });
  });

  describe('Convenience functions', () => {
    test('isMobile returns correct boolean', () => {
      mockWindow.innerWidth = 375;
      expect(isMobile()).toBe(true);

      mockWindow.innerWidth = 800;
      expect(isMobile()).toBe(false);
    });

    test('isTablet returns correct boolean', () => {
      mockWindow.innerWidth = 800;
      expect(isTablet()).toBe(true);

      mockWindow.innerWidth = 375;
      expect(isTablet()).toBe(false);

      mockWindow.innerWidth = 1200;
      expect(isTablet()).toBe(false);
    });

    test('isDesktop returns correct boolean', () => {
      mockWindow.innerWidth = 1200;
      expect(isDesktop()).toBe(true);

      mockWindow.innerWidth = 800;
      expect(isDesktop()).toBe(false);
    });
  });

  describe('getScreenWidth and getScreenHeight', () => {
    test('returns actual dimensions when available', () => {
      mockWindow.innerWidth = 1440;
      mockWindow.innerHeight = 900;

      expect(getScreenWidth()).toBe(1440);
      expect(getScreenHeight()).toBe(900);
    });

    test('returns fallback values when window is unavailable', () => {
      global.window = undefined;

      expect(getScreenWidth()).toBe(1024);
      expect(getScreenHeight()).toBe(768);
    });

    test('returns fallback when properties are missing', () => {
      delete mockWindow.innerWidth;
      delete mockWindow.innerHeight;

      expect(getScreenWidth()).toBe(1024);
      expect(getScreenHeight()).toBe(768);
    });
  });

  describe('isTouchDevice', () => {
    test('detects touch support via ontouchstart', () => {
      mockWindow.ontouchstart = {};
      expect(isTouchDevice()).toBe(true);
    });

    test('detects touch support via maxTouchPoints', () => {
      global.navigator.maxTouchPoints = 1;
      expect(isTouchDevice()).toBe(true);
    });

    test('detects mobile user agents as touch devices', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)';
      mockWindow.innerWidth = 375; // Small screen
      expect(isTouchDevice()).toBe(true);
    });

    test('returns false for desktop without touch', () => {
      global.navigator.maxTouchPoints = 0;
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      delete mockWindow.ontouchstart;
      mockWindow.innerWidth = 1440;
      expect(isTouchDevice()).toBe(false);
    });

    test('handles missing navigator gracefully', () => {
      global.navigator = undefined;
      expect(isTouchDevice()).toBe(false);
    });
  });

  describe('createResponsiveContext', () => {
    test('creates complete context for desktop', () => {
      mockWindow.innerWidth = 1440;
      mockWindow.innerHeight = 900;

      const context = createResponsiveContext();

      expect(context.deviceType).toBe('desktop');
      expect(context.width).toBe(1440);
      expect(context.height).toBe(900);
      expect(context.isDesktop).toBe(true);
      expect(context.isMobile).toBe(false);
      expect(context.isTablet).toBe(false);
      expect(context.aspectRatio).toBe(1440 / 900);
    });

    test('creates complete context for mobile', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;

      const context = createResponsiveContext();

      expect(context.deviceType).toBe('mobile');
      expect(context.width).toBe(375);
      expect(context.height).toBe(667);
      expect(context.isMobile).toBe(true);
      expect(context.isDesktop).toBe(false);
      expect(context.isTablet).toBe(false);
    });

    test('provides correct scaling factors', () => {
      // Mobile scaling
      mockWindow.innerWidth = 375;
      const mobileContext = createResponsiveContext();
      expect(mobileContext.scale.text).toBe(0.9);
      expect(mobileContext.scale.icon).toBe(0.85);
      expect(mobileContext.scale.spacing).toBe(0.8);

      // Desktop scaling
      mockWindow.innerWidth = 1440;
      const desktopContext = createResponsiveContext();
      expect(desktopContext.scale.text).toBe(1.0);
      expect(desktopContext.scale.icon).toBe(1.0);
      expect(desktopContext.scale.spacing).toBe(1.0);
    });

    test('identifies small and large mobile correctly', () => {
      // Small mobile
      mockWindow.innerWidth = 320;
      let context = createResponsiveContext();
      expect(context.isSmallMobile).toBe(true);
      expect(context.isLargeMobile).toBe(false);

      // Large mobile
      mockWindow.innerWidth = 600;
      context = createResponsiveContext();
      expect(context.isSmallMobile).toBe(false);
      expect(context.isLargeMobile).toBe(true);

      // Tablet (not mobile)
      mockWindow.innerWidth = 800;
      context = createResponsiveContext();
      expect(context.isSmallMobile).toBe(false);
      expect(context.isLargeMobile).toBe(false);
    });

    test('returns fallback context on error', () => {
      // Force an error by making innerWidth throw
      Object.defineProperty(mockWindow, 'innerWidth', {
        get() {
          throw new Error('Property access error');
        },
      });

      const context = createResponsiveContext();

      expect(context.deviceType).toBe('desktop');
      expect(context.width).toBe(1024);
      expect(context.height).toBe(768);
      expect(context.isDesktop).toBe(true);
    });
  });

  describe('addResponsiveListener', () => {
    test('adds resize event listener', () => {
      const callback = vi.fn();
      addResponsiveListener(callback);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('returns cleanup function', () => {
      const callback = vi.fn();
      const cleanup = addResponsiveListener(callback);

      expect(typeof cleanup).toBe('function');

      cleanup();
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('debounces callback calls', (done) => {
      const callback = vi.fn();
      addResponsiveListener(callback, 50); // 50ms debounce

      // Get the actual resize handler
      const resizeHandler = mockWindow.addEventListener.mock.calls[0][1];

      // Call resize handler multiple times rapidly
      resizeHandler();
      resizeHandler();
      resizeHandler();

      // Callback should not be called immediately
      expect(callback).not.toHaveBeenCalled();

      // Wait for debounce period
      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            deviceType: expect.any(String),
            width: expect.any(Number),
            height: expect.any(Number),
          })
        );
        done();
      }, 60);
    });

    test('handles invalid callback gracefully', () => {
      const cleanup = addResponsiveListener(null);
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    test('handles missing window gracefully', () => {
      global.window = undefined;
      const cleanup = addResponsiveListener(vi.fn());
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    });

    test('handles callback errors gracefully', (done) => {
      const callback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      addResponsiveListener(callback, 10);
      const resizeHandler = mockWindow.addEventListener.mock.calls[0][1];

      // Should not throw despite callback error
      expect(() => resizeHandler()).not.toThrow();

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('Real-world scenarios', () => {
    test('correctly identifies iPhone dimensions', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 667;
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)';

      const context = createResponsiveContext();
      expect(context.deviceType).toBe('mobile');
      expect(context.isTouchDevice).toBe(true);
    });

    test('correctly identifies iPad dimensions', () => {
      mockWindow.innerWidth = 768;
      mockWindow.innerHeight = 1024;
      global.navigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X)';

      const context = createResponsiveContext();
      expect(context.deviceType).toBe('tablet');
    });

    test('correctly identifies desktop with large monitor', () => {
      mockWindow.innerWidth = 2560;
      mockWindow.innerHeight = 1440;

      const context = createResponsiveContext();
      expect(context.deviceType).toBe('desktop');
      expect(context.scale.text).toBe(1.0);
    });
  });
});
