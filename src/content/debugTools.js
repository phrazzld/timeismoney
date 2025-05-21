/**
 * Debug Tools module for price detection and conversion
 * Provides functionality for highlighting elements and displaying debugging information
 *
 * @module content/debugTools
 */

import { DEBUG_HIGHLIGHT_CLASSES } from '../utils/constants.js';
import * as logger from '../utils/logger.js';

/**
 * Creates debug state to track price debugging information
 *
 * @returns {object} Debug state object
 */
export const createDebugState = () => {
  return {
    enabled: false, // Whether debug mode is enabled
    elementsScanned: 0, // Total elements scanned
    textNodesScanned: 0, // Total text nodes scanned
    potentialPricesFound: 0, // Number of potential prices detected
    pricesConverted: 0, // Number of prices successfully converted
    conversionFailures: 0, // Number of price conversions that failed

    // Timing information
    scanStartTime: 0, // Timestamp when scanning started
    scanEndTime: 0, // Timestamp when scanning ended
    conversionTime: 0, // Time spent on conversion (ms)

    // Last processed items for detailed inspection
    lastElement: null, // Last element processed
    lastText: '', // Last text content processed
    lastDetectedPrice: null, // Last price detected

    // Debug panel reference
    debugPanel: null, // Reference to the debug panel element

    // Log buffer for detailed logs
    logEntries: [], // Array of log entries
    maxLogEntries: 100, // Maximum number of log entries to keep

    /**
     * Reset scan counters
     */
    resetCounters() {
      this.elementsScanned = 0;
      this.textNodesScanned = 0;
      this.potentialPricesFound = 0;
      this.pricesConverted = 0;
      this.conversionFailures = 0;
      this.scanStartTime = 0;
      this.scanEndTime = 0;
      this.conversionTime = 0;
    },

    /**
     * Add a log entry to the debug log
     *
     * @param {string} type - Log type (info, warn, error)
     * @param {string} message - Log message
     * @param {object} [data] - Additional data to log
     */
    addLogEntry(type, message, data = null) {
      const entry = {
        timestamp: new Date().toISOString(),
        type,
        message,
        data,
      };

      this.logEntries.unshift(entry); // Add to beginning for newest first

      // Trim log if needed
      if (this.logEntries.length > this.maxLogEntries) {
        this.logEntries.pop(); // Remove oldest entry
      }

      // Also log to console for easier development
      if (type === 'error') {
        logger.error(message, data);
      } else if (type === 'warn') {
        logger.warn(message, data);
      } else {
        logger.debug(message, data);
      }

      // Update the debug panel if it exists
      this.updateDebugPanel();
    },

    /**
     * Update the debug panel with current state
     */
    updateDebugPanel() {
      if (!this.debugPanel) return;

      // Update counters
      const countersEl = this.debugPanel.querySelector('.tim-debug-counters');
      if (countersEl) {
        countersEl.innerHTML = `
          <div>Elements scanned: ${this.elementsScanned}</div>
          <div>Text nodes scanned: ${this.textNodesScanned}</div>
          <div>Potential prices: ${this.potentialPricesFound}</div>
          <div>Prices converted: ${this.pricesConverted}</div>
          <div>Conversion failures: ${this.conversionFailures}</div>
          <div>Scan time: ${this.scanEndTime - this.scanStartTime}ms</div>
          <div>Conversion time: ${this.conversionTime}ms</div>
        `;
      }

      // Update last processed item
      const lastProcessedEl = this.debugPanel.querySelector('.tim-debug-last-processed');
      if (lastProcessedEl && this.lastText) {
        lastProcessedEl.innerHTML = `
          <div><strong>Last text:</strong> ${this.lastText.substring(0, 100)}</div>
          <div><strong>Detected price:</strong> ${this.lastDetectedPrice || 'None'}</div>
        `;
      }

      // Update log entries
      const logEl = this.debugPanel.querySelector('.tim-debug-log');
      if (logEl) {
        const logHtml = this.logEntries
          .map((entry) => {
            const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // Just the time part
            const dataText = entry.data ? `<pre>${JSON.stringify(entry.data, null, 2)}</pre>` : '';
            return `<div class="tim-log-entry tim-log-${entry.type}">
            <span class="tim-log-time">${timestamp}</span>
            <span class="tim-log-message">${entry.message}</span>
            ${dataText}
          </div>`;
          })
          .join('');

        logEl.innerHTML = logHtml;
      }
    },
  };
};

