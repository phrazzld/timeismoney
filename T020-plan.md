# T020 Plan: Implement Log Level Control by Build Environment

## Context
This task is part of the Core/Logging improvements (cr-10, Step 2) to implement log level filtering based on the build environment.

## Analysis
The current logger.js file provides wrapper functions for console methods but doesn't have any mechanism to control which log levels are displayed based on the environment.

We need to add:
1. Log level definitions
2. A way to determine the current environment
3. Logic to only log messages at or above the configured level

A common pattern is to use log levels like DEBUG < INFO < WARN < ERROR, where each environment sets a minimum level (e.g., production only shows WARN and above).

## Implementation Plan
1. Define log levels as numerical constants
2. Create a function to determine the minimum log level based on `process.env.NODE_ENV`
3. Update each logging function to check if the message's level meets the minimum threshold before logging

## Implementation Details
The updated logger.js file will:
1. Define log levels (DEBUG=0, INFO=1, WARN=2, ERROR=3)
2. Read `process.env.NODE_ENV` to determine the environment
3. Set the minimum log level based on the environment:
   - development: DEBUG (show all logs)
   - production: WARN (only show warnings and errors)
   - Default to INFO for any other environment
4. Add level checks to each logging function

## Testing
We can test this by:
1. Setting different NODE_ENV values and verifying the appropriate log levels appear
2. This will be verified manually as per the verification steps in the ticket