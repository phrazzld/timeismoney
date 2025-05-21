# Environment Version Management

This document provides a comprehensive procedure for updating critical environment versions used in the project, ensuring consistent development and CI experiences.

## Critical Environment Components

The project relies on the following environment components:

| Component | Current Version | Configuration Location |
|-----------|----------------|------------------------|
| Node.js   | 20.x           | `.nvmrc` and `package.json` |
| pnpm      | 8.x (≥8.0.0)   | `package.json` |
| esbuild   | 0.25.3         | `package.json` |
| vitest    | 3.1.2          | `package.json` |
| Chrome    | 90+            | Build scripts (target) |

## Update Procedures

### Node.js Version Updates

Node.js version is centrally managed through the `.nvmrc` file. Follow these steps when updating:

1. **Research & Planning**
   - Check [Node.js releases](https://nodejs.org/en/download/releases/) for new versions
   - Review release notes for breaking changes that might affect the project
   - Verify compatibility with key dependencies (especially pnpm and esbuild)

2. **Update Version Files**
   - Update the `.nvmrc` file with the new version
   ```bash
   echo "22" > .nvmrc  # Example for updating to Node.js 22
   ```
   
   - Update the `engines.node` field in `package.json` to match
   ```json
   "engines": {
     "node": ">=22.0.0",
     "pnpm": ">=8.0.0"
   }
   ```

3. **Local Testing**
   - Install the new Node.js version locally
   ```bash
   nvm install 22  # Example for Node.js 22
   nvm use         # Uses version from .nvmrc
   ```
   
   - Reinstall dependencies
   ```bash
   pnpm install
   ```
   
   - Run the test suite
   ```bash
   pnpm test
   ```
   
   - Verify the build process
   ```bash
   pnpm run build
   ```

4. **Validation**
   - Run the Node.js version validation script
   ```bash
   pnpm run validate:node-version
   ```
   
   - Check that no workflow files use hardcoded Node.js versions

5. **Commit & Push**
   - Commit both the `.nvmrc` and `package.json` updates
   ```bash
   git add .nvmrc package.json
   git commit -m "chore: update node.js version to 22.x"
   git push
   ```
   
   - Verify that CI passes with the new Node.js version

### pnpm Version Updates

pnpm is specified in the `package.json` file both in the `engines` field and as the `packageManager`.

1. **Research & Planning**
   - Check [pnpm releases](https://github.com/pnpm/pnpm/releases) for new versions
   - Review release notes for breaking changes
   - Consider compatibility with the Node.js version in use

2. **Update Version**
   - Update both entries in `package.json`:
   ```json
   "engines": {
     "node": ">=20.0.0",
     "pnpm": ">=9.0.0"  // Updated minimum version
   },
   "packageManager": "pnpm@9.0.0",  // Updated specific version
   ```

3. **Local Testing**
   - Install the new pnpm version
   ```bash
   npm install -g pnpm@9  # Example for pnpm 9
   ```
   
   - Reinstall project dependencies
   ```bash
   pnpm install
   ```
   
   - Run the test suite
   ```bash
   pnpm test
   ```

4. **Commit & Push**
   - Commit the updated `package.json`
   ```bash
   git add package.json
   git commit -m "chore: update pnpm version to 9.x"
   git push
   ```
   
   - Verify that CI passes with the new pnpm version

### Development Dependencies Updates

For dependencies like esbuild, vitest, and other developer tools:

1. **Research & Planning**
   - Check release notes and changelogs
   - Verify compatibility with Node.js and other dependencies
   - Consider any potential breaking changes

2. **Update Versions**
   - Update dependencies individually or in groups:
   ```bash
   pnpm update esbuild vitest --latest
   ```
   
   - Or update specific versions:
   ```bash
   pnpm add -D esbuild@0.26.0 vitest@3.2.0
   ```

3. **Local Testing**
   - Run the test suite
   ```bash
   pnpm test
   ```
   
   - Check for any warnings or errors
   
   - Test specific functionality related to the updated tools

4. **Commit & Push**
   - Commit the updated `package.json` and `pnpm-lock.yaml`
   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "chore(deps): update development dependencies"
   git push
   ```

## Environment Update Checklist

Use this checklist when updating critical environment versions:

### Pre-Update Checklist
- [ ] Review release notes for breaking changes
- [ ] Verify compatibility between components
- [ ] Inform team members about planned updates
- [ ] Create a feature branch for the update

### Node.js Update Checklist
- [ ] Update `.nvmrc` file
- [ ] Update `engines.node` in `package.json`
- [ ] Install new Node.js version locally
- [ ] Run `pnpm install` to update dependencies
- [ ] Run test suite and verify build
- [ ] Run Node.js version validation script

### pnpm Update Checklist
- [ ] Update `engines.pnpm` in `package.json`
- [ ] Update `packageManager` field in `package.json`
- [ ] Install new pnpm version globally
- [ ] Run `pnpm install` to update lockfile
- [ ] Run test suite and verify build

### Post-Update Checklist
- [ ] Push changes and verify CI passes
- [ ] Document any issues or workarounds
- [ ] Create a PR with detailed description of changes
- [ ] Notify team about the update and any required actions

## Communication Guidelines

When updating environment versions, follow these communication guidelines:

1. **Announce intent** to update versions in the team channel/issue tracker
2. **Share timeline** for the update and potential impact
3. **Document breaking changes** that may affect development
4. **Provide instructions** for team members to update their local environments
5. **Schedule the update** for a time with minimal impact on development

## Troubleshooting Common Issues

### Node.js Version Mismatch
- **Symptom**: CI fails with `ERR_PNPM_UNSUPPORTED_ENGINE`
- **Solution**: Ensure `.nvmrc` and `package.json` versions match and are compatible with pnpm

### pnpm Lock File Issues
- **Symptom**: `pnpm install` fails after version update
- **Solution**: Delete `node_modules` and `pnpm-lock.yaml`, then run `pnpm install` again

### CI Validation Failures
- **Symptom**: Node.js version validation script fails in CI
- **Solution**: Check all workflow files for hardcoded Node.js versions and update them to use `node-version-file: '.nvmrc'`