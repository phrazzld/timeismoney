# REFACTOR_PLAN.md

## 1. Overview

**Project:** “Time Is Money” Chrome Extension  
**Purpose:** Scan webpages for monetary prices and convert them into equivalent hours of work based on user-configured wage settings.

**Current Structure:**
- **background.js**  
  - Handles extension installation, browser action clicks, icon state toggling, default settings initialization.
- **content.js**  
  - Monolithic script that traverses the DOM, builds complex regex patterns, parses prices, converts them, and mutates the page.
- **options.js**  
  - Contains UI logic for the options page (tooltips, form loading/saving, formatting/parsing of inputs) intermixed with storage calls.
- **popup.js**  
  - Simple enable/disable toggle and link to options.
- **HTML/CSS** for popup and options UI.
- **_locales/** JSON files for translations.
- **manifest.json**  

**Key Pain Points:**
- Large, procedural scripts (`content.js` ≈1000 lines, `options.js` dense).
- Mixed concerns: parsing, conversion, DOM traversal, storage I/O all in one file.
- Repeated/duplicated logic (currency formatting, regex building).
- Brittle, hard-to-maintain price-detection (including special-case hacks for Amazon).
- Minimal or no automated tests; no CI/linters.
- Inconsistent naming and coding style.

**Refactoring Goals:**
1. Improve simplicity, readability, and consistency.  
2. Enhance maintainability by modularizing code.  
3. Reduce file sizes by splitting large files into focused modules.  
4. Preserve 100% of existing functionality.  
5. Introduce a basic testing strategy.  
6. Avoid overengineering; focus on practical, high-impact improvements.

---

## 2. Specific Tasks

### 2.1 General Codebase Improvements
- [ ] Adopt a consistent style (ES6+): use `const`/`let`, arrow functions, template literals.  
- [ ] Configure ESLint & Prettier (or similar) and format all `.js` files.  
- [ ] Add JSDoc comments for every public function/module.  
- [ ] Reorganize file structure:  
  ```
  /src
    /background
      background.js
    /content
      index.js
      domScanner.js
      priceFinder.js
      priceConverter.js
      domModifier.js
      settingsManager.js
    /options
      index.js
      formHandler.js
      tooltip.js
    /popup
      popup.js
    /utils
      storage.js
      parser.js
      converter.js
  manifest.json
  ```
- [ ] Consolidate all storage interactions behind a single `storage.js` API (`getSettings()`, `saveSettings()`, `onSettingsChanged()`).

### 2.2 Refactor content.js
- [ ] **Split responsibilities**  
  - **settingsManager.js** – fetch and subscribe to `chrome.storage.sync` changes.  
  - **domScanner.js** – export a `walk(rootNode, callback)` using `Document.createTreeWalker`.  
  - **priceFinder.js** – export `findPrices(text, formatSettings)`; build and cache regex patterns; return price matches with indices.  
  - **priceConverter.js** – export `convertToTime(priceValue, wageSettings)` and `formatTimeSnippet(hours, minutes)`.  
  - **domModifier.js** – export `applyConversion(node, match, snippet)` and `revertAll(rootNode)`, using `<span data-original-price>` wrappers.
- [ ] **Orchestrator** (`content/index.js`):  
  1. Load settings once on init.  
  2. If enabled, call `domScanner.walk(document.body, processNode)`; otherwise no-op.  
  3. On settings change: if toggled on, process page; if toggled off, revert. If numeric settings change, revert then reprocess.
- [ ] **Amazon-specific logic**  
  - Isolate into a small helper (`amazonHandler.js`) or remove if general regex suffices.  
- [ ] **Error handling**  
  - Replace bare `throw` strings with `throw new Error(...)`.  
  - Wrap critical sections in `try/catch` and log meaningful errors.

### 2.3 Refactor options.js
- [ ] **Modularize**  
  - **formHandler.js** – load settings into form, read/validate inputs, save settings.  
  - **tooltip.js** – single delegated listener for `focusin`/`focusout` to show/hide help text.  
- [ ] **Parsing/Formatting**  
  - Leverage shared `parser.js` to clean “amount” strings based on thousands/decimal separators before `parseFloat`.  
  - Use clear steps: remove thousands, normalize decimal to `.`, parse and `toFixed(2)`.  
- [ ] **Validation**  
  - Enforce numeric, non-negative wages. Show inline errors; prevent saving invalid data.  
- [ ] **Initialization**  
  - Single `DOMContentLoaded` entry point: fetch settings, populate form, wire event listeners.

### 2.4 Refactor popup.js & background.js
- [ ] Use named functions for event handlers.  
- [ ] Use the shared `storage.js` API for reading/writing the `disabled` flag.  
- [ ] Ensure popup toggle state is in sync with options page and icon state.

---

## 3. Implementation Details

### 3.1 Example: storage.js
```js
// src/utils/storage.js
const DEFAULTS = {
  amount: 30, frequency: 'hourly',
  currencySymbol: '$', currencyCode: 'USD',
  thousands: ',', decimal: '.', disabled: false
};

export function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULTS, items => resolve(items));
  });
}

export function saveSettings(newSettings) {
  return new Promise(resolve => {
    chrome.storage.sync.set(newSettings, () => resolve());
  });
}

export function onSettingsChanged(callback) {
  chrome.storage.onChanged.addListener((changes) => {
    const updated = {};
    for (const key in changes) {
      updated[key] = changes[key].newValue;
    }
    callback(updated);
  });
}
```

### 3.2 Example: domScanner.js
```js
// src/content/domScanner.js
export function walk(root, callback) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    callback(node);
  }
}
```

### 3.3 Example: content/index.js
```js
// src/content/index.js
import { getSettings, onSettingsChanged } from '../utils/storage.js';
import { walk } from './domScanner.js';
import { findPrices } from './priceFinder.js';
import { convertToTime, formatTimeSnippet } from '../utils/converter.js';
import { applyConversion, revertAll } from './domModifier.js';

let settings, enabled;

async function init() {
  settings = await getSettings();
  enabled  = !settings.disabled;
  onSettingsChanged(handleSettingsChange);
  if (enabled) processPage();
}

function processPage() {
  walk(document.body, node => {
    const matches = findPrices(node.nodeValue, settings);
    for (const match of matches) {
      const hoursData = convertToTime(match.value, settings);
      const snippet   = formatTimeSnippet(hoursData.hours, hoursData.minutes);
      applyConversion(node, match, snippet);
    }
  });
}

function handleSettingsChange(changed) {
  Object.assign(settings, changed);
  const nowEnabled = !settings.disabled;
  if (enabled && !nowEnabled) {
    revertAll(document.body);
  } else if (!enabled && nowEnabled) {
    processPage();
  } else if (nowEnabled) {  // settings changed while enabled
    revertAll(document.body);
    processPage();
  }
  enabled = nowEnabled;
}

init();
```

### 3.4 Example: options/formHandler.js
```js
// src/options/formHandler.js
import { getSettings, saveSettings } from '../utils/storage.js';
import { normalizeAmountString } from '../utils/parser.js';

export async function loadForm() {
  const opts = await getSettings();
  // populate inputs: amount.value = opts.amount, etc.
}

export function setupListeners() {
  const form = document.getElementById('options-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let amtStr = document.getElementById('amount').value;
    amtStr = normalizeAmountString(amtStr, 
             document.getElementById('thousands').value,
             document.getElementById('decimal').value);
    const amount = parseFloat(amtStr);
    if (isNaN(amount) || amount < 0) {
       showError('Invalid amount');
       return;
    }
    // read other fields...
    await saveSettings({ amount, /* ... */ });
    showStatus('Options saved');
  });
}
```

---

## 4. Risks & Mitigation

1. **Core Functionality Breakage**  
   - Mitigation:  
     - Refactor incrementally, one module at a time.  
     - After each step, run manual regression tests on representative sites (Amazon, eBay, news sites, etc.).  
     - Establish unit tests for pure logic before refactoring those parts.
2. **Performance Regression**  
   - Mitigation:  
     - Profile before/after on large pages.  
     - Keep the synchronous `walk` model initially.  
     - Batch DOM modifications, avoid repeated queries.
3. **Price Detection Accuracy Loss**  
   - Mitigation:  
     - Maintain a set of real-world example strings.  
     - Write unit tests for regex patterns and parsing.  
     - If necessary, retain/analyze site-specific handlers in small, isolated modules.
4. **Overengineering/Scope Creep**  
   - Mitigation:  
     - Strictly follow this plan.  
     - Log additional improvements (Manifest V3, dynamic content observers, E2E tests) in a separate backlog.

---

## 5. Testing Strategy

1. **Baseline Manual Tests (Pre-Refactor):**  
   - Document current behavior on key sites and with varied settings.
2. **Unit Tests (During Refactor):**  
   - Set up Jest or Mocha/Chai for:  
     - `parser.js` (string cleanup).  
     - `converter.js` (price → hours calculations).  
     - `priceFinder.js` (regex matches).  
3. **Integration & Regression (Post-Module):**  
   - After each module refactor, reload extension and verify:  
     - Prices convert correctly.  
     - Enable/disable toggle works instantly.  
     - Options save/load persists as expected.
4. **Optional E2E (Future):**  
   - Use Puppeteer/Playwright to automate smoke tests on a handful of real websites.

---

## 6. Resolved Questions

1. **Specific websites with detection issues:** No specific websites (beyond Amazon) have known detection issues at this time.
2. **Amazon-special case:** It's currently unclear whether the existing Amazon-special case is still required or if we can rely on the general regex. This should be evaluated during the refactoring process.
3. **Manifest V3 migration:** We will definitely need to migrate to Manifest V3 shortly. This should be prioritized as part of the refactoring effort.
4. **Testing and CI:** We will use GitHub Actions for CI.
5. **Contributing guide:** No need for a formal contributing guide or coding standards at this time.

---

*End of Refactoring Plan*