/**
 * Platform adapters — the only place this app calls `apps/backend`'s
 * real REST API (built in Task 4). Every page under `src/app/**`
 * reaches business data exclusively through the functions re-exported
 * here; nothing in this app imports a business engine package, calls
 * `createXRuntime()`, or reaches a repository.
 */
export * as crm from './crm';
export * as sales from './sales';
export * as finance from './finance';
export * as inventory from './inventory';
export * as projects from './projects';
export * as hr from './hr';
export * as customerSuccess from './customer-success';
export * as documents from './documents';
export * as analytics from './analytics';
