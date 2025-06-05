/**
 * Tests for Site Handlers Module
 * Tests the unified site-specific price extraction handlers
 */

import { describe, test, expect, vi, beforeEach, afterEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';

// Import the module we're going to create
import {
  registerHandler,
  getHandlerForCurrentSite,
  processWithSiteHandler,
  clearHandlers,
  cdiscountHandler,
  gearbestHandler,
  // Re-exported for testing
  SITE_HANDLERS,
} from '../../content/siteHandlers.js';

describe('Site Handlers Module', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
    clearHandlers(); // Clear any registered handlers
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Infrastructure', () => {
    test('exports required functions', () => {
      expect(registerHandler).toBeDefined();
      expect(getHandlerForCurrentSite).toBeDefined();
      expect(processWithSiteHandler).toBeDefined();
      expect(clearHandlers).toBeDefined();
    });

    test('registers handler for multiple domains', () => {
      const mockHandler = {
        name: 'test',
        domains: ['test.com', 'test.co.uk'],
        process: vi.fn(),
        isTargetNode: vi.fn(),
      };

      registerHandler(mockHandler);

      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { hostname: 'test.com' },
        writable: true,
      });

      const handler = getHandlerForCurrentSite();
      expect(handler).toBe(mockHandler);

      // Test alternate domain
      window.location.hostname = 'test.co.uk';
      const handler2 = getHandlerForCurrentSite();
      expect(handler2).toBe(mockHandler);
    });

    test('returns null for unsupported domains', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unsupported.com' },
        writable: true,
      });

      const handler = getHandlerForCurrentSite();
      expect(handler).toBeNull();
    });

    test('strips www prefix from domain', () => {
      const mockHandler = {
        name: 'test',
        domains: ['example.com'],
        process: vi.fn(),
        isTargetNode: vi.fn(),
      };

      registerHandler(mockHandler);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'www.example.com' },
        writable: true,
      });

      const handler = getHandlerForCurrentSite();
      expect(handler).toBe(mockHandler);
    });

    test('processWithSiteHandler delegates to appropriate handler', () => {
      const mockHandler = {
        name: 'test',
        domains: ['test.com'],
        process: vi.fn().mockReturnValue(true),
        isTargetNode: vi.fn(),
      };

      registerHandler(mockHandler);

      Object.defineProperty(window, 'location', {
        value: { hostname: 'test.com' },
        writable: true,
      });

      const node = document.createElement('div');
      const callback = vi.fn();
      const settings = {};

      const result = processWithSiteHandler(node, callback, settings);

      expect(mockHandler.process).toHaveBeenCalledWith(node, callback, settings);
      expect(result).toBe(true);
    });

    test('processWithSiteHandler returns false for unsupported sites', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unsupported.com' },
        writable: true,
      });

      const node = document.createElement('div');
      const callback = vi.fn();
      const settings = {};

      const result = processWithSiteHandler(node, callback, settings);

      expect(result).toBe(false);
    });
  });

  describe('Cdiscount Handler', () => {
    beforeEach(() => {
      registerHandler(cdiscountHandler);
      Object.defineProperty(window, 'location', {
        value: { hostname: 'cdiscount.com' },
        writable: true,
      });
    });

    test('handler is registered for cdiscount.com', () => {
      const handler = getHandlerForCurrentSite();
      expect(handler).toBe(cdiscountHandler);
      expect(handler.name).toBe('cdiscount');
    });

    test('detects Cdiscount price nodes', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'price';

      expect(cdiscountHandler.isTargetNode(priceNode)).toBe(true);

      const nonPriceNode = document.createElement('div');
      nonPriceNode.className = 'other';

      expect(cdiscountHandler.isTargetNode(nonPriceNode)).toBe(false);
    });

    test('extracts "449€ 00" split format', () => {
      const container = document.createElement('div');
      container.innerHTML =
        '<span class="c-price c-price--promo c-price--md">449€ <span itemprop="priceCurrency">00</span></span>';

      const callback = vi.fn();
      const settings = {};

      const result = cdiscountHandler.process(container.firstChild, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      // Check that callback was called with combined price
      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toContain('449');
      expect(callArg.nodeValue).toContain('00');
    });

    test('extracts "99€99" format', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'price';
      priceNode.textContent = '99€99';

      const callback = vi.fn();
      const settings = {};

      const result = cdiscountHandler.process(priceNode, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toBe('99€99');
    });

    test('handles standard euro format', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'price';
      priceNode.textContent = '€ 23,90';

      const callback = vi.fn();
      const settings = {};

      const result = cdiscountHandler.process(priceNode, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('handles superscript price components', () => {
      const container = document.createElement('div');
      container.className = 'price';
      container.innerHTML =
        '<span>129</span><span class="priceSup">€</span><span class="priceSup">95</span>';

      const callback = vi.fn();
      const settings = {};

      const result = cdiscountHandler.process(container, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      // Should combine to "129€95"
      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toMatch(/129.*€.*95/);
    });
  });

  describe('Gearbest Handler', () => {
    beforeEach(() => {
      registerHandler(gearbestHandler);
      Object.defineProperty(window, 'location', {
        value: { hostname: 'gearbest.com' },
        writable: true,
      });
    });

    test('handler is registered for gearbest.com', () => {
      const handler = getHandlerForCurrentSite();
      expect(handler).toBe(gearbestHandler);
      expect(handler.name).toBe('gearbest');
    });

    test('detects Gearbest price nodes', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'goods-price';

      expect(gearbestHandler.isTargetNode(priceNode)).toBe(true);

      const woocommerceNode = document.createElement('span');
      woocommerceNode.className = 'woocommerce-Price-amount';

      expect(gearbestHandler.isTargetNode(woocommerceNode)).toBe(true);
    });

    test('extracts nested currency spans', () => {
      const container = document.createElement('div');
      container.className = 'goods-price';
      container.innerHTML = '<span class="currency">US$</span><span class="value">34.56</span>';

      const callback = vi.fn();
      const settings = {};

      const result = gearbestHandler.process(container, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      // Should combine to "US$34.56"
      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toBe('US$34.56');
    });

    test('handles "US$" prefix format', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'goods-price';
      priceNode.textContent = 'US$ 18.88';

      const callback = vi.fn();
      const settings = {};

      const result = gearbestHandler.process(priceNode, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toBe('US$ 18.88');
    });

    test('handles WooCommerce structure', () => {
      const container = document.createElement('span');
      container.className = 'woocommerce-Price-amount amount';
      container.innerHTML =
        '<bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>';

      const callback = vi.fn();
      const settings = {};

      const result = gearbestHandler.process(container, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      // Should extract "6.26$"
      const callArg = callback.mock.calls[0][0];
      expect(callArg.nodeValue).toMatch(/6\.26.*\$/);
    });

    test('handles standard dollar format', () => {
      const priceNode = document.createElement('div');
      priceNode.className = 'goods-price';
      priceNode.textContent = '$4.99';

      const callback = vi.fn();
      const settings = {};

      const result = gearbestHandler.process(priceNode, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Integration with Existing Handlers', () => {
    test('registers Amazon handler adapter', async () => {
      // Dynamically import to test registration
      const { registerExistingHandlers } = await import('../../content/siteHandlers.js');
      registerExistingHandlers();

      // Wait for async registration to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      Object.defineProperty(window, 'location', {
        value: { hostname: 'amazon.com' },
        writable: true,
      });

      const handler = getHandlerForCurrentSite();
      expect(handler).toBeDefined();
      expect(handler.name).toBe('amazon');
    });

    test('registers eBay handler adapter', async () => {
      const { registerExistingHandlers } = await import('../../content/siteHandlers.js');
      registerExistingHandlers();

      // Wait for async registration to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      Object.defineProperty(window, 'location', {
        value: { hostname: 'ebay.com' },
        writable: true,
      });

      const handler = getHandlerForCurrentSite();
      expect(handler).toBeDefined();
      expect(handler.name).toBe('ebay');
    });
  });

  describe('Real Examples from examples.md', () => {
    test('Cdiscount "449€ 00" from examples.md', () => {
      registerHandler(cdiscountHandler);
      Object.defineProperty(window, 'location', {
        value: { hostname: 'cdiscount.com' },
        writable: true,
      });

      const container = document.createElement('div');
      // Exact HTML from examples.md
      container.innerHTML =
        '<span class="c-price c-price--promo c-price--md"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">449€ </font></font><span itemprop="priceCurrency"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">00</font></font></span></span>';

      const callback = vi.fn();
      const result = processWithSiteHandler(container.firstChild, callback, {});

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('Gearbest nested currency from examples.md', () => {
      registerHandler(gearbestHandler);
      Object.defineProperty(window, 'location', {
        value: { hostname: 'gearbest.ma' }, // Note: .ma domain
        writable: true,
      });

      const container = document.createElement('div');
      // Exact HTML from examples.md
      container.innerHTML =
        '<span class="woocommerce-Price-amount amount"><bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi></span>';

      const callback = vi.fn();
      const result = processWithSiteHandler(container.firstChild, callback, {});

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });
  });
});
