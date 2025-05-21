/**
 * Price Detection Verification Script
 *
 * This script checks if price elements with verification metadata are correctly
 * detected by the Time Is Money extension. It relies on CSS classes added by
 * the extension's debug mode to determine what was detected.
 */

// Detection CSS classes (from constants.js)
const DETECTION_CLASSES = {
  DETECTED: 'tim-debug-detected', // Price was detected
  CONVERTED: 'tim-debug-converted', // Price was successfully converted
  FAILED: 'tim-debug-failed', // Price detection/conversion failed
  CANDIDATE: 'tim-debug-candidate', // Element that might contain a price
  IGNORED: 'tim-debug-ignored', // Element that was explicitly ignored
};

// Time delay to allow extension to process page (ms)
const VERIFICATION_DELAY = 2000;

/**
 * Runs verification on all testable price elements
 * Checks which elements were properly detected based on their data attributes
 */
function verifyPriceDetection() {
  // Add status message
  const statusElement = document.getElementById('verification-status');
  if (!statusElement) {
    console.error('Verification status element not found');
    return;
  }

  statusElement.textContent = 'Running verification...';
  statusElement.className = 'status-running';

  // Give the extension time to process the page
  setTimeout(() => {
    // Find all elements with detection expectation metadata
    const testElements = document.querySelectorAll('[data-expect-detect]');

    let totalTests = 0;
    let passedTests = 0;
    const results = [];

    testElements.forEach((element) => {
      totalTests++;

      // Get expected detection outcome
      const shouldDetect = element.dataset.expectDetect === 'true';
      const expectedDetector = element.dataset.detector || 'any';

      // Check actual detection outcome
      const wasDetected =
        element.classList.contains(DETECTION_CLASSES.DETECTED) ||
        element.classList.contains(DETECTION_CLASSES.CONVERTED);

      // Basic detection result
      const passed = shouldDetect === wasDetected;

      // Add to results
      results.push({
        element,
        passed,
        shouldDetect,
        wasDetected,
        expectedDetector,
        description: element.dataset.description || 'Unnamed test case',
      });

      if (passed) {
        passedTests++;
        element.classList.add('test-passed');
      } else {
        element.classList.add('test-failed');
      }
    });

    // Show results
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    statusElement.textContent = `Verification complete: ${passedTests}/${totalTests} passed (${passRate}%)`;
    statusElement.className = passRate >= 80 ? 'status-passed' : 'status-failed';

    // Generate detailed results
    const detailsElement = document.getElementById('verification-details');
    if (detailsElement) {
      detailsElement.innerHTML = '';

      const resultsTable = document.createElement('table');
      resultsTable.className = 'results-table';

      // Create header
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Test Case</th>
          <th>Result</th>
          <th>Expected</th>
          <th>Actual</th>
        </tr>
      `;
      resultsTable.appendChild(thead);

      // Create rows
      const tbody = document.createElement('tbody');
      results.forEach((result) => {
        const row = document.createElement('tr');
        row.className = result.passed ? 'result-passed' : 'result-failed';

        row.innerHTML = `
          <td>${result.description}</td>
          <td>${result.passed ? 'PASS' : 'FAIL'}</td>
          <td>${result.shouldDetect ? 'Detect' : 'Ignore'}</td>
          <td>${result.wasDetected ? 'Detected' : 'Not Detected'}</td>
        `;

        tbody.appendChild(row);
      });

      resultsTable.appendChild(tbody);
      detailsElement.appendChild(resultsTable);
    }
  }, VERIFICATION_DELAY);
}

/**
 * Adds verification controls to the page
 */
function initializeVerification() {
  // Create verification container
  const container = document.createElement('div');
  container.id = 'verification-container';
  container.className = 'verification-container';

  // Create verification button
  const button = document.createElement('button');
  button.textContent = 'Verify Price Detection';
  button.onclick = verifyPriceDetection;

  // Create status element
  const status = document.createElement('div');
  status.id = 'verification-status';
  status.className = 'status-idle';
  status.textContent = 'Click button to verify detection';

  // Create details container
  const details = document.createElement('div');
  details.id = 'verification-details';

  // Add note about debug mode
  const note = document.createElement('div');
  note.className = 'note';
  note.innerHTML =
    '<strong>Note:</strong> Debug mode must be enabled in the Time Is Money extension settings for verification to work.';

  // Assemble container
  container.appendChild(button);
  container.appendChild(status);
  container.appendChild(note);
  container.appendChild(details);

  // Add to page
  document.body.insertBefore(container, document.body.firstChild);

  // Add CSS for verification elements
  const style = document.createElement('style');
  style.textContent = `
    .verification-container {
      position: sticky;
      top: 0;
      background: #fff;
      padding: 15px;
      margin-bottom: 20px;
      border-bottom: 1px solid #ddd;
      z-index: 100;
    }
    
    .verification-container button {
      padding: 8px 16px;
      background-color: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .verification-container button:hover {
      background-color: #0055aa;
    }
    
    #verification-status {
      margin-top: 10px;
      padding: 8px;
      border-radius: 4px;
    }
    
    .status-idle {
      background-color: #f5f5f5;
    }
    
    .status-running {
      background-color: #e0f0ff;
    }
    
    .status-passed {
      background-color: #dfffdf;
      color: #006600;
    }
    
    .status-failed {
      background-color: #ffdfdf;
      color: #660000;
    }
    
    .test-passed {
      box-shadow: 0 0 0 2px #00cc00;
    }
    
    .test-failed {
      box-shadow: 0 0 0 2px #cc0000;
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .results-table th,
    .results-table td {
      padding: 8px;
      border: 1px solid #ddd;
      text-align: left;
    }
    
    .results-table th {
      background-color: #f2f2f2;
    }
    
    .result-passed {
      background-color: #f0fff0;
    }
    
    .result-failed {
      background-color: #fff0f0;
    }
    
    .note {
      background-color: #ffffd9;
      border-left: 4px solid #e7c000;
      padding: 10px 15px;
      margin: 15px 0;
    }
  `;

  document.head.appendChild(style);
}

// Initialize verification when the page loads
window.addEventListener('DOMContentLoaded', initializeVerification);
