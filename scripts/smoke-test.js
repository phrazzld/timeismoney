/**
 * Smoke test for Time Is Money extension
 *
 * This script verifies that all required files exist in the built extension
 * and that the extension structure is valid according to Chrome extension
 * manifest V3 requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extension dist directory (built extension)
const extensionDir = path.resolve(__dirname, '../dist');

// Check if dist directory exists
if (!fs.existsSync(extensionDir)) {
  console.error('❌ Error: dist directory does not exist. Please run `npm run build` first.');
  process.exit(1);
}

// Required files for a working extension, paths relative to dist/
const requiredFiles = [
  'manifest.json',
  'background/background.bundle.js',
  'content/content.bundle.js',
  'popup/index.html',
  'popup/popup.js',
  'popup/css/popup.css',
  'options/index.html',
  'options/index.js',
  'options/css/styles.css',
  'utils/converter.js',
  'utils/parser.js',
  'utils/storage.js',
  'utils/constants.js',
  'utils/logger.js',
];

// Required directories
const requiredDirs = ['images', '_locales'];

// Required image files
const requiredImages = [
  'icon_16.png',
  'icon_19.png',
  'icon_32.png',
  'icon_38.png',
  'icon_48.png',
  'icon_128.png',
  'icon_256.png',
  'icon_640.png',
];

// Required locale files
const requiredLocales = ['en/messages.json'];

/**
 * Checks if a file exists and is not empty
 *
 * @param {string} filePath - Path to the file to check
 * @returns {boolean} True if file exists and has content, false otherwise
 */
function fileExistsAndHasContent(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Validates the manifest.json file for required fields and correct manifest version
 *
 * @returns {boolean} True if the manifest is valid, false otherwise
 */
function checkManifest() {
  console.log('Checking manifest.json...');

  const manifestPath = path.join(extensionDir, 'manifest.json');

  try {
    // Check if file exists first
    if (!fileExistsAndHasContent(manifestPath)) {
      console.error('❌ manifest.json is missing or empty');
      return false;
    }

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

/**
 * Verifies that all required extension files exist and have content
 *
 * @returns {boolean} True if all required files exist, false otherwise
 */
function checkRequiredFiles() {
  console.log('Checking required files...');

  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(extensionDir, file);
    if (!fileExistsAndHasContent(filePath)) {
      missingFiles.push(file);
      console.error(`❌ Required file missing or empty: ${file}`);
    }
  }

  if (missingFiles.length === 0) {
    console.log('✅ All required files exist and have content');
    return true;
  } else {
    return false;
  }
}

/**
 * Checks for the presence of required directories
 *
 * @returns {boolean} True if all required directories exist, false otherwise
 */
function checkRequiredDirectories() {
  console.log('Checking required directories...');

  const missingDirs = [];

  for (const dir of requiredDirs) {
    const dirPath = path.join(extensionDir, dir);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      missingDirs.push(dir);
      console.error(`❌ Required directory missing: ${dir}`);
    }
  }

  if (missingDirs.length === 0) {
    console.log('✅ All required directories exist');
    return true;
  } else {
    return false;
  }
}

/**
 * Checks for the presence of required image files
 *
 * @returns {boolean} True if all required image files exist, false otherwise
 */
function checkRequiredImages() {
  console.log('Checking required image files...');

  const missingImages = [];

  for (const image of requiredImages) {
    const imagePath = path.join(extensionDir, 'images', image);
    if (!fileExistsAndHasContent(imagePath)) {
      missingImages.push(image);
      console.error(`❌ Required image missing or empty: ${image}`);
    }
  }

  if (missingImages.length === 0) {
    console.log('✅ All required images exist');
    return true;
  } else {
    return false;
  }
}

/**
 * Checks for the presence of required locale files
 *
 * @returns {boolean} True if all required locale files exist, false otherwise
 */
function checkRequiredLocales() {
  console.log('Checking required locale files...');

  const missingLocales = [];

  for (const locale of requiredLocales) {
    const localePath = path.join(extensionDir, '_locales', locale);
    if (!fileExistsAndHasContent(localePath)) {
      missingLocales.push(locale);
      console.error(`❌ Required locale file missing or empty: ${locale}`);
    }
  }

  if (missingLocales.length === 0) {
    console.log('✅ All required locale files exist');
    return true;
  } else {
    return false;
  }
}

/**
 * Checks if bundled JavaScript files are valid
 *
 * @returns {boolean} True if bundle files exist and have content, false otherwise
 */
function checkBundleFiles() {
  console.log('Checking bundled JavaScript files...');

  const bundleFiles = [
    path.join(extensionDir, 'background/background.bundle.js'),
    path.join(extensionDir, 'content/content.bundle.js'),
  ];

  let allValid = true;

  for (const file of bundleFiles) {
    if (!fileExistsAndHasContent(file)) {
      console.error(`❌ Bundle file missing or empty: ${path.basename(file)}`);
      allValid = false;
    } else {
      // Check if file has a min size (very basic check for valid bundle)
      const stats = fs.statSync(file);
      if (stats.size < 100) {
        // Arbitrary small size that suggests a broken bundle
        console.error(
          `❌ Bundle file seems too small (${stats.size} bytes): ${path.basename(file)}`
        );
        allValid = false;
      }
    }
  }

  if (allValid) {
    console.log('✅ All bundle files exist and have content');
    return true;
  } else {
    return false;
  }
}

/**
 * Runs all smoke tests to validate the extension structure
 * Checks manifest.json and verifies all required files exist
 *
 * @returns {number} 0 if tests pass, 1 if tests fail
 */
function runSmokeTest() {
  console.log('Running smoke test for Time Is Money extension (dist/ directory)...');

  const manifestValid = checkManifest();
  const requiredFilesExist = checkRequiredFiles();
  const requiredDirsExist = checkRequiredDirectories();
  const requiredImagesExist = checkRequiredImages();
  const requiredLocalesExist = checkRequiredLocales();
  const bundlesValid = checkBundleFiles();

  if (
    manifestValid &&
    requiredFilesExist &&
    requiredDirsExist &&
    requiredImagesExist &&
    requiredLocalesExist &&
    bundlesValid
  ) {
    console.log('✅ Smoke test passed! The built extension structure is valid.');
    return 0; // Success exit code
  } else {
    console.error('❌ Smoke test failed! The built extension structure is invalid.');
    console.error('   Please run `npm run build` to rebuild the extension and try again.');
    return 1; // Error exit code
  }
}

// Run the smoke test
process.exit(runSmokeTest());
