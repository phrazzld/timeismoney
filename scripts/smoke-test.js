/**
 * Smoke test for Time Is Money extension
 * 
 * This script verifies that all required files exist and that the extension
 * structure is valid according to Chrome extension manifest V3 requirements.
 */

const fs = require('fs');
const path = require('path');

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
  'utils/storage.js'
];

// Optional files that should also exist
const optionalFiles = [
  'content/domModifier.js',
  'content/domScanner.js',
  'content/priceFinder.js',
  'content/settingsManager.js'
];

// Check if manifest.json is valid
function checkManifest() {
  console.log('Checking manifest.json...');
  
  const manifestPath = path.join(extensionDir, 'manifest.json');
  
  try {
    const manifest = require(manifestPath);
    
    // Check required manifest fields
    if (!manifest.manifest_version) {
      console.error('❌ manifest.json missing manifest_version field');
      return false;
    }
    
    if (manifest.manifest_version !== 3) {
      console.error(`❌ manifest.json has incorrect manifest_version: ${manifest.manifest_version}, should be 3`);
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
function runSmokeTest() {
  console.log('Running smoke test for Time Is Money extension...');
  
  const manifestValid = checkManifest();
  const requiredFilesExist = checkRequiredFiles();
  const optionalFilesExist = checkOptionalFiles();
  
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