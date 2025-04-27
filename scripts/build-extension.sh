#!/bin/bash
# Build script for TimeIsMoney Chrome extension

# Exit on any error
set -e

echo "Building TimeIsMoney Chrome extension..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Clear previous contents
rm -rf dist/*

# Bundle content script
echo "Bundling content script with esbuild..."
npm run build:content

# Copy necessary files to dist, excluding test files
mkdir -p dist/utils dist/content dist/background dist/popup/css dist/options/css

# Copy manifest and other root files
cp src/manifest.json dist/

# Copy JS files from each directory (except content which is now bundled)
cp src/utils/*.js dist/utils/
# Skip individual content JS files since they're now bundled
cp src/background/*.js dist/background/
cp src/popup/*.js dist/popup/
cp src/options/*.js dist/options/

# Copy CSS files 
cp -r src/popup/css/* dist/popup/css/
cp -r src/options/css/* dist/options/css/

# Copy HTML files
if [ -f src/popup/index.html ]; then
  cp src/popup/index.html dist/popup/
fi

if [ -f src/options/index.html ]; then
  cp src/options/index.html dist/options/
fi

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