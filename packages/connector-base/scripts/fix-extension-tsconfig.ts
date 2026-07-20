/**
 * Fix extension tsconfig files after scaffold.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const EXTENSIONS_DIR = join(import.meta.dirname, '../../extensions');

const FIXED_TSCONFIG = `{
  "extends": "@lateen-os/typescript-config/node.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true
  },
  "include": ["src"]
}
`;

for (const folder of readdirSync(EXTENSIONS_DIR, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  const tsconfigPath = join(EXTENSIONS_DIR, folder.name, 'tsconfig.json');
  writeFileSync(tsconfigPath, FIXED_TSCONFIG);
  console.log(`Fixed ${folder.name}/tsconfig.json`);
}
