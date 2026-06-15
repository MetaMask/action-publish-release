import base, { createConfig } from '@metamask/eslint-config';
import jest from '@metamask/eslint-config-jest';
import nodejs from '@metamask/eslint-config-nodejs';
import typescript from '@metamask/eslint-config-typescript';

const config = createConfig([
  {
    ignores: ['dist/', 'lib/', '.yarn/'],
  },

  {
    extends: base,

    languageOptions: {
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import-x/extensions': ['.js', '.mjs'],
    },
  },

  {
    files: ['**/*.ts'],
    extends: typescript,
  },

  {
    files: ['**/*.js', '**/*.cjs'],
    extends: nodejs,

    languageOptions: {
      sourceType: 'script',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.js'],
    extends: [jest, nodejs],
  },

  // Project-wide rule overrides — kept last so they apply over rules
  // re-enabled by `extends:` blocks above.
  {
    rules: {
      // This repo doesn't document internals with JSDoc.
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-param-description': 'off',

      // This is a Node.js GitHub Action, so importing Node builtins is the
      // norm.
      'import-x/no-nodejs-modules': 'off',
    },
  },

  {
    files: ['**/*.ts'],

    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error', { builtinGlobals: true }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        // Allow UPPER_CASE for type members so env-var-shaped types can use
        // the natural env var names verbatim.
        {
          selector: ['typeProperty'],
          format: ['camelCase', 'UPPER_CASE'],
        },
      ],
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.js'],

    rules: {
      'n/no-process-env': 'off',
    },
  },
]);

export default config;
