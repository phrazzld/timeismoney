/**
 * Smoke test for Time Is Money extension
 *
 * This script verifies that all required files exist and that the extension
 * structure is valid according to Chrome extension manifest V3 requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extension root directory
const extensionDir = path.resolve(__dirname, '../src');

// Required files for a working extension
const requiredFiles = [
  'manifest.json',
  'background/background.js',
  'popup/index.html',
  'popup/popup.js',
  'popup/css/popup.css',
  'options/index.html',
  'options/index.js',
  'options/css/styles.css',
  'content/index.js',
  'utils/converter.js',
  'utils/parser.js',
  'utils/storage.js',
];

// Optional files that should also exist
const optionalFiles = [
  'content/domModifier.js',
  'content/domScanner.js',
  'content/priceFinder.js',
  'content/settingsManager.js',
];

// Check if manifest.json is valid
/**
 * Validates the manifest.json file for required fields and correct manifest version
 *
 * @returns {boolean} True if the manifest is valid, false otherwise
 */
function checkManifest() {
  console.log('Checking manifest.json...');

  const manifestPath = path.join(extensionDir, 'manifest.json');

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Check required manifest fields
    if (!manifest.manifest_version) {
      console.error('❌ manifest.json missing manifest_version field');
      return false;
    }

    if (manifest.manifest_version !== 3) {
      console.error(
        `❌ manifest.json has incorrect manifest_version: ${manifest.manifest_version}, should be 3`
      );
      return false;
    }

    if (!manifest.name) {
      console.error('❌ manifest.json missing name field');
      return false;
    }

    if (!manifest.version) {
      console.error('❌ manifest.json missing version field');
      return false;
    }

    console.log('✅ manifest.json is valid');
    return true;
  } catch (error) {
    console.error(`❌ Error reading manifest.json: ${error.message}`);
    return false;
  }
}

// Check if all required files exist
/**
 * Verifies that all required extension files exist
 *
 * @returns {boolean} True if all required files exist, false otherwise
 */
function checkRequiredFiles() {
  console.log('Checking required files...');

  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(extensionDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
      console.error(`❌ Required file missing: ${file}`);
    }
  }

  if (missingFiles.length === 0) {
    console.log('✅ All required files exist');
    return true;
  } else {
    return false;
  }
}

// Check if optional files exist
/**
 * Checks for the presence of optional extension files
 * Warns about missing files but doesn't cause test failure
 *
 * @returns {boolean} Always returns true (optional files don't affect functionality)
 */
function checkOptionalFiles() {
  console.log('Checking optional files...');

  const missingFiles = [];

  for (const file of optionalFiles) {
    const filePath = path.join(extensionDir, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
      console.warn(`⚠️ Optional file missing: ${file}`);
    }
  }

  if (missingFiles.length === 0) {
    console.log('✅ All optional files exist');
  } else {
    console.log(`⚠️ ${missingFiles.length} optional files missing`);
  }

  // Return true even if optional files are missing
  return true;
}

// Run all checks
/**
 * Runs all smoke tests to validate the extension structure
 * Checks manifest.json and verifies all required files exist
 *
 * @returns {number} 0 if tests pass, 1 if tests fail
 */
function runSmokeTest() {
  console.log('Running smoke test for Time Is Money extension...');

  const manifestValid = checkManifest();
  const requiredFilesExist = checkRequiredFiles();
  // Run this check but don't use its return value in pass/fail determination
  checkOptionalFiles();

  if (manifestValid && requiredFilesExist) {
    console.log('✅ Smoke test passed! The extension structure is valid.');
    return 0; // Success exit code
  } else {
    console.error('❌ Smoke test failed! The extension structure is invalid.');
    return 1; // Error exit code
  }
}

// Run the smoke test
process.exit(runSmokeTest());
