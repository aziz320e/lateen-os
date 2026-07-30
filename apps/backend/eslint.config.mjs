import { base } from '@lateen-os/eslint-config/base';

export default [
  ...base,
  {
    ignores: ['**/prisma/generated/**'],
  },
];
