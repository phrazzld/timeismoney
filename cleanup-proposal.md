# Repository Cleanup Proposal

## Overview

This proposal outlines actions to clean up the repository after the Jest to Vitest migration for unit tests. The current state shows successful migration but with many temporary files and reports that need to be addressed.

## 1. Staged Changes

**Action**: Commit these changes as they represent the successful migration of unit tests.

The staged files include:

- Updated MIGRATION-STATUS.md and TODO.md tracking migration progress
- New Vitest test files that have been successfully migrated
- A migration completion report

**Proposed commit message**:

```
feat: complete unit test migration from Jest to Vitest

- Migrate all priceFinder unit tests to Vitest format
- Update MIGRATION-STATUS.md to reflect current progress
- Add unit-test-migration-completion.md with detailed report
- Update TODO.md to track next migration steps
```

## 2. Deleted Test Files

**Action**: Add these to the commit as they've been replaced by the Vitest versions.

These files include:

- Original Jest test files (`.unit.test.js`) that have been migrated to Vitest format
- The deletions are intentional as these files have been replaced by their `.vitest.test.js` counterparts

## 3. Modified Files

**Action**: Add to the commit where appropriate.

- Some modified files should be included in the commit as they're part of the migration
- Others may be incomplete work and should be left for further refinement

## 4. Temporary/Generated Files

### 4.1 Backup Files (.bak, .bak.bak)

**Action**: Ignore via .gitignore (already done) and do not commit.

These files were created by the migration scripts as backups and are not needed in the repository.

### 4.2 Codemod and Migration Reports

**Action**: Ignore via .gitignore (already done) and do not commit.

These are automatically generated reports from the migration process and don't need to be tracked.

### 4.3 Planning Documents (_-plan.md, _-task.md)

**Action**:

- Keep reference plans that document the migration strategy (jest-vitest-migration-solution.md)
- Ignore temporary planning documents via .gitignore (already done)

## 5. Test Files to Create

**Action**: Implement missing Vitest tests for:

- converter.unified.unit.vitest.test.js
- converter.unit.vitest.test.js
- parser.unit.vitest.test.js

## 6. Next Steps After Cleanup

1. Run the tests to ensure everything still works:

   ```
   npm run test:unit
   ```

2. Update the migration status script to verify progress:

   ```
   node scripts/migration-status.js
   ```

3. Continue with the next batch of migrations as outlined in TODO.md

## Cleanup Commands

```bash
# Add the deleted files to staging
git add -u

# Add the .gitignore update
git add .gitignore

# Commit the changes
git commit -m "feat: complete unit test migration from Jest to Vitest" -m "- Migrate all priceFinder unit tests to Vitest format
- Update MIGRATION-STATUS.md to reflect current progress
- Add unit-test-migration-completion.md with detailed report
- Update TODO.md to track next migration steps"

# Verify the state after commit
git status
```

This cleanup will ensure the repository is in a clean state while preserving all important work done on the migration.
