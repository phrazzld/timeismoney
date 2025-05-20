#!/bin/bash
# Script to load the extension in Chrome for testing

echo "This script will launch Chrome with the TimeIsMoney extension loaded for testing."
echo "Make sure Chrome is closed before running this script."
echo ""

# Run the build script first
echo "Building the extension..."
cd "$(dirname "$0")/.." && pnpm run build

# Get the path to the dist directory
EXTENSION_DIR=$(cd "$(dirname "$0")/.." && pwd)/dist

# Detect operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    USER_DATA_DIR="/tmp/chrome-dev-profile"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CHROME_PATH="google-chrome"
    USER_DATA_DIR="/tmp/chrome-dev-profile"
elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32" ]]; then
    # Windows with Git Bash
    CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"
    USER_DATA_DIR="$TEMP/chrome-dev-profile"
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Create a temporary profile directory
mkdir -p "$USER_DATA_DIR"

echo "Starting Chrome with the extension loaded from: $EXTENSION_DIR"

# Launch Chrome with the extension loaded
"$CHROME_PATH" \
  --user-data-dir="$USER_DATA_DIR" \
  --load-extension="$EXTENSION_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --start-maximized \
  --auto-open-devtools-for-tabs \
  https://www.amazon.com/dp/B09DFHJTF5/ \
  https://www.ebay.com/itm/394583451479

echo ""
echo "Chrome should have started with the extension loaded."
echo "If Chrome didn't start, make sure the Chrome executable path is correct for your system."
echo "Inspect the extension popup and options page to verify functionality."