import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Global ignores
  {
    ignores: [
      "node_modules/",
      "dist/",
      "babel.config.js",
      "test-files/",
      "temp/",
      "docs/",
      "thinktank_output/",
      ".git/",
    ],
  },

  // Base configuration for all JS files
  js.configs.recommended,

  // Main configuration
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        MutationObserver: "readonly",
        HTMLElement: "readonly",
        Element: "readonly",
        Node: "readonly",
        NodeList: "readonly",
        Text: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        DOMParser: "readonly",
        XMLSerializer: "readonly",
        Intl: "readonly",
        // Node.js globals
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        // Web extensions globals
        chrome: "readonly",
        browser: "readonly",
      },
    },
    plugins: {
      prettier,
      jsdoc,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".mjs", ".cjs", ".ts"],
          moduleDirectory: ["node_modules", "src"],
        },
      },
      "import/core-modules": ["vitest", "vite"],
    },
    rules: {
      "prettier/prettier": "error",
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-unused-vars": "error",
      "prefer-const": "warn",
      "no-var": "warn",
      eqeqeq: ["error", "always"],
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            FunctionExpression: true,
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      "jsdoc/require-description": "warn",
      "jsdoc/require-param-description": "warn",
      "jsdoc/require-returns-description": "warn",
      "jsdoc/require-param-type": "error",
      "jsdoc/require-returns-type": "error",
      "jsdoc/valid-types": "error",
      "jsdoc/check-types": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/tag-lines": [
        "warn",
        "any",
        {
          startLines: 1,
        },
      ],
      "import/no-commonjs": "error",
    },
  },

  // Override for performance-instrumentation.js
  {
    files: ["src/utils/performance-instrumentation.js"],
    rules: {
      "no-import-assign": "off",
      "import/namespace": "off",
    },
  },

  // Override for performance-test.js
  {
    files: ["scripts/performance-test.js"],
    rules: {
      "import/no-unresolved": "off",
    },
  },

  // Override for vitest test files
  {
    files: ["**/*.vitest.test.js"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
      "no-restricted-globals": [
        "error",
        {
          name: "describe",
          message:
            "Import 'describe' from vitest-imports.js instead of using global",
        },
        {
          name: "it",
          message: "Import 'it' from vitest-imports.js instead of using global",
        },
        {
          name: "test",
          message:
            "Import 'test' from vitest-imports.js instead of using global",
        },
        {
          name: "expect",
          message:
            "Import 'expect' from vitest-imports.js instead of using global",
        },
        {
          name: "beforeEach",
          message:
            "Import 'beforeEach' from vitest-imports.js instead of using global",
        },
        {
          name: "afterEach",
          message:
            "Import 'afterEach' from vitest-imports.js instead of using global",
        },
        {
          name: "beforeAll",
          message:
            "Import 'beforeAll' from vitest-imports.js instead of using global",
        },
        {
          name: "afterAll",
          message:
            "Import 'afterAll' from vitest-imports.js instead of using global",
        },
        {
          name: "jest",
          message: "Use 'vi' from vitest-imports.js instead of 'jest'",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='jest.fn']",
          message:
            "Use 'vi.fn()' from vitest-imports.js instead of 'jest.fn()'",
        },
        {
          selector: "CallExpression[callee.name='jest.mock']",
          message:
            "Use 'vi.mock()' from vitest-imports.js instead of 'jest.mock()'",
        },
        {
          selector: "CallExpression[callee.name='jest.spyOn']",
          message:
            "Use 'vi.spyOn()' from vitest-imports.js instead of 'jest.spyOn()'",
        },
        {
          selector: "CallExpression[callee.name='jest.clearAllMocks']",
          message:
            "Use 'resetTestMocks()' from vitest.setup.js instead of 'jest.clearAllMocks()'",
        },
        {
          selector: "CallExpression[callee.name='jest.resetAllMocks']",
          message:
            "Use 'resetTestMocks()' from vitest.setup.js instead of 'jest.resetAllMocks()'",
        },
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='clearAllMocks']",
          message:
            "Use 'resetTestMocks()' from vitest.setup.js instead of 'vi.clearAllMocks()'",
        },
        {
          selector:
            "CallExpression[callee.object.name='vi'][callee.property.name='resetAllMocks']",
          message:
            "Use 'resetTestMocks()' from vitest.setup.js instead of 'vi.resetAllMocks()'",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "vitest",
              message:
                "Import from vitest-imports.js helper instead of directly from vitest",
            },
          ],
        },
      ],
      "require-await": "error",
      "consistent-return": "error",
      "import/no-unresolved": "off",
      "no-unused-vars": "off",
    },
  },

  // Override for regular test files
  {
    files: [
      "**/*.test.js",
      "**/*.spec.js",
      "**/__tests__/setup/**/*.js",
      "**/__tests__/test-setup-example.js",
    ],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-returns-description": "off",
    },
  },

  // Override for scripts
  {
    files: ["scripts/**/*.js"],
    rules: {
      "no-console": "off",
      "import/no-commonjs": "off",
    },
  },

  // Override for __tests__ directory
  {
    files: ["**/__tests__/**/*.js"],
    rules: {
      "import/no-unresolved": "off",
    },
  },

  // Prettier config (must be last to override other rules)
  eslintConfigPrettier,
];