// Create global debug state for the content script
export const debugState = createDebugState();

/**
 * Initializes the debug mode based on user settings
 *
 * @param {object} settings - User settings
 */
export const initDebugMode = (settings) => {
  debugState.enabled = settings?.debugMode || false;

  // Initialize debug CSS styles if debug mode is enabled
  if (debugState.enabled) {
    injectDebugStyles();
    createDebugPanel();
    logger.debug('Debug mode enabled');
    debugState.addLogEntry('info', 'Debug mode initialized');
  } else {
    // Remove debug panel and styles if they exist
    removeDebugPanel();
    removeDebugStyles();
  }
};

/**
 * Start scanning timer
 */
export const startScanTimer = () => {
  if (!debugState.enabled) return;

  debugState.scanStartTime = performance.now();
  debugState.addLogEntry('info', 'Started scanning');
};

/**
 * End scanning timer
 */
export const endScanTimer = () => {
  if (!debugState.enabled) return;

  debugState.scanEndTime = performance.now();
  const duration = Math.round(debugState.scanEndTime - debugState.scanStartTime);
  debugState.addLogEntry('info', `Finished scanning in ${duration}ms`);
};

/**
 * Mark an element as a price candidate for debugging
 *
 * @param {Element} element - The element to mark
 */
export const markPriceCandidate = (element) => {
  if (!debugState.enabled || !element) return;

  debugState.elementsScanned++;

  // Add highlight class
  element.classList.add(DEBUG_HIGHLIGHT_CLASSES.CANDIDATE);
  debugState.updateDebugPanel();
};

/**
 * Mark a text node as processed for debugging
 *
 * @param {Node} textNode - The text node that was processed
 * @param {string} text - The text content
 * @param {boolean} hasPotentialPrice - Whether the text might contain a price
 */
export const markTextProcessed = (textNode, text, hasPotentialPrice) => {
  if (!debugState.enabled || !textNode) return;

  debugState.textNodesScanned++;
  debugState.lastText = text;

  if (hasPotentialPrice) {
    debugState.potentialPricesFound++;

    // Try to find the parent element to highlight
    const parentElement = textNode.parentElement;
    if (parentElement) {
      parentElement.classList.add(DEBUG_HIGHLIGHT_CLASSES.DETECTED);
      debugState.addLogEntry('info', 'Potential price detected', { text });
    }
  }

  debugState.updateDebugPanel();
};

/**
 * Mark a conversion as successful for debugging
 *
 * @param {Element} element - The element with the converted price
 * @param {string} originalPrice - The original price text
 * @param {string} convertedText - The converted price with time
 */
export const markConversionSuccess = (element, originalPrice, convertedText) => {
  if (!debugState.enabled || !element) return;

  debugState.pricesConverted++;
  debugState.lastDetectedPrice = originalPrice;

  // Update element classes
  element.classList.remove(DEBUG_HIGHLIGHT_CLASSES.DETECTED);
  element.classList.add(DEBUG_HIGHLIGHT_CLASSES.CONVERTED);

  debugState.addLogEntry('info', 'Price conversion success', {
    original: originalPrice,
    converted: convertedText,
  });

  debugState.updateDebugPanel();
};

/**
 * Mark a conversion as failed for debugging
 *
 * @param {Element} element - The element with the failed price conversion
 * @param {string} text - The text that failed conversion
 * @param {string} reason - The reason for failure
 */
export const markConversionFailure = (element, text, reason) => {
  if (!debugState.enabled || !element) return;

  debugState.conversionFailures++;

  // Update element classes
  element.classList.remove(DEBUG_HIGHLIGHT_CLASSES.DETECTED);
  element.classList.add(DEBUG_HIGHLIGHT_CLASSES.FAILED);

  debugState.addLogEntry('warn', 'Price conversion failed', {
    text,
    reason,
  });

  debugState.updateDebugPanel();
};

