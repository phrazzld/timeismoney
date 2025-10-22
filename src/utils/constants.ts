/**
 * Shared constants used throughout the extension
 *
 * @module utils/constants
 */

/**
 * CSS class used to identify converted price elements in the DOM
 * This class is applied to elements that have been processed by the extension
 */
export const CONVERTED_PRICE_CLASS = 'tim-converted-price';

/**
 * CSS class names used to identify Amazon price components
 * Amazon splits prices into separate DOM elements with these classes
 * Supports both 'sx-price-*' and 'a-price-*' patterns
 */
export const AMAZON_PRICE_CLASSES: {
  [key: string]: { sx: string; a: string };
} = {
  CURRENCY: {
    sx: 'sx-price-currency',
    a: 'a-price-symbol',
  },
  WHOLE: {
    sx: 'sx-price-whole',
    a: 'a-price-whole',
  },
  FRACTIONAL: {
    sx: 'sx-price-fractional',
    a: 'a-price-fraction',
  },
};

/**
 * CSS class names used to identify eBay price elements
 * eBay uses specific class patterns for prices across their site
 */
export const EBAY_PRICE_CLASSES: string[] = [
  's-item__price', // Search results price
  'x-price-primary', // Item page primary price
  'x-bin-price', // Buy it now price
  'x-buybox__price-element', // Buy box price
  'display-price', // Another common price class
  'ux-textspans', // Price text span
  'ux-price-display', // Price display container
];

/**
 * CSS selectors for parent elements that may contain prices on eBay
 * These selectors help identify blocks that might contain price elements
 */
export const EBAY_PRICE_CONTAINERS: string[] = ['.x-price', '.x-buybox', '.vim-timer', '.vi-price'];

/**
 * Attributes to check for price-related content on eBay
 * Some eBay price elements use data attributes to store price data
 */
export const EBAY_PRICE_ATTRIBUTES: string[] = ['data-price', 'data-item-price'];

/**
 * Maximum number of nodes to queue before forcing processing
 * Used to prevent memory issues with large DOM changes
 */
export const MAX_PENDING_NODES = 2000; // Increased from 1000 to reduce warnings while still providing safety

/**
 * Default debounce interval for MutationObserver in milliseconds
 * Controls how frequently DOM changes are processed
 */
export const DEFAULT_DEBOUNCE_INTERVAL_MS = 200;

/**
 * Regular expression pattern used to match time annotations
 * Used to detect already-converted prices
 */
export const TIME_ANNOTATION_PATTERN = '\\s\\(\\d+h\\s\\d+m\\)';

/**
 * Debug mode highlight CSS classes for price elements
 * Used to visually identify the status of price elements during debugging
 */
export const DEBUG_HIGHLIGHT_CLASSES: { [key: string]: string } = {
  DETECTED: 'tim-debug-detected', // Price was detected
  CONVERTED: 'tim-debug-converted', // Price was successfully converted
  FAILED: 'tim-debug-failed', // Price detection/conversion failed
  CANDIDATE: 'tim-debug-candidate', // Element that might contain a price
  IGNORED: 'tim-debug-ignored', // Element that was explicitly ignored
};

/**
 * Default extension settings
 * Used when user settings are not available
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
  enableDynamicScanning: true, // Whether to monitor DOM changes in real-time
  debugMode: false, // Whether debug mode is enabled for price detection
  badgeDisplayMode: 'modern', // Badge display style: 'modern' (new badges) or 'legacy' (old style)
  useShadowDOM: false, // Whether to use Shadow DOM for perfect style isolation (experimental)
};

/**
 * Currency format configurations organized by locale groups
 * Each group defines formatting rules and associated currencies
 */
export const CURRENCY_FORMATS: {
  [key: string]: {
    localeId: string;
    thousands: string;
    decimal: string;
    currencySymbols: string[];
    currencyCodes: string[];
    symbolsBeforeAmount: boolean;
  };
} = {
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
    currencySymbols: ['¥', '₩', '元', '￥', '円'],
    currencyCodes: ['JPY', 'KRW', 'CNY'],
    symbolsBeforeAmount: true,
  },
};

/**
 * Maps currency symbols to their corresponding format group
 * Used to determine which formatting rules to apply based on symbol
 */
export const CURRENCY_SYMBOL_TO_FORMAT: { [key: string]: string } = {
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
  円: 'JP',
};

/**
 * Maps currency codes to their corresponding format group
 * Used to determine which formatting rules to apply based on currency code
 */
export const CURRENCY_CODE_TO_FORMAT: { [key: string]: string } = {
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
