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
  currencyService: {}
};

/**
 * Instruments a single function with performance monitoring
 * 
 * @param {object} module - Module containing the function to instrument
 * @param {string} funcName - Name of the function to instrument
 * @param {string} moduleName - Name of the module (for logging and tracking)
 * @returns {void}
 */
function instrumentFunction(module, funcName, moduleName) {
  // Store original function for later restoration
  originals[moduleName][funcName] = module[funcName];
  
  // Replace with instrumented version
  module[funcName] = function(...args) {
    // Create unique flow ID
    const flowId = performance.startFlow(`${moduleName}.${funcName}`, 'function');
    
    try {
      // Call original function
      const result = originals[moduleName][funcName].apply(this, args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.then(value => {
          performance.endFlow(flowId);
          return value;
        }).catch(error => {
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
}

/**
 * Instruments key functions in priceFinder module
 * 
 * @returns {void}
 */
function instrumentPriceFinder() {
  instrumentFunction(priceFinder, 'findPrices', 'priceFinder');
  instrumentFunction(priceFinder, 'detectCultureFromText', 'priceFinder');
  instrumentFunction(priceFinder, 'mightContainPrice', 'priceFinder');
}

/**
 * Instruments key functions in domModifier module
 * 
 * @returns {void}
 */
function instrumentDomModifier() {
  instrumentFunction(domModifier, 'processTextNode', 'domModifier');
  instrumentFunction(domModifier, 'applyConversion', 'domModifier');
  instrumentFunction(domModifier, 'revertAll', 'domModifier');
}

/**
 * Instruments key functions in converter module
 * 
 * @returns {void}
 */
function instrumentConverter() {
  instrumentFunction(converter, 'convertPriceToTimeString', 'converter');
  instrumentFunction(converter, 'createWageObject', 'converter');
}

/**
 * Instruments key functions in domScanner module
 * 
 * @returns {void}
 */
function instrumentDomScanner() {
  instrumentFunction(domScanner, 'walk', 'domScanner');
  instrumentFunction(domScanner, 'startObserver', 'domScanner');
}

/**
 * Instruments key functions in recognitionService
 * 
 * @returns {void}
 */
function instrumentRecognitionService() {
  // Store original function
  originals.recognitionService.extractCurrencies = recognitionService.extractCurrencies;
  
  // Replace with instrumented version
  recognitionService.extractCurrencies = function(text, culture) {
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
  currencyService.createMoney = function(numericStringValue, currencyCode) {
    const flowId = performance.startFlow('currencyService.createMoney', 'service');
    
    try {
      const result = originals.currencyService.createMoney.call(this, numericStringValue, currencyCode);
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
  currencyService.convertToTime = function(price, hourlyWage) {
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
}

/**
 * Instruments the main content flow to measure time from page load to first price conversion
 * 
 * @param {object} contentScript - Content script module to instrument
 * @returns {void}
 */
function instrumentContentFlow(contentModule) {
  if (!contentModule) {
    logger.warn('Content module not provided for flow instrumentation');
    return;
  }
  
  // Store original convert function
  if (contentModule.convert) {
    originals.content = {
      convert: contentModule.convert
    };
    
    // Create a counter for conversions
    let conversionCount = 0;
    const pageStartTime = performance.now();
    
    // Replace with instrumented version
    contentModule.convert = function(textNode, preloadedSettings) {
      // Create a flow ID for this conversion attempt
      const flowId = performance.startFlow('content.convert', 'main');
      performance.markFlow(flowId, 'start_conversion');
      
      try {
        // Track first conversion time
        if (conversionCount === 0) {
          const firstConversionTime = performance.now() - pageStartTime;
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
      priceFinder[funcName] = originals.priceFinder[funcName];
    }
    
    // Restore domModifier functions
    for (const funcName in originals.domModifier) {
      domModifier[funcName] = originals.domModifier[funcName];
    }
    
    // Restore converter functions
    for (const funcName in originals.converter) {
      converter[funcName] = originals.converter[funcName];
    }
    
    // Restore domScanner functions
    for (const funcName in originals.domScanner) {
      domScanner[funcName] = originals.domScanner[funcName];
    }
    
    // Restore service functions
    if (originals.recognitionService.extractCurrencies) {
      recognitionService.extractCurrencies = originals.recognitionService.extractCurrencies;
    }
    
    if (originals.currencyService.createMoney) {
      currencyService.createMoney = originals.currencyService.createMoney;
    }
    
    if (originals.currencyService.convertToTime) {
      currencyService.convertToTime = originals.currencyService.convertToTime;
    }
    
    // Restore content module if it exists
    if (originals.content && originals.content.convert) {
      if (contentModule) {
        contentModule.convert = originals.content.convert;
      }
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