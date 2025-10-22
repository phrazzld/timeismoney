/**
 * Tests for the unified converter.js utility
 * Ensures all functions from both original modules work correctly
 */
import { describe, test, expect } from '../setup/vitest-imports.js';
import {
  normalizePrice,
  calculateHourlyWage,
  convertToTime,
  formatTimeSnippet,
  formatTimeCompact,
  formatPriceWithTime,
  convertPriceToTimeString,
} from '../../utils/converter';

describe('normalizePrice', () => {
  test('normalizes price with commas as thousands separator and dot as decimal', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    expect(normalizePrice('$1,234.56', thousands, decimal)).toBe(1234.56);
  });

  test('normalizes price with spaces as thousands separator and comma as decimal', () => {
    const thousands = /\s/g;
    const decimal = /,/g;
    expect(normalizePrice('€1 234,56', thousands, decimal)).toBe(1234.56);
  });

  test('handles price without thousands separator', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    expect(normalizePrice('$123.45', thousands, decimal)).toBe(123.45);
  });

  test('handles price without decimal part', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    expect(normalizePrice('$1,234', thousands, decimal)).toBe(1234.0);
  });

  test('handles various currency symbols', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    expect(normalizePrice('£1,234.56', thousands, decimal)).toBe(1234.56);
    expect(normalizePrice('¥1,234.56', thousands, decimal)).toBe(1234.56);
    expect(normalizePrice('₹1,234.56', thousands, decimal)).toBe(1234.56);
    expect(normalizePrice('₩1,234.56', thousands, decimal)).toBe(1234.56);
    expect(normalizePrice('1,234.56kr', thousands, decimal)).toBe(1234.56);
  });

  test('handles prices with only digit characters', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    expect(normalizePrice('1234.56', thousands, decimal)).toBe(1234.56);
  });

  test('normalizes price with apostrophes as thousands separator', () => {
    const thousands = /'/g;
    const decimal = /\./g;
    expect(normalizePrice("1'234.56", thousands, decimal)).toBe(1234.56);
  });

  test('handles prices with unusual formats', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    // Price with additional text
    expect(normalizePrice('Price: $1,234.56', thousands, decimal)).toBe(1234.56);
    // Price with trailing text
    expect(normalizePrice('$1,234.56 only', thousands, decimal)).toBe(1234.56);
  });

  test('handles extreme price values', () => {
    const thousands = /,/g;
    const decimal = /\./g;
    // Very small price
    expect(normalizePrice('$0.01', thousands, decimal)).toBe(0.01);
    // Very large price
    expect(normalizePrice('$1,000,000,000.00', thousands, decimal)).toBe(1000000000.0);
  });
});

describe('calculateHourlyWage', () => {
  test('returns the amount directly for hourly frequency', () => {
    expect(calculateHourlyWage('hourly', '20')).toBe(20);
    expect(calculateHourlyWage('hourly', 25)).toBe(25);
  });

  test('converts yearly wage to hourly (yearly / 2080)', () => {
    expect(calculateHourlyWage('yearly', '41600')).toBe(20);
    expect(calculateHourlyWage('yearly', 83200)).toBe(40);
  });

  test('handles string vs number inputs consistently', () => {
    // Should handle both string and number inputs
    expect(calculateHourlyWage('hourly', '20')).toBe(calculateHourlyWage('hourly', 20));
    expect(calculateHourlyWage('yearly', '41600')).toBe(calculateHourlyWage('yearly', 41600));
  });

  test('handles floating point wage amounts', () => {
    expect(calculateHourlyWage('hourly', '20.50')).toBe(20.5);
    expect(calculateHourlyWage('yearly', '41600.50')).toBeCloseTo(20.0002403846, 10);
  });

  test('handles extreme wage values', () => {
    // Very small wage
    expect(calculateHourlyWage('hourly', '0.01')).toBe(0.01);
    // Very large wage
    expect(calculateHourlyWage('hourly', '1000000')).toBe(1000000);
  });

  test('handles unusual input values', () => {
    // Empty string results in NaN
    expect(isNaN(calculateHourlyWage('hourly', ''))).toBe(true);
    // Non-number string results in NaN
    expect(isNaN(calculateHourlyWage('hourly', 'not-a-number'))).toBe(true);
    // Unknown frequency just returns the hourly rate
    expect(calculateHourlyWage('unknown', '20')).toBe(20);
  });
});

