# Vitest Migration TODO Index

This index lists the split TODO files for the Vitest migration project, outlining the sequence and focus of each phase. Work should generally proceed through these files sequentially, as later phases often depend on the completion of earlier ones.

1.  ✅ **Phase 1: Audit-Structure** - Completed: Audited tests, categorized, and established new directory structure (T001-T003).
2.  ✅ **Phase 2: Mocking** - Completed: Reviewed current mocks, identified external dependencies, created centralized mocks, and refactored tests to use them (T004-T006).
3.  ✅ **Phase 3: Vitest Setup** - Completed: Installed Vitest, created configuration, validated setup, and configured environments/coverage (T007-T010).
4.  **[TODO-04-Scripts-CI.md](./TODO-04-Scripts-CI.md)**: Update `package.json` scripts and the CI workflow to use Vitest (T011-T012).
5.  **[TODO-05-Migration.md](./TODO-05-Migration.md)**: Migrate test code from Jest to Vitest syntax, refactor mocks, and remove workarounds (T013-T016).
6.  **[TODO-06-Validation.md](./TODO-06-Validation.md)**: Validate test coverage and performance after migration (T017-T018).
7.  **[TODO-07-Documentation.md](./TODO-07-Documentation.md)**: Update developer documentation to reflect the new testing setup (T019).
8.  **[TODO-08-Cleanup.md](./TODO-08-Cleanup.md)**: Remove all remaining Jest dependencies and configuration files (T020-T022).
9.  **[TODO-09-Clarifications.md](./TODO-09-Clarifications.md)**: Track and resolve open questions and assumptions related to the migration (Q001-Q005).
