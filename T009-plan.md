# T009 Plan: Update all callers to compute hourly rate externally

## Context
This task is part of step 3 in the converter.js refactoring initiative (cr-05+cr-25).

## Analysis
After examining the codebase, I found that all callers of `convertToTime` are already computing the hourly rate externally before passing it to the function:

1. **Direct Call Sites**: 
   - Only in test files: `converter.test.js` and `converter.unified.test.js`
   - All test calls provide a pre-computed hourly rate as the second parameter

2. **Application Code**:
   - The main application code uses `convertPriceToTimeString` which internally calls `convertToTime`
   - `convertPriceToTimeString` already computes the hourly rate using `calculateHourlyWage` before passing it to `convertToTime`

The code already follows the desired architecture:
- `calculateHourlyWage` handles wage calculation logic (converting yearly to hourly if needed)
- `convertToTime` focuses solely on the time calculation from price and hourly rate
- All callers correctly use this separation of concerns

## Verification
- The codebase grep confirms `convertToTime` is only called in the test files and in `converter.js`
- In `converter.js`, line 137 calculates the hourly wage: `const hourlyWage = calculateHourlyWage(wageInfo.frequency, wageInfo.amount);`
- Line 143 then passes this pre-calculated value to `convertToTime`: `const { hours, minutes } = convertToTime(normalizedPrice, hourlyWage);`

## Action Required
The code is already structured correctly with all callers computing the hourly rate externally. No code changes are needed.

## Next Steps
Mark the ticket as complete in TODO.md, as the acceptance criteria are already met:
1. All calls to `convertToTime` already pass in an explicit hourly rate
2. Tests already pass for all affected call sites