describe('convertToTime', () => {
  // Direct hourlyWage parameter tests
  test('converts with direct hourlyWage parameter', () => {
    const result = convertToTime(100, 20);
    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  test('handles case where minutes round to 60', () => {
    // With hourlyWage=30, price=29.99 would be 0.999... hours,
    // which is 59.96 minutes, rounding to 60 minutes
    const result = convertToTime(29.99, 30);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(0);
  });

  // Additional tests for edge cases
  test('handles zero price correctly', () => {
    const result = convertToTime(0, 20);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
  });

  test('handles very small prices', () => {
    // 0.01 at $20/hour = 0.0005 hours = 0.03 minutes, rounds to 0
    const result = convertToTime(0.01, 20);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);

    // Small enough that it should be just under 1 minute
    const result2 = convertToTime(0.33, 20);
    expect(result2.hours).toBe(0);
    expect(result2.minutes).toBe(1);
  });

  test('handles very large prices', () => {
    // 1,000,000 at $20/hour = 50,000 hours
    const result = convertToTime(1000000, 20);
    expect(result.hours).toBe(50000);
    expect(result.minutes).toBe(0);
  });

  test('handles very small hourly wages', () => {
    // $100 at $0.01/hour = 10,000 hours
    const result = convertToTime(100, 0.01);
    expect(result.hours).toBe(10000);
    expect(result.minutes).toBe(0);
  });

  test('handles very large hourly wages', () => {
    // $100 at $1000/hour = 0.1 hours = 6 minutes
    const result = convertToTime(100, 1000);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(6);
  });

  test('handles fractional minutes correctly', () => {
    // $100 at $27.50/hour = 3.6363... hours = 3 hours, 38 minutes
    const result = convertToTime(100, 27.5);
    expect(result.hours).toBe(3);
    expect(result.minutes).toBe(38);
  });
});

describe('formatTimeSnippet (verbose format)', () => {
  test('formats hours and minutes verbosely', () => {
    expect(formatTimeSnippet(2, 30)).toBe('2 hours, 30 minutes');
  });

  test('formats hours only', () => {
    expect(formatTimeSnippet(5, 0)).toBe('5 hours');
  });

  test('formats singular hour', () => {
    expect(formatTimeSnippet(1, 0)).toBe('1 hour');
  });

  test('formats minutes only', () => {
    expect(formatTimeSnippet(0, 45)).toBe('45 minutes');
  });

  test('formats singular minute', () => {
    expect(formatTimeSnippet(0, 1)).toBe('1 minute');
  });
});

describe('formatTimeCompact', () => {
  test('formats time in compact form', () => {
    expect(formatTimeCompact(5, 30)).toBe('5h 30m');
    expect(formatTimeCompact(0, 45)).toBe('0h 45m');
    expect(formatTimeCompact(1, 0)).toBe('1h 0m');
  });
});

describe('formatPriceWithTime', () => {
  test('formats price with compact time by default', () => {
    expect(formatPriceWithTime('$100', 5, 0)).toBe('$100 (5h 0m)');
    expect(formatPriceWithTime('€25.50', 1, 15)).toBe('€25.50 (1h 15m)');
  });

  test('formats price with verbose time when specified', () => {
    expect(formatPriceWithTime('$100', 5, 0, false)).toBe('$100 (5 hours)');
    expect(formatPriceWithTime('€25.50', 1, 15, false)).toBe('€25.50 (1 hour, 15 minutes)');
  });
});

describe('convertPriceToTimeString (integration test)', () => {
  test('converts price string to format with time - compact format', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    const result = convertPriceToTimeString('$100.00', formatters, wageInfo);
    expect(result).toBe('$100.00 (5h 0m)');
  });

  test('converts price string to format with time - verbose format', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    const result = convertPriceToTimeString('$100.00', formatters, wageInfo, false);
    expect(result).toBe('$100.00 (5 hours)');
  });

  test('returns original string for invalid inputs', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    expect(convertPriceToTimeString(null, formatters, wageInfo)).toBe(null);
    expect(convertPriceToTimeString('$100.00', null, wageInfo)).toBe('$100.00');
    expect(convertPriceToTimeString('$100.00', formatters, null)).toBe('$100.00');
  });

  test('handles invalid price or wage values', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: 'invalid', // Not a number
    };

    // Should return original price string when amount is invalid
    expect(convertPriceToTimeString('$100.00', formatters, wageInfo)).toBe('$100.00');

    // Should return original price string when price is not parsable
    expect(convertPriceToTimeString('not a price', formatters, wageInfo)).toBe('not a price');
  });

  test('handles different currency formats correctly', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    // US Dollar format
    expect(convertPriceToTimeString('$100.00', formatters, wageInfo)).toBe('$100.00 (5h 0m)');
    // Euro format
    expect(convertPriceToTimeString('€100.00', formatters, wageInfo)).toBe('€100.00 (5h 0m)');
    // British Pound format
    expect(convertPriceToTimeString('£100.00', formatters, wageInfo)).toBe('£100.00 (5h 0m)');
    // Yen format (no decimal)
    expect(convertPriceToTimeString('¥10000', formatters, wageInfo)).toBe('¥10000 (500h 0m)');
  });

  test('handles different thousand/decimal separators', () => {
    // European format (space as thousands, comma as decimal)
    const europeFormatters = {
      thousands: /\s/g,
      decimal: /,/g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    expect(convertPriceToTimeString('€100,00', europeFormatters, wageInfo)).toBe('€100,00 (5h 0m)');
    expect(convertPriceToTimeString('€1 234,56', europeFormatters, wageInfo)).toBe(
      '€1 234,56 (61h 44m)'
    );

    // Swiss format (apostrophe as thousands, dot as decimal)
    const swissFormatters = {
      thousands: /'/g,
      decimal: /\./g,
    };

    expect(convertPriceToTimeString("CHF 1'234.56", swissFormatters, wageInfo)).toBe(
      "CHF 1'234.56 (61h 44m)"
    );
  });

  test('handles complex price formats with multiple occurrences of separators', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20',
    };

    // Multiple thousands separators
    expect(convertPriceToTimeString('$1,234,567.89', formatters, wageInfo)).toBe(
      '$1,234,567.89 (61728h 24m)'
    );
  });

  test('handles exceptions in the conversion process', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g,
    };

    // Create null hourly wage which would cause division by zero
    const badWageInfo = {
      frequency: 'hourly',
      amount: '0',
    };

    // Should handle division by zero gracefully
    expect(convertPriceToTimeString('$100.00', formatters, badWageInfo)).toBe('$100.00');

    // Non-parseable price string
    expect(
      convertPriceToTimeString('Not a price', formatters, {
        frequency: 'hourly',
        amount: '20',
      })
    ).toBe('Not a price');
  });
});
