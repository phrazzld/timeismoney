function saveOptions() {
  var currency = document.getElementById('currency').value;
  var frequency = document.getElementById('frequency').value;
  var amount = document.getElementById('amount').value;
  amount = amount.replace(/(\$|,|€|£| +?)/g, '');
  if(amount == "") {
    amount = 0;
  }
  var status = document.getElementById('status');
  if(isNaN(amount)) {
    status.textContent = 'Error! Invalid amount entered.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  } else {
    chrome.storage.sync.set({
      currency: currency,
      frequency: frequency,
      amount: amount
    }, function() {
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
}

function initializeOptions() {
  chrome.storage.sync.get(null, function(items) {
    var currency, frequency, amount;
    currency = items['currency'];
    frequency = items['frequency'];
    amount = items['amount'];
    if(currency !== undefined && currency !== null) {
      document.getElementById('currency').value = currency;
    }
    if(frequency !== undefined && frequency !== null) {
      document.getElementById('frequency').value = frequency;
    }
    if(amount !== undefined && amount !== null) {
      document.getElementById('amount').value = numberWithCommas(amount);
    }
  });
}

// Code from http://bit.ly/1ooHsSO
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

document.addEventListener('DOMContentLoaded', initializeOptions);
document.getElementById('save').addEventListener('click', saveOptions);

