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
    var currencyLetters = items["currencyLetters"];
    var amount = items["amount"];
    var frequency = items["frequency"];
    var sourceMoney, workingWage, matchPattern;
    // Build matchPattern
    matchPattern = new RegExp('(\\' + currencySymbol + '|' + currencyLetters + ')\\x20?\\d(\\d|\\,)*(\\.\\d\\d)?', 'g');
    textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function(e) {
      sourceMoney = parseFloat(e.replace(/[^\d.]/g, '')).toFixed(2);
      workingWage = parseFloat(amount);
      if (frequency == "yearly") {
        workingWage = workingWage/52/40;
      }
      workingWage = workingWage.toFixed(2);
      return makeSnippet(e, workingWage);
    });
  });
}

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
