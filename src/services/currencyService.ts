/**
 * Currency service for monetary value representation and calculations.
 * Adapts Money.js for consistent handling of currency operations and price-to-time conversions.
 *
 * This service provides standardized interfaces for creating, manipulating, and converting
 * monetary values, with consistent error handling and validation.
 *
 * @module services/currencyService
 */

import fx from 'money';
import { debug, warn, error } from '../utils/logger.js';
import type { IMoneyObject, ITimeBreakdown, ICurrencyService } from '../types/money.js';

interface InternalMoneyObject {
  _type: 'money';
  _value: number;
  _currency: string;
}

interface FormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  precision?: number;
}

/**
 * Implementation of ICurrencyService that adapts Money.js
 * for handling monetary values and time conversions.
 */
export class CurrencyService implements ICurrencyService {
  createMoney(numericStringValue: string, currencyCode: string): IMoneyObject | null {
    // Input validation
    if (typeof numericStringValue !== 'string' || !numericStringValue.trim()) {
      error('CurrencyService.createMoney: Invalid numericStringValue parameter', {
        numericStringValue,
      });
      return null;
    }

    if (typeof currencyCode !== 'string' || !currencyCode.trim()) {
      error('CurrencyService.createMoney: Invalid currencyCode parameter', { currencyCode });
      return null;
    }

    // Normalize currency code
    const normalizedCurrencyCode = currencyCode.trim().toUpperCase();

    // Validate ISO currency code format (3 uppercase letters)
    if (!/^[A-Z]{3}$/.test(normalizedCurrencyCode)) {
      warn('CurrencyService.createMoney: Currency code is not in ISO 4217 format', {
        currencyCode,
      });
      // We'll continue anyway, as Money.js might handle some non-standard codes
    }

    try {
      // Clean numeric string (allow only digits, single decimal point, and negative sign)
      const cleanedValue = numericStringValue.replace(/[^0-9.-]/g, '');

      // Parse the value
      const parsedValue = parseFloat(cleanedValue);

      // Check if the parsed value is a valid number
      if (isNaN(parsedValue)) {
        warn('CurrencyService.createMoney: Could not parse numeric value', {
          numericStringValue,
          cleanedValue,
        });
        return null;
      }

      // Create money object - we'll use a simple object structure conforming to our interface
      // rather than directly using the fx() instance since it has different behavior
      const moneyObject: InternalMoneyObject = {
        _type: 'money',
        _value: parsedValue,
        _currency: normalizedCurrencyCode,
      };

      debug('CurrencyService.createMoney: Created money object', {
        value: parsedValue,
        currency: normalizedCurrencyCode,
      });

      return moneyObject as IMoneyObject;
    } catch (err) {
      const e = err as Error;
      error('CurrencyService.createMoney: Error creating money object', {
        error: e.message,
        stack: e.stack,
        numericStringValue,
        currencyCode,
      });
      return null;
    }
  }

  convertToTime(price: IMoneyObject, hourlyWage: IMoneyObject): ITimeBreakdown | null {
    // Input validation
    if (!price || !this._isValidMoneyObject(price)) {
      error('CurrencyService.convertToTime: Invalid price parameter', { price });
      return null;
    }

    if (!hourlyWage || !this._isValidMoneyObject(hourlyWage)) {
      error('CurrencyService.convertToTime: Invalid hourlyWage parameter', { hourlyWage });
      return null;
    }

    try {
      const priceObj = price as unknown as InternalMoneyObject;
      const wageObj = hourlyWage as unknown as InternalMoneyObject;

      const priceAmount = priceObj._value;
      const priceCurrency = priceObj._currency;
      const wageAmount = wageObj._value;
      const wageCurrency = wageObj._currency;

      // Check for zero wage
      if (wageAmount === 0) {
        warn('CurrencyService.convertToTime: Hourly wage is zero, cannot convert to time', {
          priceAmount,
          priceCurrency,
          wageAmount,
          wageCurrency,
        });
        return null;
      }

      // Check if currencies match
      if (priceCurrency !== wageCurrency) {
        // With different currencies, we need exchange rates
        // Check if money.js has exchange rates set up
        if (!fx.rates || Object.keys(fx.rates).length === 0) {
          warn(
            'CurrencyService.convertToTime: Different currencies but no exchange rates available',
            {
              priceCurrency,
              wageCurrency,
            }
          );
          return null;
        }

        // If we have exchange rates, use money.js to convert
        try {
          // Convert price to wage currency
          const convertedPrice = fx(priceAmount).from(priceCurrency).to(wageCurrency);

          // Calculate hours
          const totalHours = convertedPrice / wageAmount;

          return this._createTimeBreakdown(totalHours);
        } catch (err) {
          const e = err as Error;
          warn('CurrencyService.convertToTime: Currency conversion failed', {
            error: e.message,
            priceCurrency,
            wageCurrency,
          });
          return null;
        }
      } else {
        // Same currency, simple division
        const totalHours = priceAmount / wageAmount;

        // Create the time breakdown
        return this._createTimeBreakdown(totalHours);
      }
    } catch (err) {
      const e = err as Error;
      error('CurrencyService.convertToTime: Error converting to time', {
        error: e.message,
        stack: e.stack,
        price,
        hourlyWage,
      });
      return null;
    }
  }

