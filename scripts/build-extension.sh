#!/bin/bash
# Build script for TimeIsMoney Chrome extension

# Exit on any error
set -e

echo "Building TimeIsMoney Chrome extension..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Clear previous contents
rm -rf dist/*

# Copy the src directory to dist
cp -r src/* dist/

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