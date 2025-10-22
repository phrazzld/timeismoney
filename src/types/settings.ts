/**
 * Type definitions for extension settings.
 * Defines the structure of user preferences and configuration.
 *
 * @module types/settings
 */

/**
 * Frequency options for wage calculation.
 */
export type WageFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Thousands separator format options.
 */
export type ThousandsSeparator = 'commas' | 'spacesAndDots' | 'none';

/**
 * Decimal separator format options.
 */
export type DecimalSeparator = 'dot' | 'comma';

/**
 * Badge display mode options.
 */
export type BadgeDisplayMode = 'modern' | 'legacy';

/**
 * Extension settings interface.
 * Contains all user-configurable options for the Time Is Money extension.
 */
export interface Settings {
  /** User's wage amount as a string (e.g., "15.00") */
  amount: string | number;
  /** Frequency of the wage (hourly, daily, weekly, monthly, yearly) */
  frequency: WageFrequency;
  /** Currency symbol used for display (e.g., "$", "€", "£") */
  currencySymbol: string;
  /** ISO 4217 currency code (e.g., "USD", "EUR", "GBP") */
  currencyCode: string;
  /** Format for thousands separator in numbers */
  thousands: ThousandsSeparator;
  /** Format for decimal separator in numbers */
  decimal: DecimalSeparator;
  /** Whether the extension is currently disabled */
  disabled: boolean;
  /** Debounce interval in milliseconds for MutationObserver */
  debounceIntervalMs: number;
  /** Whether dynamic DOM scanning is enabled */
  enableDynamicScanning: boolean;
  /** Whether debug mode is enabled for price detection */
  debugMode?: boolean;
  /** Badge display style: 'modern' (new badges) or 'legacy' (old style) */
  badgeDisplayMode?: BadgeDisplayMode;
  /** Whether to use Shadow DOM for perfect style isolation (experimental) */
  useShadowDOM?: boolean;
}

/**
 * Partial settings type for updates.
 * Allows updating any subset of settings.
 */
export type PartialSettings = Partial<Settings>;
