/**
 * Babel configuration for TimeIsMoney extension
 */
export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        modules: false,
      },
    ],
  ],
  plugins: [
    // Handle dynamic imports
    '@babel/plugin-syntax-dynamic-import',
    // Handle import.meta (needed for some ES module features)
    '@babel/plugin-syntax-import-meta',
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current',
            },
            // Use commonjs for Jest (which still uses it internally)
            modules: 'commonjs',
          },
        ],
      ],
    },
  },
};
