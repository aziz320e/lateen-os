/**
 * @lateen-os/shared-kernel — Shared Kernel for Lateen OS
 *
 * Foundational DDD building blocks used by every package in the monorepo.
 * Pure TypeScript — no frameworks, persistence, HTTP, or UI.
 *
 * @packageDocumentation
 */

export * as core from './core/index.js';
export * as identity from './identity/index.js';
export * as common from './common/index.js';
export * as audit from './audit/index.js';
export * as tenant from './tenant/index.js';
export * as time from './time/index.js';

export type { Entity } from './core/entity.js';
export type { AggregateRoot } from './core/aggregate-root.js';
export type { ValueObject } from './core/value-object.js';
export type { DomainEvent, DomainEventName } from './core/domain-event.js';
export type { DomainError } from './core/domain-error.js';
export { createDomainError } from './core/domain-error.js';
export type { Result, Ok, Err } from './core/result.js';
export { ok, err, isOk, isErr } from './core/result.js';
export type { GuardClause, GuardResult } from './core/guard.js';
export {
  guardFail,
  guardPass,
  isNullOrUndefined,
  isNonEmptyString,
  isDefined,
} from './core/guard.js';
export type {
  Specification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
} from './core/specification.js';

export type { UUID } from './identity/uuid.js';
export type { Identifier, BrandedIdentifier } from './identity/identifier.js';

export type {
  Money,
  CurrencyCode,
  Address,
  Email,
  Phone,
  Percentage,
  TimeRange,
  GeoLocation,
} from './common/index.js';

export type { AuditInfo, VersionInfo } from './audit/index.js';

export type { TenantId, OrganizationId, BranchId } from './tenant/index.js';

export type { Timestamp, DateOnly, Clock } from './time/index.js';
