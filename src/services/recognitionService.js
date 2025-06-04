/**
 * Recognition service for extracting currency mentions from text.
 * Adapts Microsoft Recognizers Text Suite for consistent currency extraction
 * across different text formats and locales.
 *
 * This service implements the IRecognitionService interface and provides
 * reliable currency extraction with culture-aware processing.
 *
 * @module services/recognitionService
 */

import * as RecognizersTextSuite from '@microsoft/recognizers-text-suite';

// Extract the recognizeCurrency function from the library
const { recognizeCurrency } = RecognizersTextSuite;
import { debug, warn, error } from '../utils/logger.js';

/**
 * Implementation of IRecognitionService that adapts Microsoft Recognizers Text Suite
 * for extracting currency information from text.
 *
 * This class identifies and normalizes currency mentions in text, handling
 * various formats, symbols, and cultural variations. It processes raw text
 * and returns structured data about any currency values found.
 *
 * @implements {import('../types/money').IRecognitionService}
 */
export class RecognitionService {
  /**
   * Extracts all currency mentions from a given text string.
   * Processes the input text to identify and normalize any currency values,
   * using the specified culture to guide recognition patterns.
   *
   * This method validates inputs, handles errors gracefully, and returns
   * an empty array rather than throwing exceptions when processing fails.
   * It also performs extensive logging for debugging and monitoring.
   *
   * @param {string} text - The text to analyze for currency mentions
   * @param {string} culture - The culture code (e.g., "en-US", "de-DE") to guide recognition
   * @returns {Array<import('../types/money').IExtractedCurrency>} An array of extracted currency information, empty if none found or on error
   *
   * @example
   * // Extract currencies from text with en-US culture
   * const currencies = recognitionService.extractCurrencies(
   *   "The item costs $19.99 or €15.00",
   *   "en-US"
   * );
   * // Returns array with information about the $19.99 and €15.00 mentions
   */
  extractCurrencies(text, culture) {
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
      const recognitionResults = recognizeCurrency(text, culture);

      if (!Array.isArray(recognitionResults) || recognitionResults.length === 0) {
        debug('RecognitionService.extractCurrencies: No currencies found', { culture });
        return [];
      }

      // Map recognizer results to our IExtractedCurrency interface
      const extractedCurrencies = recognitionResults.map((result) => {
        const { resolution, start, end, text: matchedText } = result;

        // Extract the currency code and value from the resolution
        // The structure may differ based on the version of the library
        // and the specific recognizer used
        let value = '';
        let unit = '';
        let isoCurrency = '';

        if (resolution && resolution.value) {
          // Modern structure
          value = resolution.value;
          unit = resolution.unit || '';
          isoCurrency = this._normalizeIsoCurrency(resolution.unit, culture);
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
      error('RecognitionService.extractCurrencies: Error processing text', {
        error: err.message,
        stack: err.stack,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        culture,
      });
      return [];
    }
  }

  /**
   * Normalizes a currency unit to an ISO 4217 currency code.
   * This helper method handles various forms of currency units (symbols, names)
   * and uses culture context to disambiguate when needed (e.g., '$' could be
   * USD, CAD, AUD depending on the culture).
   *
   * @private
   * @param {string} unit - The currency unit to normalize (e.g., "$", "Dollar", "EUR")
   * @param {string} culture - The culture to use for context (e.g., "en-US", "en-CA")
   * @returns {string} The normalized ISO currency code (e.g., "USD", "CAD"), or the uppercase input if unable to normalize
   *
   * @example
   * // With US culture
   * _normalizeIsoCurrency("$", "en-US"); // Returns "USD"
   *
   * // With Canadian culture
   * _normalizeIsoCurrency("$", "en-CA"); // Returns "CAD"
   */
  _normalizeIsoCurrency(unit, culture) {
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
    const currencyMap = {
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
 * Use this exported instance throughout the application for consistency.
 *
 * @type {RecognitionService}
 */
export default new RecognitionService();
