# T013 Plan: Update README Badge to Master Branch

## Context
This task is part of the DevOps/CI improvements (cr-11, Step 3) to ensure the CI badge in the README correctly references the master branch.

## Analysis
Currently, the README.md file contains a CI badge with generic placeholders:

```markdown
[![CI](https://github.com/[username]/timeismoney/actions/workflows/ci.yml/badge.svg)](https://github.com/[username]/timeismoney/actions/workflows/ci.yml)
```

This needs to be updated to:
1. Use the correct GitHub repository path (currently placeholder [username])
2. Add a branch parameter to specifically show the status of the master branch

## Action Required
Update the CI badge in README.md to:
1. Use the actual repository owner (or keep [username] if we don't know the actual repository path)
2. Add a ?branch=master query parameter to the badge URL

## Implementation
Update the badge in README.md to:

```markdown
[![CI](https://github.com/[username]/timeismoney/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/[username]/timeismoney/actions/workflows/ci.yml?query=branch%3Amaster)
```

This change:
- Adds ?branch=master to the badge URL to show only the status for the master branch
- Updates the link to include query=branch%3Amaster to take users to the filtered view of workflow runs

## Verification
The badge will now specifically show the CI status for the master branch rather than all branches.