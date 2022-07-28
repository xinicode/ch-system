module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint'
  ],
  rules: {
    semi: [0],
    indent: 'off',
    quotes: 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/script-indent': [
      'off',
      2,
      {
        baseIndent: 1
      }
    ],
    'vue/no-parsing-error': [
      2,
      {
        'x-invalid-end-tag': false
      }
    ],
    'prettier/prettier': 'error',
    'prefer-const': 'off',
    'generator-star-spacing': 'off',
    'space-before-blocks': 'off',
    'space-before-function-paren': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        varsIgnorePattern: '^(_|[iI]g)',
        argsIgnorePattern: '^(_|[iI]g)',
        caughtErrors: 'none'
      }
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020
  }
};
