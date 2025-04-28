#!/bin/bash
# Build script for TimeIsMoney Chrome extension

# Exit on any error
set -e

echo "Building TimeIsMoney Chrome extension..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Clear previous contents
rm -rf dist/*

# Bundle scripts
echo "Bundling content script with esbuild..."
npm run build:content

echo "Bundling background script with esbuild..."
npm run build:background

# Copy necessary files to dist, excluding test files
mkdir -p dist/utils dist/content dist/background dist/popup/css dist/options/css

# Copy manifest and other root files
cp src/manifest.json dist/

# Copy JS files from each directory (except content/background which are now bundled)
cp src/utils/*.js dist/utils/
# Skip individual content and background JS files since they're now bundled

# Recursively copy all popup and options files (including JS, CSS, and HTML)
cp -R src/popup/* dist/popup/
cp -R src/options/* dist/options/

# Remove test files if they exist
rm -rf dist/popup/__tests__ 2>/dev/null || true
rm -rf dist/options/__tests__ 2>/dev/null || true

# Make sure we don't have any test files
rm -rf dist/__tests__ 2>/dev/null || true

# Copy images to dist
cp -r images dist/

# Copy _locales to dist
cp -r _locales dist/

echo "Extension files copied to dist/"

# Create a ZIP file for Chrome Web Store
cd dist
ZIP_FILE="../timeismoney.zip"
rm -f $ZIP_FILE
zip -r $ZIP_FILE * -x "*.DS_Store" -x "**/.DS_Store"
cd ..

echo "Extension packaged in $ZIP_FILE"
echo "Build complete!"