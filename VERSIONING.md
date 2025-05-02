# Versioning Guidelines

Time Is Money uses [Semantic Versioning](https://semver.org/) for version management. This document explains how versioning is handled in this project.

## Semantic Versioning (SemVer)

The version format is `MAJOR.MINOR.PATCH` (e.g., `4.1.5`):

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) to automatically determine version increments. The commit message format should be:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Where `type` is one of:

- `feat`: A new feature (triggers a MINOR version increment)
- `fix`: A bug fix (triggers a PATCH version increment)
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Adding a `!` after the type/scope (e.g., `feat!:`) indicates a breaking change (triggers a MAJOR version increment).

## Version Management

### Automatic Versioning

To create a new release with automatic version determination:

```
npm run release
```

This will:

1. Analyze the commits since the last tag
2. Determine the appropriate version increment
3. Update the version in both package.json and manifest.json
4. Create a new commit and tag for the release
5. Generate a CHANGELOG.md entry

### Specific Versioning

To force a specific version increment, use one of these commands:

```
npm run release:patch  # For patch releases (e.g., 4.1.5 -> 4.1.6)
npm run release:minor  # For minor releases (e.g., 4.1.5 -> 4.2.0)
npm run release:major  # For major releases (e.g., 4.1.5 -> 5.0.0)
npm run release:beta   # For beta releases (e.g., 4.1.5 -> 4.1.6-beta.0)
```

## Version Synchronization

The extension's version is stored in two places:

- `package.json`: Used by npm and the versioning tools
- `src/manifest.json`: Used by Chrome Web Store and the extension itself

Our versioning system automatically keeps these two files in sync.
