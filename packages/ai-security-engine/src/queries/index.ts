/**
 * Query Layer — findAuditEvents, findThreats, findSecrets,
 * findPolicies, findViolations, searchSecurity.
 * @module queries
 */
export * from './types.js';
export * from './security-queries.js';
export { createSecurityQueries, type SecurityQueriesDeps } from './security-queries.impl.js';
