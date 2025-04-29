/**
 * Shared constants used throughout the extension
 *
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
 * CSS class names used to identify Amazon price components
 * Amazon splits prices into separate DOM elements with these classes
 *
 * @type {{[key: string]: string}}
 */
export const AMAZON_PRICE_CLASSES = {
  CURRENCY: 'sx-price-currency',
  WHOLE: 'sx-price-whole',
  FRACTIONAL: 'sx-price-fractional',
};

/**
 * Maximum number of nodes to queue before forcing processing
 * Used to prevent memory issues with large DOM changes
 *
 * @type {number}
 */
export const MAX_PENDING_NODES = 1000;

/**
 * Default debounce interval for MutationObserver in milliseconds
 * Controls how frequently DOM changes are processed
 *
 * @type {number}
 */
export const DEFAULT_DEBOUNCE_INTERVAL_MS = 200;

/**
 * Regular expression pattern used to match time annotations
 * Used to detect already-converted prices
 *
 * @type {string}
 */
export const TIME_ANNOTATION_PATTERN = '\\s\\(\\d+h\\s\\d+m\\)';

/**
 * Default extension settings
 * Used when user settings are not available
 *
 * @type {object}
 */
export const DEFAULT_SETTINGS = {
  amount: 30,
  frequency: 'hourly',
  currencySymbol: '$',
  currencyCode: 'USD',
  thousands: 'commas',
  decimal: 'dot',
  disabled: false,
  debounceIntervalMs: DEFAULT_DEBOUNCE_INTERVAL_MS,
};

/**
 * Currency format configurations organized by locale groups
 * Each group defines formatting rules and associated currencies
 *
 * @type {{[key: string]: {
 *   localeId: string,
 *   thousands: string,
 *   decimal: string,
 *   currencySymbols: string[],
 *   currencyCodes: string[],
 *   symbolsBeforeAmount: boolean
 * }}}
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
 * @type {{[key: string]: string}}
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
 * @type {{[key: string]: string}}
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
