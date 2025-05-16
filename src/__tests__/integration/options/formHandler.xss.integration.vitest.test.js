/**
 * XSS Injection Tests for formHandler
 *
 * These tests verify that the form handler correctly sanitizes user inputs
 * to prevent cross-site scripting (XSS) attacks.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';
import {
  sanitizeTextInput,
  sanitizeCurrencySymbol,
  sanitizeCurrencyCode,
  sanitizeNumericInput,
  saveOptions,
} from '../../../options/formHandler.js';
import * as storage from '../../../utils/storage.js';
import * as validator from '../../../options/validator.js';

describe('FormHandler XSS Protection', () => {
  beforeEach(() => {
    resetTestMocks();
  });
  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the tests
    setupTestDom();

    // Add additional DOM elements for this specific test
    document.body.innerHTML = `
      <div id="status"></div>
      <input id="currency-symbol" value="$" />
      <input id="currency-code" value="USD" />
      <select id="frequency"><option value="hourly" selected>Hourly</option></select>
      <input id="amount" value="15.00" />
      <input id="thousands" value="commas" />
      <input id="decimal" value="dot" />
      <input id="debounce-interval" value="200" />
      <input id="enable-dynamic-scanning" type="checkbox" />
      <div id="formatting" style="display: none;"></div>
    `;

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the chrome.i18n.getMessage function
    chrome.i18n.getMessage = vi.fn((key) => {
      const messages = {
        loadError: 'Failed to load your settings. Please try again.',
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
        symbolErr: 'Please enter a currency symbol.',
        symbolLengthErr: 'Currency symbol must be 1-3 characters long.',
        symbolFormatErr:
          'Currency symbol can only contain alphanumeric characters and common currency symbols.',
        codeErr: 'Please enter a currency code.',
        codeFormatErr: 'Currency code must be 3 uppercase letters (e.g., USD, EUR, GBP).',
        amountErr: 'Please enter a valid amount.',
        positiveAmountErr: 'Amount must be greater than zero.',
      };
      return messages[key] || key;
    });

    // Mock window.close
    window.close = vi.fn();
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();

    resetTestMocks();
  });

  describe('Sanitization function security', () => {
    test('sanitizeTextInput handles complex XSS payloads', () => {
      const payloads = [
        // Basic script tag
        '<script>alert("XSS")</script>',

        // Event handler XSS
        '<img src="x" onerror="alert(\'XSS\')">',

        // JavaScript URL
        '<a href="javascript:alert(\'XSS\')">Click me</a>',

        // Data URI
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">Click me</a>',

        // CSS-based XSS
        '<div style="background-image:url(javascript:alert(\'XSS\'))">',

        // Nested vectors
        '<iframe src="javascript:alert(`subframe`);"></iframe>',

        // Encoded XSS payload
        '&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;',

        // SVG-based XSS
        '<svg><script>alert(1)</script></svg>',

        // Mixed case to evade filters
        '<ScRiPt>alert("XSS")</sCrIpT>',

        // Embedded tab/newlines
        '<img\nsrc="x"\nonerror="alert(\'XSS\')">',
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeTextInput(payload);

        // Verify all < and > are escaped (which prevents script execution)
        expect(sanitized.includes('<')).toBe(false);
        expect(sanitized.includes('>')).toBe(false);

        // Verify quotes are escaped (which prevents attribute-based attacks)
        expect(sanitized.includes('"')).toBe(false);
        expect(sanitized.includes("'")).toBe(false);

        // Test that when we add the sanitized output to the DOM, it doesn't execute scripts
        const testDiv = document.createElement('div');
        testDiv.innerHTML = sanitized;
        expect(testDiv.querySelector('script')).toBeNull();
        expect(testDiv.querySelector('[onerror]')).toBeNull();
      }
    });

    test('sanitizeCurrencySymbol blocks XSS in currency symbols', () => {
      const payloads = [
        // Script tag
        '<script>alert("XSS")</script>',

        // XSS with currency symbol
        '$<script>alert(1)</script>',

        // Complex nested attack
        '$<img src=x onerror=alert(1)>',

        // HTML-encoded attack
        '$&lt;script&gt;alert(1)&lt;/script&gt;',

        // Mixed case to evade filters
        '$<ScRiPt>alert(1)</sCrIpT>',

        // Event handler in tag
        '<img src=x onerror=alert(1)>$',

        // Special case that might bypass filters
        '<script/>alert(1)<script/>$',

        // Unusual syntax
        '$//<script></script>//$.alert()',
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeCurrencySymbol(payload);

        // Ensure result contains no script tags or event handlers
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/onerror=/i);
        expect(sanitized).not.toMatch(/alert\(/i);

        // For inputs containing legitimate currency symbols, verify they're preserved
        // Check if the original had a $ and that it was preserved
        const hasDollarSign = payload.includes('$');
        expect(hasDollarSign ? sanitized.includes('$') : true).toBe(true);

        // Verify only allowed characters passed through
        expect(sanitized).toMatch(/^[$€£¥₹₽¢₩₪₴₺₼₸฿₫₭₲₡₱a-zA-Z0-9]*$/);
      }
    });

    test('sanitizeCurrencyCode blocks XSS in currency codes', () => {
      const payloads = [
        // Script in currency code
        'USD<script>alert(1)</script>',

        // HTML element with event handler
        'EU<img src=x onerror=alert(1)>R',

        // Invalid characters with code
        'USD$<script>alert(1)</script>',

        // Script tag only
        '<script>alert("XSS")</script>',

        // Mix of valid and script
        'U<script>alert(1)</script>SD',

        // Event handler in a tag
        '<img src=x onerror=alert(1)>USD',
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeCurrencyCode(payload);

        // Ensure result only contains uppercase letters
        expect(sanitized).toMatch(/^[A-Z]*$/);

        // Verify no XSS elements remain
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/alert/i);
        expect(sanitized).not.toMatch(/onerror=/i);

        // For inputs containing legitimate currency codes, verify applicable letters are preserved
        const hasUSD = payload.includes('USD');
        const codeMatches = hasUSD && sanitized.includes('USD');
        // If it had USD, it should still have it after sanitization
        expect(hasUSD ? codeMatches : true).toBe(true);
      }
    });

    test('sanitizeNumericInput blocks XSS in numeric inputs', () => {
      const payloads = [
        // Script with number
        '123<script>alert(1)</script>',

        // Event handler in tag
        '45<img src=x onerror=alert(1)>67',

        // Decimal + XSS
        '12.34<script>alert("XSS")</script>',

        // Currency format + XSS
        '1,234.56<script>alert(1)</script>',

        // HTML entity encoding
        '123&lt;script&gt;alert(1)&lt;/script&gt;',

        // Script only
        '<script>alert("XSS")</script>',

        // Scientific notation (special case)
        '123e10',

        // Negative number with XSS
        '-123<script>alert(1)</script>',
      ];

      for (const payload of payloads) {
        const sanitized = sanitizeNumericInput(payload);

        // Verify the result only contains numeric characters and separators
        expect(sanitized).toMatch(/^[0-9.,\s]*$/);

        // Ensure no script or HTML remains
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/alert/i);
        expect(sanitized).not.toMatch(/onerror=/i);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');

        // Special handling for exponential notation
        const isExponential = payload === '123e10';
        expect(isExponential ? sanitized === '123' : true).toBe(true);

        // Verify negative sign removal (per existing code behavior)
        const isNegative = payload.startsWith('-');
        expect(isNegative ? !sanitized.includes('-') : true).toBe(true);
      }
    });
  });

  describe('End-to-end integration tests for XSS prevention', () => {
    test('Each sanitization function independently blocks various attack vectors', () => {
      // More advanced payloads covering different XSS techniques
      const advancedPayloads = [
        // DOM XSS
        '<div id="test" onclick="alert(1)">Click me</div>',

        // XSS via HTML attributes
        '<p title="</p><script>alert(1)</script>">',

        // Protocol handler XSS
        '<a href="javascript&#58;alert(1)">Click me</a>',

        // XSS via CSS
        '<div style="color: expression(alert(1))">Text</div>',

        // Unicode escapes
        '<img src="\\x01javascript:alert(1)">',

        // Unusual encodings
        '<a href="jav&#x09;ascript:alert(1)">Click me</a>',

        // Meta refresh XSS
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',

        // SVG animation XSS
        '<svg><animate attributeName="onload" values="alert(1)"></animate></svg>',

        // XML-based vectors
        '"><script xmlns="http://www.w3.org/1999/xhtml">alert(1)</script>',
      ];

      // Test each payload with all sanitization functions
      advancedPayloads.forEach((payload) => {
        // Check text sanitization
        const sanitizedText = sanitizeTextInput(payload);
        expect(sanitizedText).not.toContain('<');
        expect(sanitizedText).not.toContain('>');

        // Check currency symbol sanitization
        const sanitizedSymbol = sanitizeCurrencySymbol(payload);
        expect(sanitizedSymbol).toMatch(/^[$€£¥₹₽¢₩₪₴₺₼₸฿₫₭₲₡₱a-zA-Z0-9]*$/);

        // Check currency code sanitization
        const sanitizedCode = sanitizeCurrencyCode(payload);
        expect(sanitizedCode).toMatch(/^[A-Z]*$/);

        // Check numeric input sanitization
        const sanitizedNumeric = sanitizeNumericInput(payload);
        expect(sanitizedNumeric).toMatch(/^[0-9.,\s]*$/);
      });
    });

    test('Sanitization is applied before saving options', () => {
      // Create mock getElementById to return elements with known XSS payloads
      const realGetElementById = document.getElementById;
      const mockElements = {
        'currency-symbol': { value: '$<script>alert("XSS")</script>' },
        'currency-code': { value: 'USD<script>alert("XSS")</script>' },
        frequency: { value: 'hourly<script>alert("XSS")</script>' },
        amount: { value: '15.00<img src=x onerror=alert(1)>' },
        thousands: { value: 'commas<script>alert("XSS")</script>' },
        decimal: { value: 'dot<script>alert("XSS")</script>' },
        'debounce-interval': { value: '200<script>alert("XSS")</script>' },
        'enable-dynamic-scanning': { checked: true },
        status: { textContent: '' },
      };

      document.getElementById = vi.fn((id) => mockElements[id] || { value: '' });

      // Mock validation to always return true for this test
      vi.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
      vi.spyOn(validator, 'validateCurrencyCode').mockReturnValue(true);
      vi.spyOn(validator, 'validateAmount').mockReturnValue(true);
      vi.spyOn(validator, 'validateDebounceInterval').mockReturnValue(true);

      // Mock saveSettings to capture what gets saved
      vi.spyOn(storage, 'saveSettings').mockImplementation((settings) => Promise.resolve(settings));

      // Call saveOptions
      saveOptions();

      // Verify saveSettings was called
      expect(storage.saveSettings).toHaveBeenCalled();

      // Verify the saveSettings mock has call data
      expect(storage.saveSettings.mock.calls.length).toBeGreaterThan(0);

      // Get the settings object from the first call
      const settings = storage.saveSettings.mock.calls[0][0];

      // Create an array of all string values from the settings
      const stringValues = Object.values(settings).filter((value) => typeof value === 'string');

      // Verify none of the string values contain XSS vectors
      stringValues.forEach((value) => {
        expect(value).not.toContain('<');
        expect(value).not.toContain('>');
      });

      // Restore original function
      document.getElementById = realGetElementById;
    });
  });
});
