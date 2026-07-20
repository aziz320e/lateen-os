import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'testing/index': 'src/testing/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'node20',
  outDir: 'dist',
});
