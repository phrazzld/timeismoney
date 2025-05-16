#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Update ESLint configuration to properly handle vitest imports
const eslintConfigPath = path.join(process.cwd(), '.eslintrc.json');
const config = JSON.parse(fs.readFileSync(eslintConfigPath, 'utf8'));

// Add vitest to import/core-modules
if (!config.settings['import/core-modules']) {
  config.settings['import/core-modules'] = [];
}

if (!config.settings['import/core-modules'].includes('vitest')) {
  config.settings['import/core-modules'].push('vitest');
}

// Add import/extensions to help resolve vitest modules
config.settings['import/resolver'] = {
  ...config.settings['import/resolver'],
  node: {
    ...config.settings['import/resolver'].node,
    extensions: ['.js', '.mjs', '.cjs', '.ts'],
    moduleDirectory: ['node_modules', 'src']
  }
};

// Write back the updated config
fs.writeFileSync(eslintConfigPath, JSON.stringify(config, null, 2) + '\n');

console.log('Updated ESLint configuration for vitest imports');