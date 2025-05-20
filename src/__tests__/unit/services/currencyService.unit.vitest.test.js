/**
 * Unit tests for the CurrencyService adapter
 */

// Import mock first (must be before imports)
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  resetTestMocks,
  mock,
} from '../../../__tests__/setup/vitest-imports.js';

// Mock money.js module
mock('money');

// Import modules after mocking
import { CurrencyService } from '../../../services/currencyService.js';
import * as logger from '../../../utils/logger.js';
import fx from 'money';

describe('CurrencyService', () => {
  let service;

  beforeEach(() => {
    // Create a new service instance for each test
    service = new CurrencyService();

    // Reset all mocked functions
    resetTestMocks();

    // Spy on logger methods
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    // No need to reset fx mock as it will be recreated as needed

    // Reset fx properties for each test
    fx.rates = {};
    fx.base = '';
  });

  describe('createMoney', () => {
    it('should create a money object with valid inputs', () => {
      const result = service.createMoney('10.99', 'USD');

      expect(result).toEqual({
        _type: 'money',
        _value: 10.99,
        _currency: 'USD',
      });
      expect(logger.debug).toHaveBeenCalled();
    });

    it('should handle numeric values with currency symbols', () => {
      const result = service.createMoney('$10.99', 'USD');

      expect(result).toEqual({
        _type: 'money',
        _value: 10.99,
        _currency: 'USD',
      });
    });

    it('should normalize currency codes to uppercase', () => {
      const result = service.createMoney('10.99', 'usd');

      expect(result._currency).toBe('USD');
    });

    it('should return null for invalid numeric string', () => {
      const result = service.createMoney('not-a-number', 'USD');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return null for empty numeric string', () => {
      const result = service.createMoney('', 'USD');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return null for non-string numeric value', () => {
      const result = service.createMoney(10.99, 'USD');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return null for empty currency code', () => {
      const result = service.createMoney('10.99', '');

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should warn but still create money object for non-standard currency codes', () => {
      const result = service.createMoney('10.99', 'INVALID');

      expect(result).not.toBeNull();
      expect(result._currency).toBe('INVALID');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle numeric values with thousand separators', () => {
      const result = service.createMoney('1,234.56', 'USD');

      expect(result._value).toBe(1234.56);
    });
  });

  describe('convertToTime', () => {
    it('should convert prices to time with same currency', () => {
      const price = service.createMoney('50', 'USD');
      const wage = service.createMoney('25', 'USD');

      const result = service.convertToTime(price, wage);

      expect(result).toEqual({
        hours: 2,
        minutes: 0,
      });
    });

    it('should handle partial hours with rounding', () => {
      const price = service.createMoney('12.50', 'USD');
      const wage = service.createMoney('25', 'USD');

      const result = service.convertToTime(price, wage);

      expect(result).toEqual({
        hours: 0,
        minutes: 30,
      });
    });

    it('should handle rounding of minutes correctly', () => {
      const price = service.createMoney('10', 'USD');
      const wage = service.createMoney('7', 'USD');

      // 10/7 = 1.428571... hours
      // 0.428571... * 60 = 25.71... minutes, which should round to 26 minutes
      const result = service.convertToTime(price, wage);

      expect(result).toEqual({
        hours: 1,
        minutes: 26,
      });
    });

    it('should handle case where minutes round to 60', () => {
      const price = service.createMoney('20', 'USD');
      const wage = service.createMoney('10.01', 'USD');

      // 20/10.01 = 1.998... hours
      // 0.998... * 60 = 59.9... minutes, which should round to 60 minutes
      // This should convert to 2 hours, 0 minutes
      const result = service.convertToTime(price, wage);

      expect(result).toEqual({
        hours: 2,
        minutes: 0,
      });
    });

    it('should return null if price is invalid', () => {
      const price = null;
      const wage = service.createMoney('25', 'USD');

      const result = service.convertToTime(price, wage);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return null if wage is invalid', () => {
      const price = service.createMoney('50', 'USD');
      const wage = null;

      const result = service.convertToTime(price, wage);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return null if wage is zero', () => {
      const price = service.createMoney('50', 'USD');
      const wage = service.createMoney('0', 'USD');

      const result = service.convertToTime(price, wage);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return null for different currencies when no exchange rates are available', () => {
      const price = service.createMoney('50', 'EUR');
      const wage = service.createMoney('25', 'USD');

      const result = service.convertToTime(price, wage);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle currency conversion when exchange rates are available', () => {
      // Set up exchange rates for the test
      fx.rates = {
        USD: 1,
        EUR: 0.85,
      };
      fx.base = 'USD';

      // Override the fx function for this test with a custom implementation
      // that does the EUR to USD conversion
      fx.mockReset && fx.mockReset();
      const originalFx = fx;
      global.fx = vi.fn((val) => ({
        from: vi.fn().mockReturnValue({
          to: vi.fn().mockImplementation(() => val / 0.85), // EUR to USD conversion
        }),
      }));
      global.fx.rates = fx.rates;
      global.fx.base = fx.base;

      // Create price and wage in different currencies
      const price = service.createMoney('85', 'EUR');
      const wage = service.createMoney('25', 'USD');

      // EUR 85 should convert to USD 100, which is 4 hours at USD 25/hr
      const result = service.convertToTime(price, wage);

      expect(result).toEqual({
        hours: 4,
        minutes: 0,
      });
    });
  });

  describe('formatMoney', () => {
    it('should format money with default options', () => {
      const money = service.createMoney('10.99', 'USD');

      const result = service.formatMoney(money);

      expect(result).toBe('$10.99');
    });

    it('should format money with currency code when showCode is true', () => {
      const money = service.createMoney('10.99', 'USD');

      const result = service.formatMoney(money, { showCode: true, showSymbol: false });

      expect(result).toBe('10.99 USD');
    });

    it('should format money with custom precision', () => {
      const money = service.createMoney('10.999', 'USD');

      const result = service.formatMoney(money, { precision: 3 });

      expect(result).toBe('$10.999');
    });

    it('should return empty string for invalid money object', () => {
      const result = service.formatMoney(null);

      expect(result).toBe('');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle currencies without symbols', () => {
      const money = service.createMoney('10.99', 'XYZ');

      const result = service.formatMoney(money);

      expect(result).toBe('XYZ10.99');
    });
  });

  describe('getCurrencyCode', () => {
    it('should return the currency code for a valid money object', () => {
      const money = service.createMoney('10.99', 'USD');

      const result = service.getCurrencyCode(money);

      expect(result).toBe('USD');
    });

    it('should return null for invalid money object', () => {
      const result = service.getCurrencyCode(null);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getAmount', () => {
    it('should return the amount for a valid money object', () => {
      const money = service.createMoney('10.99', 'USD');

      const result = service.getAmount(money);

      expect(result).toBe(10.99);
    });

    it('should return null for invalid money object', () => {
      const result = service.getAmount(null);

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // Test private helper methods through public methods
  describe('_isValidMoneyObject', () => {
    it('should identify valid money objects', () => {
      const validMoney = {
        _type: 'money',
        _value: 10.99,
        _currency: 'USD',
      };

      // Test indirectly through getCurrencyCode
      expect(service.getCurrencyCode(validMoney)).toBe('USD');
    });

    it('should reject non-money objects', () => {
      const invalidMoney = {
        value: 10.99,
        currency: 'USD',
      };

      // Test indirectly through getCurrencyCode
      expect(service.getCurrencyCode(invalidMoney)).toBeNull();
    });
  });
});
