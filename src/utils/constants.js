/**
 * Shared constants used throughout the extension
 * @module utils/constants
 */

// CSS class used to identify converted price elements
export const CONVERTED_PRICE_CLASS = 'tim-converted-price';

// Currency format configurations by locale
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

// Mapping of common currency symbols to their respective format group
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

// Mapping of common currency codes to their respective format group
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
