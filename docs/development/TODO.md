# TODO

This document outlines planned work for the extension, balancing feature development, technical improvements, operational excellence, and innovation, aligned with our development philosophy and informed by codebase analysis.

## Immediate Fixes

- **[Bug] Fix validate-test-names.js to Skip Deleted Files**: The pre-commit validation script currently checks deleted files, causing false failures when removing test files. Update the script to filter out deleted files from validation. This affects the ability to clean up the codebase without using --no-verify.

## More items to be migrated from the main TODO file...