/**
 * Tests for the converter.js utility using Vitest
 */

import { convertToTime, formatTimeSnippet } from '../../../utils/converter.js';
import { describe, test, expect } from 'vitest';

describe('convertToTime', () => {
  // Hourly wage conversion tests
  test('converts prices with hourly wages - even division', () => {
    const hourlyRate = 20; // Using direct hourly rate
    const result = convertToTime(100, hourlyRate);

    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(0);
  });

  test('converts prices with hourly wages - with fractional time', () => {
    const hourlyRate = 20; // Using direct hourly rate
    const result = convertToTime(30, hourlyRate);

    expect(result.hours).toBe(1);
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

  // Minutes only tests
  test('formats minutes only', () => {
    expect(formatTimeSnippet(0, 45)).toBe('45 minutes');
  });
});
