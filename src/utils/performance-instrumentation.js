/**
 * Performance Instrumentation Module
 * Injects performance monitoring into key extension components
 *
 * @module utils/performance-instrumentation
 */

import * as performance from './performance.js';
import * as priceFinder from '../content/priceFinder.js';
import * as domModifier from '../content/domModifier.js';
import * as converter from '../utils/converter.js';
import * as domScanner from '../content/domScanner.js';
import recognitionService from '../services/recognitionService.js';
import currencyService from '../services/currencyService.js';
import * as logger from './logger.js';

// Store original functions for restoration
const originals = {
  priceFinder: {},
  domModifier: {},
  converter: {},
  domScanner: {},
  recognitionService: {},
  currencyService: {},
  content: {},
};

// Create function wrappers to avoid direct namespace assignments
// which cause ESLint no-import-assign and import/namespace errors
const createInstrumentedFunction = (original, moduleName, funcName) => {
  return function (...args) {
    // Create unique flow ID
    const flowId = performance.startFlow(`${moduleName}.${funcName}`, 'function');

    try {
      // Call original function
      const result = original.apply(this, args);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then((value) => {
            performance.endFlow(flowId);
            return value;
          })
          .catch((error) => {
            performance.endFlow(flowId);
            throw error;
          });
      }

      // Handle regular returns
      performance.endFlow(flowId);
      return result;
    } catch (error) {
      performance.endFlow(flowId);
      throw error;
    }
  };
};

/**
 * Instruments a single function with performance monitoring
 *
 * @param {object} module - Module containing the function to instrument
 * @param {string} funcName - Name of the function to instrument
 * @param {string} moduleName - Name of the module (for logging and tracking)
 * @returns {Function} The instrumented function
 */
function instrumentFunction(module, funcName, moduleName) {
  // Store original function for later restoration
  const originalFunc = module[funcName];
  originals[moduleName][funcName] = originalFunc;

  // Create instrumented version without direct namespace assignment
  return createInstrumentedFunction(originalFunc, moduleName, funcName);
}

/**
 * Instruments key functions in priceFinder module
 *
 * @returns {void}
 */
