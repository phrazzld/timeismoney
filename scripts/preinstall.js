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

const usedManager = process.env.npm_execpath || '';
const isNpm = usedManager.includes('npm');
const isYarn = usedManager.includes('yarn');

if (isNpm || isYarn) {
  console.error(
    '\n\n⚠️  This project uses pnpm for package management. Please use pnpm instead of npm or yarn.\n'
  );
  console.error('   To install pnpm, run:');
  console.error('   npm install -g pnpm\n');
  console.error('   Then run:');
  console.error('   pnpm install\n\n');
  process.exit(1);
}
