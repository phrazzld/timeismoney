let disabledOnPage = true

// Should only run on first page load
chrome.storage.sync.get('disabled', storage => {
    if (!storage.disabled) {
        walk(document.body)
        disabledOnPage = false
    }
});

// Should run whenever the popup switch is flipped on the current page
chrome.storage.onChanged.addListener(changes => {
    if (changes.disabled && !document.hidden) {
        console.debug("Running on detected change...")
        walk(document.body)
        disabledOnPage = changes.disabled.newValue
    }
});

function isValidChromeRuntime() {
    try {
        return chrome.runtime && !!chrome.runtime.getManifest();
    }
    catch (e) {
        return false
    }
}

// Should run whenever the tab is changed and the current extension state
// differs from the previous one that was run on the page
document.addEventListener('visibilitychange', function() {
    if (!isValidChromeRuntime()) {
        console.log("Run time is invalid! Please reload the page for the extension to work properly again...")
    } else if (!document.hidden) {
        chrome.storage.sync.get('disabled', storage => {
            if (disabledOnPage !== storage.disabled) {
                console.debug("Running on visibility change...")
                walk(document.body)
                disabledOnPage = storage.disabled
            }
        });
    }
});

// Credit to t-j-crowder on StackOverflow for this walk function
// http://bit.ly/1o47R7V
function walk(node) {
    let child, next, price;

    switch (node.nodeType) {
        case 1:  // Element
        case 9:  // Document
        case 11: // Document fragment
            child = node.firstChild
            while (child) {
                next = child.nextSibling

                // Check if child is Amazon display price
                const classes = child.classList;
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
        return ','
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
        return ','
    } else {
        throw 'Not a recognized delimiter for decimals!'
    }
}

function buildMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString) {
    let precedingMatchPattern =  new RegExp(`(\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?`, 'g')
    let concludingMatchPattern = new RegExp(`\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})`, 'g')

    return new RegExp(precedingMatchPattern.source + "|" + concludingMatchPattern.source)
}

function buildReverseMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString) {
    let reversedPrecedingMatchPattern = new RegExp(`((\\${currencySymbol}|${currencyCode})\\x20?\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?)\\s\\(\\d+h\\s\\d+m\\)`, 'g')
    let reversedConcludingMatchPattern = new RegExp(`\\d(\\d|${thousandsString})*(${decimalString}\\d\\d)?\\x20?(\\${currencySymbol}|${currencyCode})\\s\\(\\d+h\\s\\d+m\\)`, 'g')

    return new RegExp(reversedPrecedingMatchPattern.source + "|" + reversedConcludingMatchPattern.source)
}

function convertHelper(e, thousands, decimal, frequency, amount) {
    let sourceMoney = e
        .replace(thousands, '@')
        .replace(decimal, '~')
        .replace('~', '.')
        .replace('@', '')
    sourceMoney = parseFloat(sourceMoney.replace(/[^\d.]/g, ''))
        .toFixed(2)
    let workingWage = buildWorkingWage(frequency, amount)
    return makeSnippet(e, sourceMoney, workingWage)
}

function convert(textNode) {
    chrome.storage.sync.get(null, function (items) {
        let currencySymbol, currencyCode, amount, frequency, thousands, decimal,
            thousandsString, decimalString, matchPattern, disabled;
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
        // Replace '$10' with '$10 (1 h)' or '10$' with '10$ (1h)'
        if (disabled !== true) {
            matchPattern = buildMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
            textNode.nodeValue = textNode.nodeValue.replace(matchPattern, function (e) {
                return convertHelper(e, thousands, decimal, frequency, amount)
            })
        } else {
            matchPattern = buildReverseMatchPattern(currencySymbol, currencyCode, thousandsString, decimalString)
            textNode.nodeValue = textNode.nodeValue.replace(matchPattern, "$1")
        }
    })
}

function buildWorkingWage(frequency, amount) {
    let workingWage = parseFloat(amount);
    if (frequency === 'yearly') {
        workingWage = workingWage / 52 / 40
    }
    return workingWage.toFixed(2)
}

// Build text element in the form of: original (conversion)
function makeSnippet(sourceElement, sourceMoney, workingWage) {
    const workHours = sourceMoney / workingWage;
    let hours, minutes, message;
    if (!isNaN(workHours)) {
        hours = Math.floor(workHours)
        minutes = Math.ceil(60 * (workHours - hours))
        if (minutes === 60) {
            hours += 1
            minutes = 0
        }
        message = sourceElement + ' (' + hours + 'h ' + minutes + 'm)'
    } else {
        message = sourceElement
    }
    return message
}
