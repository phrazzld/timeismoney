chrome.storage.sync.get(null, function(items) {
  if (items["disabled"] !== true) { 
    var bod = document.body;
    var currencySymbol = items["currencySymbol"];
    var currencyLetters = items["currencyLetters"];
    var amount = items["amount"];
    var frequency = items["frequency"];
    var sourceMoney, workingWage, matchPattern;

    // Build matchPattern
    matchPattern = new RegExp('(\\' + currencySymbol + '|' + currencyLetters + ')\\x20?\\d(\\d|\\,)*(\\.\\d\\d)?', 'g');
    bod.innerHTML = bod.innerHTML.replace(matchPattern, function(e) {
      sourceMoney = parseFloat(e.replace(/[^\d.]/g, '')).toFixed(2);
      workingWage = parseFloat(amount);
      if (frequency == "yearly") {
        workingWage = workingWage/52/40;
      }
      workingWage = workingWage.toFixed(2);
      return makeSnippet(e, workingWage);
    });
  }
});

function makeSnippet(sourceElement, workingWage) {
  var sourceMoney = parseFloat(sourceElement.replace(/[^\d.]/g, '')).toFixed(2);
  var workHours = sourceMoney / workingWage;
  var hours, minutes, message;
  if (!isNaN(workHours)) {
    hours = Math.floor(workHours);
    minutes = Math.ceil(60 * (workHours - hours));
    if (minutes == 60) {
      hours += 1;
      minutes = 0;
    }
    message = sourceElement + " (" + hours + "h " + minutes + "m)";
  } else {
    message = sourceElement;
  }
  return message;
}
