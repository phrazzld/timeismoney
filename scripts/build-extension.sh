#!/bin/bash
# Build script for TimeIsMoney Chrome extension
#
# Cross-platform compatibility notes:
# - This script works on macOS, Linux, and Windows with Git Bash or WSL
# - Uses relative paths for better cross-platform support
# - Attempts to use cross-platform compatible commands when possible

# Exit on any error
set -e

# Store the root directory of the project
ROOT_DIR="$(pwd)"
SRC_DIR="./src"
DIST_DIR="./dist"
IMAGES_DIR="./images"
LOCALES_DIR="./_locales"
ZIP_FILE="./timeismoney.zip"

echo "Building TimeIsMoney Chrome extension..."

# Create dist directory if it doesn't exist
mkdir -p "${DIST_DIR}"

# Clear previous contents (compatible with most shells)
if [ -d "${DIST_DIR}" ]; then
  echo "Cleaning ${DIST_DIR} directory..."
  # Use find for more cross-platform compatibility
  find "${DIST_DIR}" -mindepth 1 -delete 2>/dev/null || {
    echo "Warning: Could not clean using find, trying rm..."
    # Fallback to rm if find doesn't work
    rm -rf "${DIST_DIR:?}"/* 2>/dev/null || echo "Warning: Could not clean completely, continuing anyway..."
  }
fi

# Create required subdirectories
echo "Creating directory structure..."
mkdir -p "${DIST_DIR}/utils" "${DIST_DIR}/content" "${DIST_DIR}/background" "${DIST_DIR}/popup/css" "${DIST_DIR}/options/css"

# Bundle scripts
echo "Bundling content script with esbuild..."
npm run build:content

echo "Bundling background script with esbuild..."
npm run build:background

# Copy manifest and other root files
echo "Copying manifest.json..."
cp "${SRC_DIR}/manifest.json" "${DIST_DIR}/"

# Copy JS files from each directory (except content/background which are now bundled)
echo "Copying utility files..."
cp "${SRC_DIR}/utils/"*.js "${DIST_DIR}/utils/"

# Recursively copy all popup and options files (including JS, CSS, and HTML)
echo "Copying popup and options files..."
cp -R "${SRC_DIR}/popup/"* "${DIST_DIR}/popup/"
cp -R "${SRC_DIR}/options/"* "${DIST_DIR}/options/"

# Remove test files if they exist (with improved error handling)
echo "Cleaning up test files..."
find "${DIST_DIR}" -path "*/__tests__" -type d -exec rm -rf {} + 2>/dev/null || echo "No test directories found"

# Copy images to dist
echo "Copying images..."
if [ -d "${IMAGES_DIR}" ]; then
  cp -r "${IMAGES_DIR}" "${DIST_DIR}/"
else
  echo "Warning: Images directory not found"
fi

# Copy _locales to dist
echo "Copying localization files..."
if [ -d "${LOCALES_DIR}" ]; then
  cp -r "${LOCALES_DIR}" "${DIST_DIR}/"
else
  echo "Warning: Locales directory not found"
fi

echo "Extension files copied to ${DIST_DIR}/"

# Create a ZIP file for Chrome Web Store
echo "Creating ZIP package..."
# Save current directory
pushd "${DIST_DIR}" > /dev/null

# Check if zip command exists
if command -v zip > /dev/null; then
  # Remove old zip if it exists
  if [ -f "../${ZIP_FILE}" ]; then
    rm -f "../${ZIP_FILE}"
  fi
  
  # Create new zip, excluding macOS specific files
  zip -r "../${ZIP_FILE}" * -x "*.DS_Store" -x "**/.DS_Store"
  echo "Extension packaged in ${ZIP_FILE}"
else
  echo "Warning: 'zip' command not found. ZIP package not created."
  echo "Please manually zip the contents of the ${DIST_DIR} directory."
fi

# Restore previous directory
popd > /dev/null

echo "Build complete!"