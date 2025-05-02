/**
 * Version Sync Script
 *
 * Synchronizes version numbers between package.json and manifest.json
 * This ensures that both files always have the same version number
 * and facilitates automatic versioning with standard-version.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const manifestJsonPath = path.join(__dirname, '..', 'src', 'manifest.json');

// Main function to sync versions
function syncVersions() {
  try {
    // Read package.json
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Read manifest.json
    const manifestJsonContent = fs.readFileSync(manifestJsonPath, 'utf8');
    const manifestJson = JSON.parse(manifestJsonContent);

    // Currently manifest.json drives the version number
    // Let's sync package.json's version with manifest.json
    if (packageJson.version !== manifestJson.version) {
      console.log(
        `Updating package.json version from ${packageJson.version} to ${manifestJson.version}`
      );
      packageJson.version = manifestJson.version;

      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

      console.log('Version synchronized successfully.');
    } else {
      console.log('Versions already in sync.');
    }
  } catch (error) {
    console.error('Error synchronizing versions:', error);
    process.exit(1);
  }
}

// Post-version-sync hook for standard-version
// Updates manifest.json with the new version from package.json
function postVersionSync() {
  try {
    // Read package.json (now with updated version)
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Read manifest.json
    const manifestJsonContent = fs.readFileSync(manifestJsonPath, 'utf8');
    const manifestJson = JSON.parse(manifestJsonContent);

    // Update manifest.json with the new version
    manifestJson.version = packageJson.version;

    // Write updated manifest.json
    fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n', 'utf8');

    console.log(`Updated manifest.json version to ${packageJson.version}`);
  } catch (error) {
    console.error('Error updating manifest.json version:', error);
    process.exit(1);
  }
}

// Execute the sync
syncVersions();

// Install post-version hook for standard-version
// This gets called by standard-version after version is bumped
process.on('exit', () => {
  if (process.env.STANDARD_VERSION_HOOK === 'postbump') {
    postVersionSync();
  }
});
