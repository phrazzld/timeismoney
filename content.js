chrome.storage.sync.get(null, function(obj) {
  if (obj["disabled"] !== true) { 
    walk(document.body);
  }
});

// Credit to t-j-crowder on StackOverflow for this walk function
// http://bit.ly/1o47R7V
function walk(node) {
  var child, next;

  switch (node.nodeType) {
    case 1:  // Element
    case 9:  // Document
    case 11: // Document fragment
      child = node.firstChild;
      while (child) {
        next = child.nextSibling;
        walk(child);
        child = next;
      }
      break;
    case 3:  // Text node
      convert(node);
      break;
  }
}

function convert(textNode) {
  chrome.storage.sync.get(null, function(items) {
    var currencySymbol = items["currencySymbol"];
    var currencyCode = items["currencyCode"];
    var amount = items["amount"];
    var frequency = items["frequency"];
    var thousands = items["thousands"];
    var decimal = items["decimal"];
    var sourceMoney, workingWage, matchPattern, thousandsString, decimalString;
    if (thousands == "commas") {
      thousandsString = '\\,';
      thousands = new RegExp(thousandsString, 'g');
    } else if (thousands == "spacesAndDots") {
      thousandsString = '(\\s|\\.)';
      thousands = new RegExp(thousandsString, 'g');
    }
    if (decimal == "dot") {
      decimalString = '\\.';
      decimal = new RegExp(decimalString, 'g');
    } else if (decimal == "comma") {
      decimalString = '\\,';
      decimal = new RegExp(decimalString, 'g');
    }
    // Currency indicator preceding amount
    matchPattern = new RegExp('(\\' + currencySymbol + '|' + currencyCode + ')\\x20?\\d(\\d|' + thousandsString + ')*(' + decimalString + '\\d\\d)?', 'g');
    textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function(e) {
      sourceMoney = e.replace(thousands, '@').replace(decimal, '~').replace('~', '.').replace('@', '');
      sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, '')).toFixed(2);
      workingWage = parseFloat(amount);
      if (frequency == "yearly") {
        workingWage = workingWage/52/40;
      }
      workingWage = workingWage.toFixed(2);
      return makeSnippet(e, sourceMoney, workingWage);
    });
    // Currency indicator concluding amount
    matchPattern = new RegExp('\\d(\\d|' + thousandsString + ')*(' + decimalString + '\\d\\d)?\\x20?(\\' + currencySymbol + '|' + currencyCode + ')', 'g');
    textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function(e) {
      sourceMoney = e.replace(thousands, '@').replace(decimal, '~').replace('~', '.').replace('@', '');
      sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, '')).toFixed(2);
      workingWage = parseFloat(amount);
      if (frequency == "yearly") {
        workingWage = workingWage/52/40;
      }
      workingWage = workingWage.toFixed(2);
      return makeSnippet(e, sourceMoney,  workingWage);
    });

  });
}

// Build text element in the form of: original (conversion)
function makeSnippet(sourceElement, sourceMoney, workingWage) {
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
