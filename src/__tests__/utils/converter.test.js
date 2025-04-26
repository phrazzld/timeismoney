/**
 * Tests for the converter.js utility
 */

import { convertToTime, formatTimeSnippet } from '../../utils/converter';

describe('convertToTime', () => {
  // Hourly wage conversion tests
  test('converts prices with hourly wages - even division', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(100, wageSettings);

    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  test('converts prices with hourly wages - with fractional time', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(30, wageSettings);

    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(30);
  });

  test('converts prices with hourly wages - small fraction', () => {
    const wageSettings = { amount: '60', frequency: 'hourly' };
    const result = convertToTime(5, wageSettings);

    // 5/60 = 0.0833... hours = 5 minutes
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(5);
  });

  // Yearly wage conversion tests
  test('converts prices with yearly wages', () => {
    const wageSettings = { amount: '41600', frequency: 'yearly' };
    // 41600/2080 = $20/hour, so $100 should be 5 hours
    const result = convertToTime(100, wageSettings);

    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  test('converts prices with yearly wages - with fractional time', () => {
    const wageSettings = { amount: '41600', frequency: 'yearly' };
    // 41600/2080 = $20/hour, so $30 should be 1.5 hours = 1 hour, 30 minutes
    const result = convertToTime(30, wageSettings);

    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(30);
  });

  // Edge cases
  test('handles zero price', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(0, wageSettings);

    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
  });

  test('handles very small prices', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(0.01, wageSettings);

    // 0.01/20 = 0.0005 hours = 0.03 minutes, which rounds to 0
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
  });

  test('handles very large prices', () => {
    const wageSettings = { amount: '20', frequency: 'hourly' };
    const result = convertToTime(1000000, wageSettings);

    // 1000000/20 = 50000 hours
    expect(result.hours).toBe(50000);
    expect(result.minutes).toBe(0);
  });

  test('handles very high wages', () => {
    const wageSettings = { amount: '1000', frequency: 'hourly' };
    const result = convertToTime(100, wageSettings);

    // 100/1000 = 0.1 hours = 6 minutes
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(6);
  });

  test('handles very low wages', () => {
    const wageSettings = { amount: '0.01', frequency: 'hourly' };
    const result = convertToTime(1, wageSettings);

    // 1/0.01 = 100 hours
    expect(result.hours).toBe(100);
    expect(result.minutes).toBe(0);
  });

  test('rounding minutes correctly', () => {
    const wageSettings = { amount: '15', frequency: 'hourly' };
    const result = convertToTime(7.5, wageSettings);

    // 7.5/15 = 0.5 hours = 30 minutes
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(30);
  });
});

describe('formatTimeSnippet', () => {
  // Standard formatting tests
  test('formats hours and minutes', () => {
    expect(formatTimeSnippet(2, 30)).toBe('2 hours, 30 minutes');
  });

  // Hours only tests
  test('formats hours only', () => {
    expect(formatTimeSnippet(5, 0)).toBe('5 hours');
  });

  test('formats singular hour', () => {
    expect(formatTimeSnippet(1, 0)).toBe('1 hour');
  });

  // Minutes only tests
  test('formats minutes only', () => {
    expect(formatTimeSnippet(0, 45)).toBe('45 minutes');
  });

  test('formats singular minute', () => {
    expect(formatTimeSnippet(0, 1)).toBe('1 minute');
  });

  // Edge cases
  test('handles zero hours and zero minutes', () => {
    expect(formatTimeSnippet(0, 0)).toBe('0 minutes');
  });

  // Combined case with singular forms
  test('formats singular hour and singular minute', () => {
    expect(formatTimeSnippet(1, 1)).toBe('1 hour, 1 minute');
  });

  test('formats singular hour and plural minutes', () => {
    expect(formatTimeSnippet(1, 5)).toBe('1 hour, 5 minutes');
  });

  test('formats plural hours and singular minute', () => {
    expect(formatTimeSnippet(5, 1)).toBe('5 hours, 1 minute');
  });
});
