/**
 * This script prevents the use of npm and yarn package managers.
 * It enforces the use of pnpm for consistent dependency management.
 * In CI environments, the check is bypassed to allow the workflow to continue.
 */

// Skip this check if running in a CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
if (isCI) {
  console.log('Running in CI environment, bypassing package manager check');
  process.exit(0); // Exit successfully
}

const usedManager = (process.env.npm_execpath || '').replace(/\\/g, '/').toLowerCase();
const userAgent = (process.env.npm_config_user_agent || '').toLowerCase();
const executable = usedManager.split('/').pop() || '';

const isPnpm = userAgent.startsWith('pnpm/') || executable === 'pnpm' || executable === 'pnpm.cjs';
const isNpm =
  userAgent.startsWith('npm/') ||
  executable === 'npm' ||
  executable === 'npm.js' ||
  executable === 'npm-cli.js';
const isYarn = userAgent.startsWith('yarn/') || executable === 'yarn' || executable === 'yarn.js';

if (!isPnpm && (isNpm || isYarn)) {
  console.error(
    '\n\n⚠️  This project uses pnpm for package management. Please use pnpm instead of npm or yarn.\n'
  );
  console.error('   To install pnpm, run:');
  console.error('   npm install -g pnpm\n');
  console.error('   Then run:');
  console.error('   pnpm install\n\n');
  process.exit(1);
}
