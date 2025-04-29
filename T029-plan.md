# T029 Plan: Refactor functions to accept state via parameters

## Objective
Eliminate implicit state sharing by refactoring functions that depend on shared module-level state to instead receive that state explicitly as parameters.

## Steps

1. Identify key modules with shared state:
   - `domScanner.js` - Check for any module-level shared state like `amazonPriceState`
   - `amazonHandler.js` - Check for any state tracking for Amazon price components
   - Any other modules with shared global/module-level state variables

2. For each identified shared state:
   - Refactor functions to accept the state as explicit parameters
   - Update all callers to pass the required state
   - Ensure all recursive calls properly propagate state
   - Maintain type clarity and update JSDoc documentation

3. Make sure all state transitions remain correct after refactoring:
   - Any function that modified the shared state should now return a new state or modify a received state object
   - Update all call sites to handle state transitions correctly

4. Update any tests affected by the signature changes

## Success Criteria
- No implicit module-level state sharing in the codebase
- All state is passed explicitly as parameters
- All tests pass with the updated function signatures
- Linter passes with no errors

## Implementation Notes
- Keep changes focused on signature changes and state management changes
- Don't change the actual logic or behavior of the functions
- Prioritize clarity of state flow over clever optimizations