/**
 * Record conversion time for debugging
 *
 * @param {number} durationMs - The duration of the conversion in milliseconds
 */
export const recordConversionTime = (durationMs) => {
  if (!debugState.enabled) return;

  debugState.conversionTime = durationMs;
  debugState.updateDebugPanel();
};

/**
 * Inject CSS styles for debugging highlights
 */
const injectDebugStyles = () => {
  const styleId = 'tim-debug-styles';

  // Don't add styles if they already exist
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Debug highlight styles */
    .${DEBUG_HIGHLIGHT_CLASSES.CANDIDATE} {
      outline: 2px dashed #ffcc00 !important;
      background-color: rgba(255, 204, 0, 0.1) !important;
    }
    
    .${DEBUG_HIGHLIGHT_CLASSES.DETECTED} {
      outline: 2px dashed #ff9900 !important;
      background-color: rgba(255, 153, 0, 0.2) !important;
    }
    
    .${DEBUG_HIGHLIGHT_CLASSES.CONVERTED} {
      outline: 2px solid #00cc00 !important;
      background-color: rgba(0, 204, 0, 0.1) !important;
    }
    
    .${DEBUG_HIGHLIGHT_CLASSES.FAILED} {
      outline: 2px solid #cc0000 !important;
      background-color: rgba(204, 0, 0, 0.1) !important;
    }
    
    .${DEBUG_HIGHLIGHT_CLASSES.IGNORED} {
      outline: 2px dotted #cccccc !important;
      background-color: rgba(200, 200, 200, 0.1) !important;
    }
    
    /* Debug panel styles */
    #tim-debug-panel {
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 350px;
      max-height: 500px;
      background-color: rgba(240, 240, 240, 0.95);
      border: 1px solid #aaa;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      z-index: 9999999;
      font-family: monospace;
      font-size: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    #tim-debug-panel-header {
      padding: 8px;
      background-color: #444;
      color: white;
      font-weight: bold;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    #tim-debug-panel-header .tim-debug-buttons {
      display: flex;
      gap: 5px;
    }
    
    #tim-debug-panel-header button {
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      font-size: 14px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
    }
    
    #tim-debug-panel-header button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    #tim-debug-panel-content {
      padding: 10px;
      overflow-y: auto;
      max-height: 450px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .tim-debug-section {
      margin-bottom: 10px;
    }
    
    .tim-debug-section-header {
      font-weight: bold;
      margin-bottom: 5px;
      padding-bottom: 3px;
      border-bottom: 1px solid #ddd;
    }
    
    .tim-debug-counters {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    
    .tim-debug-log {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      padding: 5px;
      background-color: #f8f8f8;
    }
    
    .tim-log-entry {
      margin-bottom: 3px;
      padding: 2px;
      border-bottom: 1px solid #eee;
    }
    
    .tim-log-time {
      color: #888;
      margin-right: 5px;
    }
    
    .tim-log-entry pre {
      margin: 3px 0 3px 15px;
      max-height: 100px;
      overflow-y: auto;
      background-color: #f0f0f0;
      padding: 3px;
      border-radius: 3px;
      font-size: 11px;
    }
    
    .tim-log-info {
      color: #333;
    }
    
    .tim-log-warn {
      color: #996600;
      background-color: #fffbf0;
    }
    
    .tim-log-error {
      color: #cc0000;
      background-color: #fff8f8;
    }
    
    .tim-debug-panel-minimized {
      height: 34px !important;
    }
    
    .tim-debug-panel-minimized #tim-debug-panel-content {
      display: none;
    }
  `;

  document.head.appendChild(style);
};

/**
 * Remove debug styles
 */
const removeDebugStyles = () => {
  const styleEl = document.getElementById('tim-debug-styles');
  if (styleEl) {
    styleEl.remove();
  }
};

/**
 * Create debug panel
 */
const createDebugPanel = () => {
  // Remove existing panel if it exists
  removeDebugPanel();

  const panel = document.createElement('div');
  panel.id = 'tim-debug-panel';

  // Create panel header
  const header = document.createElement('div');
  header.id = 'tim-debug-panel-header';
  header.innerHTML = `
    <span>TimeIsMoney Debug</span>
    <div class="tim-debug-buttons">
      <button id="tim-debug-minimize">_</button>
      <button id="tim-debug-clear">⟳</button>
      <button id="tim-debug-close">✕</button>
    </div>
  `;

  // Create panel content
  const content = document.createElement('div');
  content.id = 'tim-debug-panel-content';
  content.innerHTML = `
    <div class="tim-debug-section">
      <div class="tim-debug-section-header">Counters</div>
      <div class="tim-debug-counters">
        <div>Elements scanned: 0</div>
        <div>Text nodes scanned: 0</div>
        <div>Potential prices: 0</div>
        <div>Prices converted: 0</div>
        <div>Conversion failures: 0</div>
        <div>Scan time: 0ms</div>
        <div>Conversion time: 0ms</div>
      </div>
    </div>
    
    <div class="tim-debug-section">
      <div class="tim-debug-section-header">Last Processed</div>
      <div class="tim-debug-last-processed">
        <div><strong>Last text:</strong> None</div>
        <div><strong>Detected price:</strong> None</div>
      </div>
    </div>
    
    <div class="tim-debug-section">
      <div class="tim-debug-section-header">Log</div>
      <div class="tim-debug-log"></div>
    </div>
  `;

  // Append elements to panel
  panel.appendChild(header);
  panel.appendChild(content);

  // Save reference to the panel
  debugState.debugPanel = panel;

  // Make panel draggable
  makeDraggable(panel, header);

  // Add event listeners
  panel.querySelector('#tim-debug-minimize').addEventListener('click', () => {
    panel.classList.toggle('tim-debug-panel-minimized');
  });

  panel.querySelector('#tim-debug-clear').addEventListener('click', () => {
    debugState.resetCounters();
    debugState.logEntries = [];
    debugState.updateDebugPanel();

    // Clear highlights from the page
    document
      .querySelectorAll(
        [
          `.${DEBUG_HIGHLIGHT_CLASSES.CANDIDATE}`,
          `.${DEBUG_HIGHLIGHT_CLASSES.DETECTED}`,
          `.${DEBUG_HIGHLIGHT_CLASSES.CONVERTED}`,
          `.${DEBUG_HIGHLIGHT_CLASSES.FAILED}`,
          `.${DEBUG_HIGHLIGHT_CLASSES.IGNORED}`,
        ].join(', ')
      )
      .forEach((el) => {
        Object.values(DEBUG_HIGHLIGHT_CLASSES).forEach((className) => {
          el.classList.remove(className);
        });
      });
  });

  panel.querySelector('#tim-debug-close').addEventListener('click', () => {
    panel.remove();
    debugState.debugPanel = null;
  });

  // Add panel to the page
  document.body.appendChild(panel);
};

/**
 * Remove debug panel if it exists
 */
const removeDebugPanel = () => {
  const panel = document.getElementById('tim-debug-panel');
  if (panel) {
    panel.remove();
  }
  debugState.debugPanel = null;
};

/**
 * Make an element draggable by its header
 *
 * @param {Element} elementToDrag - The element to make draggable
 * @param {Element} dragHandle - The element to use as a drag handle
 */
const makeDraggable = (elementToDrag, dragHandle) => {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  dragHandle.addEventListener('mousedown', dragMouseDown);

  function dragMouseDown(e) {
    e.preventDefault();
    // Get initial cursor position
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', elementDrag);
    document.addEventListener('mouseup', closeDragElement);
  }

  function elementDrag(e) {
    e.preventDefault();
    // Calculate new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set new position
    elementToDrag.style.top = elementToDrag.offsetTop - pos2 + 'px';
    elementToDrag.style.left = elementToDrag.offsetLeft - pos1 + 'px';
    // Reset bottom/right positioning when manually positioned
    elementToDrag.style.bottom = 'auto';
    elementToDrag.style.right = 'auto';
  }

  function closeDragElement() {
    // Remove event listeners
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
  }
};
