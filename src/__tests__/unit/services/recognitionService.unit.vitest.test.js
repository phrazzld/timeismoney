/**
 * Unit tests for the RecognitionService adapter
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  resetTestMocks,
  mock,
  fn,
} from '../../../__tests__/setup/vitest-imports.js';
import * as recognizersText from '@microsoft/recognizers-text-suite';
import { RecognitionService } from '../../../services/recognitionService.js';

// Import the actual logger
import * as logger from '../../../utils/logger.js';

describe('RecognitionService', () => {
  let service;
  let mockRecognizeCurrency;

  beforeEach(() => {
    // Create a new service instance for each test
    service = new RecognitionService();

    // Reset all mocked functions
    resetTestMocks();

    // Spy on logger methods
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});

    // Spy on recognizeCurrency function
    mockRecognizeCurrency = vi.spyOn(recognizersText, 'recognizeCurrency');
  });

  describe('extractCurrencies', () => {
    it('should return an empty array for empty text', () => {
      const result = service.extractCurrencies('', 'en-US');

      expect(result).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(
        'RecognitionService.extractCurrencies: Empty text received',
        { culture: 'en-US' }
      );
    });

    it('should return an empty array for non-string text input', () => {
      const result = service.extractCurrencies(null, 'en-US');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an empty array for invalid culture parameter', () => {
      const result = service.extractCurrencies('$10.99', '');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return an empty array when recognizer returns no results', () => {
      mockRecognizeCurrency.mockReturnValue([]);

      const result = service.extractCurrencies('No prices here', 'en-US');

      expect(result).toEqual([]);
      expect(mockRecognizeCurrency).toHaveBeenCalledWith('No prices here', 'en-US');
      expect(logger.debug).toHaveBeenCalledWith(
        'RecognitionService.extractCurrencies: No currencies found',
        { culture: 'en-US' }
      );
    });

    it('should handle and log errors from the recognizer', () => {
      mockRecognizeCurrency.mockImplementation(() => {
        throw new Error('Recognizer error');
      });

      const result = service.extractCurrencies('$10.99', 'en-US');

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should correctly map recognizer results to IExtractedCurrency objects', () => {
      mockRecognizeCurrency.mockReturnValue([
        {
          text: '$10.99',
          start: 5,
          end: 11,
          resolution: {
            value: '10.99',
            unit: 'Dollar',
          },
        },
      ]);

      const result = service.extractCurrencies('Buy $10.99 now', 'en-US');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        text: '$10.99',
        value: '10.99',
        unit: 'Dollar',
        isoCurrency: 'USD',
        culture: 'en-US',
        start: 5,
        end: 11,
      });
    });

    it('should handle multiple currencies in the same text', () => {
      mockRecognizeCurrency.mockReturnValue([
        {
          text: '$10.99',
          start: 5,
          end: 11,
          resolution: {
            value: '10.99',
            unit: 'Dollar',
          },
        },
        {
          text: '€20',
          start: 16,
          end: 19,
          resolution: {
            value: '20',
            unit: 'Euro',
          },
        },
      ]);

      const result = service.extractCurrencies('Buy $10.99 or €20 now', 'en-US');

      expect(result).toHaveLength(2);
      expect(result[0].isoCurrency).toBe('USD');
      expect(result[1].isoCurrency).toBe('EUR');
    });

    it('should handle alternative resolution structure', () => {
      mockRecognizeCurrency.mockReturnValue([
        {
          text: '$10.99',
          start: 5,
          end: 11,
          resolution: {
            amount: '10.99',
            currency: 'USD',
          },
        },
      ]);

      const result = service.extractCurrencies('Buy $10.99 now', 'en-US');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        text: '$10.99',
        value: '10.99',
        unit: 'USD',
        isoCurrency: 'USD',
        culture: 'en-US',
        start: 5,
        end: 11,
      });
    });

    it('should handle unexpected resolution structure', () => {
      mockRecognizeCurrency.mockReturnValue([
        {
          text: '$10.99',
          start: 5,
          end: 11,
          resolution: {
            // Unexpected structure
            someProperty: 'value',
          },
        },
      ]);

      const result = service.extractCurrencies('Buy $10.99 now', 'en-US');

      expect(result).toHaveLength(1);
      expect(logger.warn).toHaveBeenCalled();
      expect(result[0].text).toBe('$10.99');
      // The fallback extracts numeric value
      expect(result[0].value).toBe('10.99');
    });
  });

  describe('_normalizeIsoCurrency', () => {
    it('should return the unit if it is already an ISO code', () => {
      const result = service._normalizeIsoCurrency('USD', 'en-US');
      expect(result).toBe('USD');
    });

    it('should map common currency symbols to ISO codes', () => {
      expect(service._normalizeIsoCurrency('$', 'en-US')).toBe('USD');
      expect(service._normalizeIsoCurrency('€', 'en-US')).toBe('EUR');
      expect(service._normalizeIsoCurrency('£', 'en-US')).toBe('GBP');
      expect(service._normalizeIsoCurrency('¥', 'en-US')).toBe('JPY');
    });

    it('should use culture to determine currency for ambiguous symbols', () => {
      expect(service._normalizeIsoCurrency('$', 'en-CA')).toBe('CAD');
      expect(service._normalizeIsoCurrency('$', 'en-AU')).toBe('AUD');
      expect(service._normalizeIsoCurrency('$', 'en-NZ')).toBe('NZD');
      expect(service._normalizeIsoCurrency('$', 'en-US')).toBe('USD');
    });

    it('should handle currency names', () => {
      expect(service._normalizeIsoCurrency('dollar', 'en-US')).toBe('USD');
      expect(service._normalizeIsoCurrency('euros', 'en-US')).toBe('EUR');
      expect(service._normalizeIsoCurrency('pounds', 'en-US')).toBe('GBP');
    });

    it('should return uppercase input for unknown currencies', () => {
      expect(service._normalizeIsoCurrency('XYZ', 'en-US')).toBe('XYZ');
      expect(service._normalizeIsoCurrency('unknown', 'en-US')).toBe('UNKNOWN');
    });
  });
});
