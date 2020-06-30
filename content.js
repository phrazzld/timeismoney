chrome.storage.sync.get(null, function(obj) {
    if (obj['disabled'] !== true) {
	walk(document.body)
    }
})

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
      walk(document.body)
  });

// Credit to t-j-crowder on StackOverflow for this walk function
// http://bit.ly/1o47R7V
function walk(node) {
  var child, next, price

  switch (node.nodeType) {
    case 1:  // Element
    case 9:  // Document
    case 11: // Document fragment
      child = node.firstChild
      while (child) {
        next = child.nextSibling

        // Check if child is Amazon display price
        var classes = child.classList
        if (classes && classes.value === 'sx-price-currency') {
          price = child.firstChild.nodeValue.toString()
          child.firstChild.nodeValue = null
        } else if (classes && classes.value === 'sx-price-whole') {
          price += child.firstChild.nodeValue.toString()
          child.firstChild.nodeValue = price
            convert(child.firstChild)
          child = next
        } else if (classes && classes.value === 'sx-price-fractional') {
          child.firstChild.nodeValue = null
          price = null
        }

        walk(child)
        child = next
      }
      break
    case 3:  // Text node
      convert(node)
      break
  }
}

function buildThousandsString(delimiter) {
  if (delimiter === 'commas') {
    return '\\,'
  } else if (delimiter === 'spacesAndDots') {
    return '(\\s|\\.)'
  } else {
    throw 'Not a recognized delimiter for thousands!'
  }
}

function buildDecimalString(delimiter) {
  if (delimiter === 'dot') {
    return '\\.'
  } else if (delimiter === 'comma') {
    return '\\,'
  } else {
    throw 'Not a recognized delimiter for decimals!'
  }
}

function buildPrecedingMatchPattern(currencySymbol, currencyCode,
				    thousandsString, decimalString) {
  return new RegExp(`(\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?`, 'g')
}

function reversePrecedingMatchPattern(currencySymbol, currencyCode,
				    thousandsString, decimalString) {
  return new RegExp(`((\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?)\\s\\(\\d+h\\s\\d+m\\)`, 'g')
}

function buildConcludingMatchPattern(currencySymbol, currencyCode,
				     thousandsString, decimalString) {
  return new RegExp(`\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})`, 'g')
}

function reverseConcludingMatchPattern(currencySymbol, currencyCode,
				     thousandsString, decimalString) {
  return new RegExp(`\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})\\s\\(\\d+h\\s\\d+m\\)`, 'g')
}

function convertHelper() {

}

function convert(textNode) {
  chrome.storage.sync.get(null, function(items) {
    var currencySymbol, currencyCode, amount, frequency, thousands, decimal, sourceMoney, workingWage, thousandsString, decimalString, matchPattern, disabled
    currencySymbol = items['currencySymbol']
    currencyCode = items['currencyCode']
    amount = items['amount']
    frequency = items['frequency']
    thousands = items['thousands']
    decimal = items['decimal']
    disabled = items['disabled']  
    thousandsString = buildThousandsString(thousands)
    thousands = new RegExp(thousandsString, 'g')
    decimalString = buildDecimalString(decimal)
    decimal = new RegExp(decimalString, 'g')
      // Currency indicator preceding amount
      if (disabled !== true) {      
	  matchPattern = buildPrecedingMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
	  textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function(e) {
	      sourceMoney = e.replace(thousands, '@').replace(decimal, '~').replace('~', '.').replace('@', '')
	      sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, '')).toFixed(2)
	      workingWage = buildWorkingWage(frequency, amount)
	      return makeSnippet(e, sourceMoney, workingWage)
	  })
      }
      else {
	  matchPattern = reversePrecedingMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
	  textNode.nodeValue = textNode.nodeValue.replace(matchPattern, "$1")
      }
      // Currency indicator concluding amount
      if (disabled !== true) {      
	  matchPattern = buildConcludingMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
	  textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function(e) {
	      sourceMoney = e.replace(thousands, '@').replace(decimal, '~').replace('~', '.').replace('@', '')
	      sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, '')).toFixed(2)
	      workingWage = buildWorkingWage(frequency, amount)
	      return makeSnippet(e, sourceMoney, workingWage)
	  })
      }
      else {
	  matchPattern = reverseConcludingMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
      }
  })
}

function buildWorkingWage(frequency, amount) {
  var workingWage = parseFloat(amount)
  if (frequency === 'yearly') {
    workingWage = workingWage/52/40
  }
  return workingWage.toFixed(2)
}

// TODO: Add options for "approximate" time by leaving 2 largest time units e.g. years and days

// Build text element in the form of: original (conversion)
function makeSnippet(sourceElement, sourceMoney, workingWage) {
    var workHours = sourceMoney / workingWage
    var hours, minutes, message
    if (!isNaN(workHours)) {
	hours = Math.floor(workHours)
	minutes = Math.ceil(60 * (workHours - hours))
	if (minutes == 60) {
	    hours += 1
	    minutes = 0
	}
	message = sourceElement + ' (' + hours + 'h ' + minutes + 'm)'
	// else {
	//     message = message.replace(' (' + hours + 'h ' + minutes + 'm)', '')
	// }
    } else {
	message = sourceElement
    }
    return message
}
