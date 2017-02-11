function saveOptions() {
  var currencySymbol = document.getElementById('currency-symbol').value;
  var currencyLetters = document.getElementById('currency-letters').value;
  var frequency = document.getElementById('frequency').value;
  var amount = document.getElementById('amount').value;
  var thousands = document.getElementById('thousands').value;
  var decimal = document.getElementById('decimal').value;
  amount = parseFloat(amount.replace(/[^\d.]/g, '')).toFixed(2);
  var status = document.getElementById('status');

  if (isNaN(amount)) {
    status.textContent = 'Error! Invalid amount entered.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  } else {
    chrome.storage.sync.set({
      currencySymbol: currencySymbol,
      currencyLetters: currencyLetters,
      frequency: frequency,
      amount: amount,
      thousands: thousands,
      decimal: decimal
    }, function() {
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 2000);
    });
  }
}

function initializeOptions() {
  chrome.storage.sync.get(null, function(items) {
    var currencySymbol, currencyLetters, frequency, amount, thousands, decimal;
    currencySymbol = items['currencySymbol'];
    currencyLetters = items['currencyLetters'];
    frequency = items['frequency'];
    amount = items['amount'];
    thousands = items['thousands'];
    decimal = items['decimal'];
    loadSavedOption('currency-symbol', currencySymbol);
    loadSavedOption('currency-letters', currencyLetters);
    loadSavedOption('frequency', frequency);
    loadSavedOption('amount', amount);
    loadSavedOption('thousands', thousands);
    loadSavedOption('decimal', decimal);
  });
}

function loadSavedOption(elementId, value) {
  if (value !== undefined && value !== null) {
    document.getElementById(elementId).value = elementId == "amount" ? numberWithCommas(value) : value;
  }
}

// Code from http://bit.ly/1ooHsSO
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

document.addEventListener('DOMContentLoaded', initializeOptions);
document.getElementById('save').addEventListener('click', saveOptions);
