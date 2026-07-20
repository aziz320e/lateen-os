#!/usr/bin/env node
import { runSdkCli } from './program.js';

runSdkCli(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
