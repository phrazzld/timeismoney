/**
 * Shared constants used throughout the extension
 * @module utils/constants
 */

/**
 * CSS class used to identify converted price elements in the DOM
 * This class is applied to elements that have been processed by the extension
 *
 * @type {string}
 */
export const CONVERTED_PRICE_CLASS = 'tim-converted-price';

/**
 * Currency format configurations organized by locale groups
 * Each group defines formatting rules and associated currencies
 *
 * @type {Object.<string, {
 *   localeId: string,
 *   thousands: string,
 *   decimal: string,
 *   currencySymbols: string[],
 *   currencyCodes: string[],
 *   symbolsBeforeAmount: boolean
 * }>}
 */
export const CURRENCY_FORMATS = {
  // US/UK style with comma thousands and dot decimal
  US: {
    localeId: 'en-US',
    thousands: 'commas',
    decimal: 'dot',
    currencySymbols: ['$', '£', '₹'],
    currencyCodes: ['USD', 'GBP', 'INR'],
    symbolsBeforeAmount: true,
  },
  // European style with dot/space thousands and comma decimal
  EU: {
    localeId: 'de-DE',
    thousands: 'spacesAndDots',
    decimal: 'comma',
    currencySymbols: ['€', 'Fr', 'kr', 'zł'],
    currencyCodes: ['EUR', 'CHF', 'SEK', 'DKK', 'NOK', 'PLN'],
    symbolsBeforeAmount: false,
  },
  // Japanese style typically without decimals
  JP: {
    localeId: 'ja-JP',
    thousands: 'commas',
    decimal: 'dot',
    currencySymbols: ['¥', '₩', '元', '￥'],
    currencyCodes: ['JPY', 'KRW', 'CNY'],
    symbolsBeforeAmount: true,
  },
};

/**
 * Maps currency symbols to their corresponding format group
 * Used to determine which formatting rules to apply based on symbol
 *
 * @type {Object.<string, string>}
 */
export const CURRENCY_SYMBOL_TO_FORMAT = {
  $: 'US',
  '£': 'US',
  '₹': 'US',
  '€': 'EU',
  Fr: 'EU',
  kr: 'EU',
  zł: 'EU',
  '¥': 'JP',
  '₩': 'JP',
  元: 'JP',
  '￥': 'JP',
};

/**
 * Maps currency codes to their corresponding format group
 * Used to determine which formatting rules to apply based on currency code
 *
 * @type {Object.<string, string>}
 */
export const CURRENCY_CODE_TO_FORMAT = {
  USD: 'US',
  GBP: 'US',
  INR: 'US',
  EUR: 'EU',
  CHF: 'EU',
  SEK: 'EU',
  DKK: 'EU',
  NOK: 'EU',
  PLN: 'EU',
  JPY: 'JP',
  KRW: 'JP',
  CNY: 'JP',
};
