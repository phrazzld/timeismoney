# T14 Plan: Restrict Broad Host Permissions in Manifest

## Problem Analysis
Currently, the extension uses a broad host permission pattern (`*://*/*`) which grants access to all websites. This is unnecessarily permissive and violates Chrome Web Store's best practices for privacy and security. We need to identify which specific domains the extension actually needs to operate on and restrict the permissions accordingly.

## Approach
1. Examine the codebase to identify which websites need the extension to run
2. Review `src/manifest.json` to understand the current permissions setup
3. Replace the broad `*://*/*` pattern with specific domain patterns needed by the extension
4. If absolutely necessary to keep broad permissions, add a justifying comment in the manifest
5. Test the extension on both permitted and non-permitted sites to verify correct behavior

## Implementation Steps
1. Review the content scripts (`src/content/`) to identify target websites
2. Check if there are site-specific handlers (like `amazonHandler.js`) that indicate necessary domains
3. Update the `host_permissions` field in `manifest.json` with specific domain patterns
4. Test the extension to verify functionality is preserved on intended sites
5. Test on non-permitted sites to verify the extension doesn't activate inappropriately

## Acceptance Criteria
- Permissions in the manifest are restricted to only necessary domains
- Extension still works correctly on all intended target sites
- Installation permission prompts only request access to specified domains
- Extension doesn't try to run on non-permitted sites