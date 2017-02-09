chrome.storage.sync.get("disabled", function(obj) {
  if (obj["disabled"] !== true) { 
    walk(document.body);
  }
});

function walk(node) {
  // I stole this function from here:
  // http://is.gd/mwZp7E

  var child, next;

  switch(node.nodeType) {
    case 1:
    case 9:
    case 11:
      child = node.firstChild;
      while(child) {
        next = child.nextSibling;
        walk(child);
        child = next;
      }
      break;
    case 3:
      plumb(node);
      break;
    default:
      break;
  }
}

function plumb(textNode) {
  chrome.storage.sync.get(null, function(items) {
    // Get saved user preferences
    var currency, frequency, amount, workingwage;
    currency = items["currency"];
    frequency = items["frequency"];
    amount = items["amount"];
    // Adjust saved income down to hourly
    if(frequency == "yearly") {
      workingwage = parseFloat(amount)/52/40;
    } else if(frequency == "hourly") {
      workingwage = parseFloat(amount);
    }

    var original = textNode.nodeValue;
    var keeptruckin, newstring;
    if(currency == "eur") {
      keeptruckin = original.match(/(\€|EUR)(\s?)[0-9](([0-9]|\,)*\.?[0-9]{2}?)?/g);
    } else if(currency == "gbp") {
      keeptruckin = original.match(/(\£|GBP)(\s?)[0-9](([0-9]|\,)*\.?[0-9]{2}?)?/g);
    } else {
      keeptruckin = original.match(/(\$|USD|CAD|MXN|AUD|HKD|NZD)(\s?)[0-9](([0-9]|\,)*\.?[0-9]{2}?)?/g);
    }
    if(workingwage <= 0) {
      keeptruckin = false;
    }
    if(keeptruckin) {
      newstring = original.trim();
      newstring = newstring.replace(/[^\d.]/g, '');
      var time = parseFloat(newstring) / workingwage;
      var hours, minutes, msg;
      if(!isNaN(time)) {
        hours = Math.floor(time);
        minutes = Math.ceil(60 * (time - hours));
        if(minutes == 60) {
          hours += 1;
          minutes = 0;
        }
        msg = original + " (" + hours + "h " + minutes + "m" + ") ";
        textNode.nodeValue = msg;
      }
    }
  });
}

