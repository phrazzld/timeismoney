/**
 * Tooltip functionality module for options page
 * Provides help text for form fields using delegated event handling
 *
 * @module options/tooltip
 */

// Tooltip element reference
let tooltipElement;

// Map of input IDs to help text message keys
const tooltipMessages = {
  'currency-code': 'currencyCode',
  'currency-symbol': 'currencySymbol',
  amount: 'incomeAmount',
  frequency: 'payFrequency',
  'debounce-interval': 'debounceTooltip',
};

/**
 * Initializes tooltip functionality with delegated event handling
 *
 * @returns {void}
 */
export function initTooltips() {
  // Get tooltip element reference
  tooltipElement = document.getElementById('master-tooltip');

  // Set up delegated event handlers on the form container
  const formContainer = document.getElementById('form');
  if (formContainer) {
    formContainer.addEventListener('focusin', handleFocusIn);
    formContainer.addEventListener('focusout', handleFocusOut);
  }
}

/**
 * Handle focus events on form inputs
 * Shows tooltip for supported elements
 *
 * @param {FocusEvent} event - The focus event
 */
function handleFocusIn(event) {
  const target = event.target;

  // Only handle specific form inputs
  if (target?.id && tooltipMessages[target.id]) {
    showTooltip(target.id);
  }
}

/**
 * Handle blur events on form inputs
 * Hides the tooltip
 */
function handleFocusOut() {
  hideTooltip();
}

/**
 * Shows tooltip with text appropriate for the given input ID
 *
 * @param {string} inputId - The ID of the input field
 */
function showTooltip(inputId) {
  if (!tooltipElement) return;

  const tooltipText = getTooltipText(inputId);
  tooltipElement.textContent = tooltipText;
}

/**
 * Hides the tooltip by clearing its content
 */
function hideTooltip() {
  if (!tooltipElement) return;

  tooltipElement.textContent = '';
}

/**
 * Gets localized tooltip text for a form input
 *
 * @param {string} inputId - The ID of the input field
 * @returns {string} Localized tooltip text or empty string
 */
function getTooltipText(inputId) {
  const messageKey = tooltipMessages[inputId];
  if (messageKey) {
    return chrome.i18n.getMessage(messageKey);
  }
  return '';
}
