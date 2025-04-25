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

const showTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
  tooltip.textContent = setTooltipText(this.id);
};

const hideTooltip = function () {
  const tooltip = document.getElementById('master-tooltip');
  tooltip.textContent = '';
};

const initializeOptions = () => {
  chrome.storage.sync.get(null, (items) => {
    let currencySymbol, currencyCode, frequency, amount, thousands, decimal;
    currencySymbol = items['currencySymbol'];
    currencyCode = items['currencyCode'];
    frequency = items['frequency'];
    amount = items['amount'];
    thousands = items['thousands'];
    decimal = items['decimal'];
    loadSavedOption('currency-symbol', currencySymbol);
    loadSavedOption('currency-code', currencyCode);
    loadSavedOption('frequency', frequency);
    loadSavedOption('amount', amount, decimal);
    loadSavedOption('thousands', thousands);
    loadSavedOption('decimal', decimal);
  });
};

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

const loadSavedOption = (elementId, value, decimal = 'dot') => {
  if (value !== undefined && value !== null) {
    document.getElementById(elementId).value =
      elementId === 'amount' ? formatIncomeAmount(value, decimal) : value;
  }
};

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
