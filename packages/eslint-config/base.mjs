import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Shared base flat config for Lateen OS apps — TypeScript-aware linting
 * with type-checking rules relaxed to non-blocking warnings (apps opt in
 * to type-aware rules via their own `parserOptions.project` if desired).
 * Consuming apps append their own env globals, ignores, and framework
 * configs (e.g. Next.js) on top of this array.
 */
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/coverage/**', '**/*.config.*'],
  },
  prettier,
);

export default base;
