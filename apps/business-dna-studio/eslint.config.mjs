import { FlatCompat } from '@eslint/eslintrc';
import { base } from '@lateen-os/eslint-config/base';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends('next/core-web-vitals'),
  ...base,
  {
    ignores: ['**/.next/**', '**/next-env.d.ts'],
  },
];
