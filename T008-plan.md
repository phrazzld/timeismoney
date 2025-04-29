# T008 Plan: Remove internal rate calculation from convertToTime

## Context
Part of the converter.js refactoring initiative (cr-05+cr-25, Step 2)

## Analysis
Upon examining the code in `src/utils/converter.js`, I found that the internal rate calculation logic has already been removed from the `convertToTime` function as part of ticket T007.

In the previous implementation, `convertToTime` had two signatures:
1. `convertToTime(priceValue, wageSettings)` - Where wageSettings is an object with amount and frequency
2. `convertToTime(priceValue, hourlyWage)` - Where hourlyWage is a direct number

The function also contained logic to calculate the hourly rate internally when a wageSettings object was passed:
```javascript
if (wageSettings.frequency === 'yearly') {
  hourlyRate = hourlyRate / 2080; // 40 hours * 52 weeks
}
```

As part of T007, this function was refactored to only accept the `(priceValue, hourlyRate)` signature, and all rate calculation logic was removed. The function now simply divides the price by the hourly rate to calculate time.

## Action Required
The work for this ticket has already been completed as part of ticket T007.

Tests have been updated to use the new signature by pre-calculating hourly rates instead of passing wage settings objects.

## Verification
All tests pass with the current implementation, confirming that:
1. Rate calculation logic has been removed from `convertToTime`
2. The function now operates with a simple, single signature

## Next Steps
Mark the ticket as complete in TODO.md.