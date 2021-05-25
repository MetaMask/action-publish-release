module.exports = {
  root: true,

  extends: ['@metamask/eslint-config', '@metamask/eslint-config-nodejs'],

  rules: {
    'node/no-process-env': 'off',
  },

  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': ['error', { builtinGlobals: true }],
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        'import/unambiguous': 'off',
      },
    },
    {
      files: ['**/*.test.js', '**/*.test.ts'],
      extends: ['@metamask/eslint-config-jest'],
    },
  ],

  ignorePatterns: ['!.eslintrc.js', 'lib/', 'dist/'],
};
