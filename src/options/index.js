/**
 * Saves options from the form to Chrome storage
 * Shows success message and closes the options page
 */
const saveOptions = () => {
  const currencySymbol = document.getElementById('currency-symbol').value;
  const currencyCode = document.getElementById('currency-code').value;
  const frequency = document.getElementById('frequency').value;
  let amount = document.getElementById('amount').value;
  const thousands = document.getElementById('thousands').value;
  const decimal = document.getElementById('decimal').value;
  if (decimal !== 'dot') {
    amount = amount.replace(/(\s|\.)/g, '').replace(',', '.');
  }
  amount = parseFloat(amount.replace(/[^\d.]/g, '')).toFixed(2);
  const status = document.getElementById('status');

  if (isNaN(amount)) {
    status.textContent = chrome.i18n.getMessage('amountErr');
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } else {
    chrome.storage.sync.set(
      {
        currencySymbol: currencySymbol,
        currencyCode: currencyCode,
        frequency: frequency,
        amount: amount,
        thousands: thousands,
        decimal: decimal,
      },
      () => {
        status.textContent = chrome.i18n.getMessage('saveSuccess');
        setTimeout(() => {
          status.textContent = '';
        }, 2000);
      }
    );
  }

  window.close();
};

/**
 * Toggles the display of advanced formatting options
 * Updates the toggle button text based on current state
 */
const toggleFormatting = () => {
  const formatting = document.getElementById('formatting');
  const togglr = document.getElementById('togglr');
  if (formatting.style.display === 'none') {
    togglr.textContent = chrome.i18n.getMessage('advHide');
    formatting.style.display = 'block';
  } else {
    togglr.textContent = chrome.i18n.getMessage('advShow');
    formatting.style.display = 'none';
  }
};

/**
 * Determines tooltip text based on input field ID
 *
 * @param {string} id - The ID of the input field
 * @returns {string} The tooltip text for the given field
 */
const setTooltipText = (id) => {
  switch (id) {
    case 'currency-code':
      return chrome.i18n.getMessage('currencyCode');
    case 'currency-symbol':
      return chrome.i18n.getMessage('currencySymbol');
    case 'amount':
      return chrome.i18n.getMessage('incomeAmount');
    case 'frequency':
      return chrome.i18n.getMessage('payFrequency');
  }
};

/**
 * Event handler to show tooltip for the current input field
 * Uses this.id to determine which field is focused
 */
const showTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
  tooltip.textContent = setTooltipText(this.id);
};

/**
 * Event handler to hide tooltip when input loses focus
 */
const hideTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
};

/**
 * Initializes options form with values from Chrome storage
 */
const initializeOptions = () => {
  chrome.storage.sync.get(null, (items) => {
    const currencySymbol = items['currencySymbol'];
    const currencyCode = items['currencyCode'];
    const frequency = items['frequency'];
    const amount = items['amount'];
    const thousands = items['thousands'];
    const decimal = items['decimal'];
    loadSavedOption('currency-symbol', currencySymbol);
    loadSavedOption('currency-code', currencyCode);
    loadSavedOption('frequency', frequency);
    loadSavedOption('amount', amount, decimal);
    loadSavedOption('thousands', thousands);
    loadSavedOption('decimal', decimal);
  });
};

/**
 * Loads localized messages for UI elements
 */
const loadMessagesFromLocale = () => {
  document.getElementById('ext-desc').textContent = chrome.i18n.getMessage('extDesc');
  document.getElementById('ext-instructions').textContent = chrome.i18n.getMessage('instructions');
  document.getElementById('hourly').textContent = chrome.i18n.getMessage('hourly');
  document.getElementById('yearly').textContent = chrome.i18n.getMessage('yearly');
  document.getElementById('save').textContent = chrome.i18n.getMessage('save');
  document.getElementById('togglr').textContent = chrome.i18n.getMessage('advShow');
  document.getElementById('formatting-header').textContent =
    chrome.i18n.getMessage('currencyFormat');
  document.getElementById('thousands-label').textContent = chrome.i18n.getMessage('thousandsPlace');
  document.getElementById('decimal-label').textContent = chrome.i18n.getMessage('decimalPlace');
  document.getElementById('commas').textContent = chrome.i18n.getMessage('commas');
  document.getElementById('comma').textContent = chrome.i18n.getMessage('comma');
  document.getElementById('spaces-and-dots').textContent = chrome.i18n.getMessage('spacesAndDots');
  document.getElementById('dot').textContent = chrome.i18n.getMessage('dot');
  document.title = chrome.i18n.getMessage('optionsTitle');
};

/**
 * Sets the value of a form element with saved data
 *
 * @param {string} elementId - The ID of the element to update
 * @param {*} value - The value to set
 * @param {string} decimal - The decimal format to use (default: 'dot')
 */
const loadSavedOption = (elementId, value, decimal = 'dot') => {
  if (value !== undefined && value !== null) {
    document.getElementById(elementId).value =
      elementId === 'amount' ? formatIncomeAmount(value, decimal) : value;
  }
};

/**
 * Formats a number according to the user's decimal format preference
 *
 * @param {string|number} x - The number to format
 * @param {string} decimal - The decimal format ('dot' or 'comma')
 * @returns {string} Formatted number string
 */
const formatIncomeAmount = (x, decimal) => {
  if (decimal === 'dot') {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else {
    return x
      .toString()
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
};

// Event listeners
document.addEventListener('DOMContentLoaded', loadMessagesFromLocale);
document.addEventListener('DOMContentLoaded', initializeOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('formatting').style.display = 'none';
document.getElementById('togglr').addEventListener('click', toggleFormatting);
document.getElementById('currency-code').addEventListener('focus', showTooltip);
document.getElementById('currency-symbol').addEventListener('focus', showTooltip);
document.getElementById('amount').addEventListener('focus', showTooltip);
document.getElementById('frequency').addEventListener('focus', showTooltip);
document.getElementById('currency-code').addEventListener('blur', hideTooltip);
document.getElementById('currency-symbol').addEventListener('blur', hideTooltip);
document.getElementById('amount').addEventListener('blur', hideTooltip);
document.getElementById('frequency').addEventListener('blur', hideTooltip);
