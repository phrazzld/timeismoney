/**
 * Tests for the unified converter.js utility
 * Ensures all functions from both original modules work correctly
 */

import { 
  normalizePrice, 
  calculateHourlyWage, 
  convertToTime, 
  formatTimeSnippet,
  formatTimeCompact,
  formatPriceWithTime,
  convertPriceToTimeString
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
    expect(normalizePrice('$1,234', thousands, decimal)).toBe(1234.00);
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
});

describe('convertToTime', () => {
  // Original signature tests (with wageSettings object)
  test('converts with wageSettings object - hourly', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(100, wageSettings);
    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  test('converts with wageSettings object - yearly', () => {
    const wageSettings = { amount: '41600', frequency: 'yearly' };
    const result = convertToTime(100, wageSettings);
    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  // New signature tests (with direct hourlyWage)
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
      decimal: /\./g
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20'
    };
    
    const result = convertPriceToTimeString('$100.00', formatters, wageInfo);
    expect(result).toBe('$100.00 (5h 0m)');
  });

  test('converts price string to format with time - verbose format', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20'
    };
    
    const result = convertPriceToTimeString('$100.00', formatters, wageInfo, false);
    expect(result).toBe('$100.00 (5 hours)');
  });

  test('returns original string for invalid inputs', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: '20'
    };
    
    expect(convertPriceToTimeString(null, formatters, wageInfo)).toBe(null);
    expect(convertPriceToTimeString('$100.00', null, wageInfo)).toBe('$100.00');
    expect(convertPriceToTimeString('$100.00', formatters, null)).toBe('$100.00');
  });

  test('handles invalid price or wage values', () => {
    const formatters = {
      thousands: /,/g,
      decimal: /\./g
    };
    const wageInfo = {
      frequency: 'hourly',
      amount: 'invalid'  // Not a number
    };
    
    // Should return original price string when amount is invalid
    expect(convertPriceToTimeString('$100.00', formatters, wageInfo)).toBe('$100.00');
    
    // Should return original price string when price is not parsable
    expect(convertPriceToTimeString('not a price', formatters, wageInfo)).toBe('not a price');
  });
});