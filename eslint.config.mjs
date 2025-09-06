import globals from 'globals';
import js from '@eslint/js';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.log',
      '.env',
      'test-*.js', // Ignore test files from linting
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...configPrettier.rules,
      'no-console': 'off', // Allow console.log in development
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'consistent-return': 'error',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
          semi: true,
        },
      ],
    },
  },
  {
    files: ['**/*.test.js'],
    rules: {
      'no-unused-expressions': 'off',
      'no-console': 'off',
    },
  },
];
