/**
 * Recognition service for extracting currency mentions from text.
 * Adapts Microsoft Recognizers Text Suite for consistent currency extraction
 * across different text formats and locales.
 *
 * @module services/recognitionService
 */

import { recognizeCurrency } from '@microsoft/recognizers-text-suite';
import { debug, warn, error } from '../utils/logger.js';
import type { IExtractedCurrency, IRecognitionService } from '../types/money.js';

interface RecognizerResult {
  resolution: {
    value?: string;
    unit?: string;
    amount?: string;
    currency?: string;
  };
  start: number;
  end: number;
  text: string;
}

/**
 * Implementation of IRecognitionService that adapts Microsoft Recognizers Text Suite
 * for extracting currency information from text.
 */
export class RecognitionService implements IRecognitionService {
  extractCurrencies(text: string, culture: string): IExtractedCurrency[] {
    // Input validation
    if (typeof text !== 'string') {
      error('RecognitionService.extractCurrencies: Invalid text parameter', { text });
      return [];
    }

    if (typeof culture !== 'string' || !culture) {
      error('RecognitionService.extractCurrencies: Invalid culture parameter', { culture });
      return [];
    }

    // Handle empty text case
    if (!text.trim()) {
      debug('RecognitionService.extractCurrencies: Empty text received', { culture });
      return [];
    }

    debug('RecognitionService.extractCurrencies: Processing text', {
      textLength: text.length,
      culture,
    });

    try {
      // Use Microsoft Recognizers Text to extract currency entities
      const recognitionResults = recognizeCurrency(text, culture) as RecognizerResult[];

      if (!Array.isArray(recognitionResults) || recognitionResults.length === 0) {
        debug('RecognitionService.extractCurrencies: No currencies found', { culture });
        return [];
      }

      // Map recognizer results to our IExtractedCurrency interface
      const extractedCurrencies: IExtractedCurrency[] = recognitionResults.map((result) => {
        const { resolution, start, end, text: matchedText } = result;

        // Extract the currency code and value from the resolution
        let value = '';
        let unit = '';
        let isoCurrency = '';

        if (resolution && resolution.value) {
          // Modern structure
          value = resolution.value;
          unit = resolution.unit || '';
          isoCurrency = this._normalizeIsoCurrency(resolution.unit || '', culture);
        } else if (resolution && resolution.amount) {
          // Alternative structure
          value = resolution.amount;
          unit = resolution.currency || resolution.unit || '';
          isoCurrency = this._normalizeIsoCurrency(unit, culture);
        } else {
          // Fallback for unexpected structure
          warn('RecognitionService.extractCurrencies: Unexpected resolution structure', {
            resolution,
            matchedText,
          });
          // Make best effort to extract some value
          value = matchedText.replace(/[^0-9.,]/g, '');
          unit = matchedText.replace(/[0-9.,]/g, '').trim();
          isoCurrency = this._normalizeIsoCurrency(unit, culture);
        }

        return {
          text: matchedText,
          value,
          unit,
          isoCurrency,
          culture,
          start,
          end,
        };
      });

      debug('RecognitionService.extractCurrencies: Successfully extracted currencies', {
        count: extractedCurrencies.length,
        currencies: extractedCurrencies,
      });

      return extractedCurrencies;
    } catch (err) {
      const e = err as Error;
      error('RecognitionService.extractCurrencies: Error processing text', {
        error: e.message,
        stack: e.stack,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        culture,
      });
      return [];
    }
  }

  /**
   * Normalizes a currency unit to an ISO 4217 currency code.
   */
  private _normalizeIsoCurrency(unit: string, culture: string): string {
    if (!unit) return '';

    // Use culture context to determine default currency
    // when the unit is ambiguous (like $ could be USD, CAD, AUD, etc.)
    if (unit === '$' || unit.toLowerCase().includes('dollar')) {
      if (culture.startsWith('en-CA')) return 'CAD';
      if (culture.startsWith('en-AU')) return 'AUD';
      if (culture.startsWith('en-NZ')) return 'NZD';
      // Default to USD for other cultures with dollar
      return 'USD';
    }

    // Common currency mappings
    const currencyMap: Record<string, string> = {
      // Dollar variants
      dollar: 'USD',
      dollars: 'USD',
      $: 'USD',
      // Euro variants
      euro: 'EUR',
      euros: 'EUR',
      '€': 'EUR',
      // Pound variants
      pound: 'GBP',
      pounds: 'GBP',
      '£': 'GBP',
      // Yen/Yuan variants
      yen: 'JPY',
      '¥': 'JPY',
      yuan: 'CNY',
      // Other common currencies
      cad: 'CAD',
      c$: 'CAD',
      ca$: 'CAD',
      'canadian dollar': 'CAD',
      'canadian dollars': 'CAD',
      aud: 'AUD',
      a$: 'AUD',
      au$: 'AUD',
      'australian dollar': 'AUD',
      'australian dollars': 'AUD',
    };

    // First check if we already have an ISO code
    // ISO 4217 codes are 3 uppercase letters
    if (/^[A-Z]{3}$/.test(unit)) {
      return unit;
    }

    // Check if we have a direct mapping
    const normalized = unit.toLowerCase();
    if (currencyMap[normalized]) {
      return currencyMap[normalized];
    }

    // If we can't determine the currency, return the original unit
    // This allows downstream processing to potentially handle it
    warn('RecognitionService._normalizeIsoCurrency: Unable to normalize currency unit', {
      unit,
      culture,
    });

    return unit.toUpperCase();
  }
}

/**
 * Singleton instance of RecognitionService.
 */
export default new RecognitionService();
