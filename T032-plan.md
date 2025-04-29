# T032 Plan: Add Option to Disable or Throttle DOM Observation

## Overview
This task involves adding a user-configurable option to enable/disable dynamic DOM observation. This will allow users to control whether the extension monitors DOM changes in real-time, which can be useful for performance-sensitive pages or when users want more control over the extension's behavior.

## Approach

1. Add a new setting to the extension's storage schema
2. Update the options page UI to include a toggle control
3. Modify the content script to check this setting before starting the observer
4. Ensure observer is correctly stopped/started when settings change

## Implementation Steps

### 1. Update Storage Schema
- Add a new `enableDynamicScanning` boolean setting (default: true)
- Ensure backward compatibility with existing settings

### 2. Update Options UI
- Add a checkbox in the options page for "Enable Real-time Price Updates"
- Include a description explaining this controls whether prices are updated as page content changes
- Save the setting when toggled

### 3. Update Content Script
- Modify the initialization logic to check the `enableDynamicScanning` setting
- Only start the observer if the setting is true
- Update the settings change handler to start/stop the observer based on setting changes

### 4. Testing
- Verify the setting is saved correctly
- Confirm that when disabled, only the initial page scan happens
- Confirm that when enabled, dynamic content is processed
- Test toggling the setting while a page is open to ensure real-time changes take effect