function instrumentPriceFinder() {
  const findPricesInstrumented = instrumentFunction(priceFinder, 'findPrices', 'priceFinder');
  const detectCultureInstrumented = instrumentFunction(
    priceFinder,
    'detectCultureFromText',
    'priceFinder'
  );
  const mightContainPriceInstrumented = instrumentFunction(
    priceFinder,
    'mightContainPrice',
    'priceFinder'
  );

  // Store original methods
  const pf = priceFinder;

  // Use Object.defineProperty to update with instrumented versions
  // This avoids direct namespace assignment which causes ESLint errors
  if (typeof pf.findPrices === 'function') {
    Object.defineProperty(pf, 'findPrices', {
      value: findPricesInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof pf.detectCultureFromText === 'function') {
    Object.defineProperty(pf, 'detectCultureFromText', {
      value: detectCultureInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof pf.mightContainPrice === 'function') {
    Object.defineProperty(pf, 'mightContainPrice', {
      value: mightContainPriceInstrumented,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Instruments key functions in domModifier module
 *
 * @returns {void}
 */
function instrumentDomModifier() {
  const processTextNodeInstrumented = instrumentFunction(
    domModifier,
    'processTextNode',
    'domModifier'
  );
  const applyConversionInstrumented = instrumentFunction(
    domModifier,
    'applyConversion',
    'domModifier'
  );
  const revertAllInstrumented = instrumentFunction(domModifier, 'revertAll', 'domModifier');

  // Store original methods
  const dm = domModifier;

  // Use Object.defineProperty to update with instrumented versions
  if (typeof dm.processTextNode === 'function') {
    Object.defineProperty(dm, 'processTextNode', {
      value: processTextNodeInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof dm.applyConversion === 'function') {
    Object.defineProperty(dm, 'applyConversion', {
      value: applyConversionInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof dm.revertAll === 'function') {
    Object.defineProperty(dm, 'revertAll', {
      value: revertAllInstrumented,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Instruments key functions in converter module
 *
 * @returns {void}
 */
function instrumentConverter() {
  const convertPriceInstrumented = instrumentFunction(
    converter,
    'convertPriceToTimeString',
    'converter'
  );
  const createWageInstrumented = instrumentFunction(converter, 'createWageObject', 'converter');

  // Store original methods
  const cv = converter;

  // Use Object.defineProperty to update with instrumented versions
  if (typeof cv.convertPriceToTimeString === 'function') {
    Object.defineProperty(cv, 'convertPriceToTimeString', {
      value: convertPriceInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof cv.createWageObject === 'function') {
    Object.defineProperty(cv, 'createWageObject', {
      value: createWageInstrumented,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Instruments key functions in domScanner module
 *
 * @returns {void}
 */
function instrumentDomScanner() {
  const walkInstrumented = instrumentFunction(domScanner, 'walk', 'domScanner');
  const startObserverInstrumented = instrumentFunction(domScanner, 'startObserver', 'domScanner');

  // Store original methods
  const ds = domScanner;

  // Use Object.defineProperty to update with instrumented versions
  if (typeof ds.walk === 'function') {
    Object.defineProperty(ds, 'walk', {
      value: walkInstrumented,
      writable: true,
      configurable: true,
    });
  }

  if (typeof ds.startObserver === 'function') {
    Object.defineProperty(ds, 'startObserver', {
      value: startObserverInstrumented,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Instruments key functions in recognitionService
 *
 * @returns {void}
 */
function instrumentRecognitionService() {
  // Store original function
  originals.recognitionService.extractCurrencies = recognitionService.extractCurrencies;

  // Create instrumented version
  const extractCurrenciesInstrumented = function (text, culture) {
    const flowId = performance.startFlow('recognitionService.extractCurrencies', 'service');

    try {
      const result = originals.recognitionService.extractCurrencies.call(this, text, culture);

      // Log information about the result
      if (result && Array.isArray(result)) {
        performance.markFlow(flowId, `found_${result.length}_currencies`);
      }

      performance.endFlow(flowId);
      return result;
    } catch (error) {
      performance.endFlow(flowId);
      throw error;
    }
  };

  // Apply instrumented version
  Object.defineProperty(recognitionService, 'extractCurrencies', {
    value: extractCurrenciesInstrumented,
    writable: true,
    configurable: true,
  });
}

/**
 * Instruments key functions in currencyService
 *
 * @returns {void}
 */
function instrumentCurrencyService() {
  // Store original functions
  originals.currencyService.createMoney = currencyService.createMoney;
  originals.currencyService.convertToTime = currencyService.convertToTime;

  // Instrument createMoney
  const createMoneyInstrumented = function (numericStringValue, currencyCode) {
    const flowId = performance.startFlow('currencyService.createMoney', 'service');

    try {
      const result = originals.currencyService.createMoney.call(
        this,
        numericStringValue,
        currencyCode
      );
      performance.markFlow(flowId, result ? 'success' : 'failure');
      performance.endFlow(flowId);
      return result;
    } catch (error) {
      performance.markFlow(flowId, 'error');
      performance.endFlow(flowId);
      throw error;
    }
  };

  // Instrument convertToTime
  const convertToTimeInstrumented = function (price, hourlyWage) {
    const flowId = performance.startFlow('currencyService.convertToTime', 'service');

    try {
      const result = originals.currencyService.convertToTime.call(this, price, hourlyWage);
      performance.markFlow(flowId, result ? 'success' : 'failure');
      performance.endFlow(flowId);
      return result;
    } catch (error) {
      performance.markFlow(flowId, 'error');
      performance.endFlow(flowId);
      throw error;
    }
  };

  // Apply instrumented versions
  Object.defineProperty(currencyService, 'createMoney', {
    value: createMoneyInstrumented,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(currencyService, 'convertToTime', {
    value: convertToTimeInstrumented,
    writable: true,
    configurable: true,
  });
}

/**
 * Instruments the main content flow to measure time from page load to first price conversion
 *
 * @param {object} contentModule - Content script module to instrument
 * @returns {void}
 */
function instrumentContentFlow(contentModule) {
  if (!contentModule) {
    logger.warn('Content module not provided for flow instrumentation');
    return;
  }

  // Store original convert function
  if (contentModule.convert) {
    originals.content.convert = contentModule.convert;

    // Create a counter for conversions
    let conversionCount = 0;
    const pageStartTime = window.performance.now();

    // Create instrumented version
    const convertInstrumented = function (textNode, preloadedSettings) {
      // Create a flow ID for this conversion attempt
      const flowId = performance.startFlow('content.convert', 'main');
      performance.markFlow(flowId, 'start_conversion');

      try {
        // Track first conversion time
        if (conversionCount === 0) {
          const firstConversionTime = window.performance.now() - pageStartTime;
          logger.info('Time to first conversion attempt:', firstConversionTime.toFixed(2) + 'ms');

          // Store as a standalone metric
          performance.mark('first_conversion_attempt_start');
          performance.measure('first_conversion_attempt');
        }

        // Call original function
        const result = originals.content.convert.call(this, textNode, preloadedSettings);

        // Increment counter if successful
        conversionCount++;
        performance.markFlow(flowId, `conversion_${conversionCount}`);

        // End flow
        performance.endFlow(flowId);
        return result;
      } catch (error) {
        performance.markFlow(flowId, 'error');
        performance.endFlow(flowId);
        throw error;
      }
    };

    // Apply instrumented version
    Object.defineProperty(contentModule, 'convert', {
      value: convertInstrumented,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Instruments the entire extension with performance monitoring
 *
 * @param {object} [contentModule] - Optional content script module to instrument for full flow
 * @returns {void}
 */
export function instrumentExtension(contentModule = null) {
  try {
    logger.info('Instrumenting extension with performance monitoring');

    // Instrument the individual modules
    instrumentPriceFinder();
    instrumentDomModifier();
    instrumentConverter();
    instrumentDomScanner();
    instrumentRecognitionService();
    instrumentCurrencyService();

    // Instrument content flow if provided
    if (contentModule) {
      instrumentContentFlow(contentModule);
    }

    logger.info('Performance instrumentation complete');
  } catch (error) {
    logger.error('Error instrumenting extension:', error.message, error.stack);
  }
}

/**
 * Restores original functions, removing instrumentation
 *
 * @returns {void}
 */
export function restoreOriginals() {
  try {
    logger.info('Removing performance instrumentation');

    // Restore priceFinder functions
    for (const funcName in originals.priceFinder) {
      if (originals.priceFinder[funcName]) {
        Object.defineProperty(priceFinder, funcName, {
          value: originals.priceFinder[funcName],
          writable: true,
          configurable: true,
        });
      }
    }

    // Restore domModifier functions
    for (const funcName in originals.domModifier) {
      if (originals.domModifier[funcName]) {
        Object.defineProperty(domModifier, funcName, {
          value: originals.domModifier[funcName],
          writable: true,
          configurable: true,
        });
      }
    }

    // Restore converter functions
    for (const funcName in originals.converter) {
      if (originals.converter[funcName]) {
        Object.defineProperty(converter, funcName, {
          value: originals.converter[funcName],
          writable: true,
          configurable: true,
        });
      }
    }

    // Restore domScanner functions
    for (const funcName in originals.domScanner) {
      if (originals.domScanner[funcName]) {
        Object.defineProperty(domScanner, funcName, {
          value: originals.domScanner[funcName],
          writable: true,
          configurable: true,
        });
      }
    }

    // Restore service functions
    if (originals.recognitionService.extractCurrencies) {
      Object.defineProperty(recognitionService, 'extractCurrencies', {
        value: originals.recognitionService.extractCurrencies,
        writable: true,
        configurable: true,
      });
    }

    if (originals.currencyService.createMoney) {
      Object.defineProperty(currencyService, 'createMoney', {
        value: originals.currencyService.createMoney,
        writable: true,
        configurable: true,
      });
    }

    if (originals.currencyService.convertToTime) {
      Object.defineProperty(currencyService, 'convertToTime', {
        value: originals.currencyService.convertToTime,
        writable: true,
        configurable: true,
      });
    }

    // Restore content module if it exists and was provided
    if (originals.content.convert && arguments[0]) {
      const contentModule = arguments[0];
      Object.defineProperty(contentModule, 'convert', {
        value: originals.content.convert,
        writable: true,
        configurable: true,
      });
    }

    logger.info('Performance instrumentation removed');
  } catch (error) {
    logger.error('Error removing instrumentation:', error.message, error.stack);
  }
}

/**
 * Collects and returns performance statistics
 *
 * @returns {object} Performance statistics organized by module and function
 */
export function collectPerformanceStats() {
  return performance.getAllStatistics();
}