  formatMoney(money: IMoneyObject, options: FormatOptions = {}): string {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.formatMoney: Invalid money parameter', { money });
      return '';
    }

    try {
      const moneyObj = money as unknown as InternalMoneyObject;
      const amount = moneyObj._value;
      const currency = moneyObj._currency;

      const formatOptions = {
        showSymbol: options.showSymbol ?? true,
        showCode: options.showCode ?? false,
        precision: options.precision ?? 2,
        ...options,
      };

      // Default formatting: 2 decimal places
      let formattedValue = amount.toFixed(formatOptions.precision);

      // Add currency code or symbol
      if (formatOptions.showCode) {
        formattedValue = `${formattedValue} ${currency}`;
      } else if (formatOptions.showSymbol) {
        const symbol = this._getCurrencySymbol(currency);
        formattedValue = `${symbol}${formattedValue}`;
      }

      return formattedValue;
    } catch (err) {
      const e = err as Error;
      error('CurrencyService.formatMoney: Error formatting money', {
        error: e.message,
        stack: e.stack,
        money,
      });
      return '';
    }
  }

  getCurrencyCode(money: IMoneyObject): string | null {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.getCurrencyCode: Invalid money parameter', { money });
      return null;
    }

    const moneyObj = money as unknown as InternalMoneyObject;
    return moneyObj._currency;
  }

  getAmount(money: IMoneyObject): number | null {
    if (!money || !this._isValidMoneyObject(money)) {
      error('CurrencyService.getAmount: Invalid money parameter', { money });
      return null;
    }

    const moneyObj = money as unknown as InternalMoneyObject;
    return moneyObj._value;
  }

  /**
   * Validates if an object is a valid money object.
   */
  private _isValidMoneyObject(obj: unknown): obj is InternalMoneyObject {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      (obj as InternalMoneyObject)._type === 'money' &&
      typeof (obj as InternalMoneyObject)._value === 'number' &&
      typeof (obj as InternalMoneyObject)._currency === 'string'
    );
  }

  /**
   * Creates a time breakdown object from total hours.
   */
  private _createTimeBreakdown(totalHours: number): ITimeBreakdown {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // Record the start time for performance measurement
    const startTime = performance.now();

    // Handle case where rounding minutes results in 60
    if (minutes === 60) {
      return {
        hours: hours + 1,
        minutes: 0,
        startTime: startTime,
      };
    }

    return {
      hours,
      minutes,
      startTime: startTime,
    };
  }

  /**
   * Gets a currency symbol for a given currency code.
   */
  private _getCurrencySymbol(currencyCode: string): string {
    const symbolMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'Fr',
      INR: '₹',
      NZD: 'NZ$',
      ZAR: 'R',
      RUB: '₽',
      BRL: 'R$',
      MXN: 'Mex$',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      CZK: 'Kč',
      PLN: 'zł',
      TRY: '₺',
      HKD: 'HK$',
      SGD: 'S$',
      THB: '฿',
      IDR: 'Rp',
    };

    return symbolMap[currencyCode] || currencyCode;
  }
}

/**
 * Singleton instance of CurrencyService.
 */
export default new CurrencyService();
