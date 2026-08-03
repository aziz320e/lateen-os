/**
 * Cross-platform dev orchestrator.
 *
 * `tsx`/esbuild never implements TypeScript's `emitDecoratorMetadata`
 * (confirmed: https://esbuild.github.io/content-types/#isolated-modules).
 * Nest's constructor-based DI relies on that metadata for every provider
 * that doesn't carry an explicit `@Inject()` token, so running this app
 * through `tsx watch` silently breaks dependency injection at runtime
 * even though the exact same source compiles and runs correctly through
 * the real TypeScript compiler (the `build` -> `start` path below).
 *
 * This script reproduces that working `build` -> `start` path in watch
 * mode: `tsc --watch` keeps `dist/` compiled with real decorator
 * metadata, and `node --watch` restarts the app whenever `dist/`
 * changes. Plain Node child processes are used instead of a
 * `concurrently`-style dependency so this fix adds nothing to the
 * dependency tree.
 */
import { spawn, spawnSync } from 'node:child_process';

/** Runs a one-off command to completion, exiting this process if it fails. */
function runSync(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Synchronous bootstrap so `node --watch` always has a valid `dist/` to
// start from on a fresh checkout, mirroring the existing `build` script
// (`prisma generate && tsc`) rather than inventing a new convention.
runSync('prisma', ['generate']);
runSync('tsc', ['--project', 'tsconfig.json']);

const children = [];
let shuttingDown = false;

function spawnWatcher(command, args, { shell = true } = {}) {
  // `shell: true` lets bare command names (`tsc`) resolve through PATH the
  // same way the other pnpm scripts in this file already do. It must stay
  // off for `process.execPath`: on Windows, shell mode builds a raw command
  // string without quoting it, and an unquoted absolute path containing a
  // space (e.g. `C:\Program Files\nodejs\node.exe`) gets split by cmd.exe.
  const child = spawn(command, args, { stdio: 'inherit', shell });
  children.push(child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shutdown(signal ? 0 : (code ?? 1));
  });
  return child;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

spawnWatcher('tsc', ['--watch', '--preserveWatchOutput']);
spawnWatcher(process.execPath, ['--watch', 'dist/main.js'], { shell: false });
