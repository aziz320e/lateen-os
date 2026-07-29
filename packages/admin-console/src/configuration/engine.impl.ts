/**
 * Real Configuration Management engine — runtime configuration
 * entries with per-environment overrides, and a minimal, deterministic
 * field-level validator (never an external JSON Schema library).
 *
 * @module configuration/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { ConfigValidationError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EnvironmentId, OrganizationId } from '../shared/identifiers.js';
import type { RuntimeConfigRepository } from './repository.js';
import type { ConfigFieldSchema, RuntimeConfigEntry } from './types.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

function typeOf(value: unknown): ConfigFieldSchema['type'] | 'undefined' | 'null' {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const jsType = typeof value;
  if (jsType === 'string' || jsType === 'number' || jsType === 'boolean' || jsType === 'object') return jsType;
  return 'undefined';
}

/** Deterministic field-level validation over a runtime configuration payload. */
export function validateConfigPayload(fields: readonly ConfigFieldSchema[], data: Readonly<Record<string, unknown>>): ValidationResult {
  const errors: string[] = [];
  for (const field of fields) {
    const value = data[field.field];
    const actualType = typeOf(value);
    if (actualType === 'undefined' || actualType === 'null') {
      if (field.required) errors.push(`"${field.field}" is required`);
      continue;
    }
    if (actualType !== field.type) {
      errors.push(`"${field.field}" must be of type "${field.type}", got "${actualType}"`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export interface SetRuntimeConfigInput {
  readonly environmentId?: EnvironmentId;
  readonly key: string;
  readonly value: unknown;
  /** When given, `value` (which must be a `Record<string, unknown>`) is validated before being persisted. */
  readonly schema?: readonly ConfigFieldSchema[];
}

export interface ConfigurationEngine {
  setRuntimeConfig(organizationId: OrganizationId, input: SetRuntimeConfigInput): Promise<RuntimeConfigEntry>;
  getEffectiveConfig(organizationId: OrganizationId, key: string, environmentId?: EnvironmentId): Promise<RuntimeConfigEntry | null>;
  listConfigs(organizationId: OrganizationId): Promise<readonly RuntimeConfigEntry[]>;
}

/** Creates a real {@link ConfigurationEngine}. */
export function createConfigurationEngine(repository: RuntimeConfigRepository, eventBus?: AdminEventBus, now: () => string = nowIso): ConfigurationEngine {
  async function findExisting(organizationId: OrganizationId, key: string, environmentId?: EnvironmentId): Promise<RuntimeConfigEntry | undefined> {
    const all = await repository.findAll(organizationId);
    return all.find((entry) => entry.key === key && entry.environmentId === environmentId);
  }

  return {
    async setRuntimeConfig(organizationId, input) {
      if (input.schema) {
        const result = validateConfigPayload(input.schema, input.value as Readonly<Record<string, unknown>>);
        if (!result.valid) throw new ConfigValidationError(result.errors);
      }

      const existing = await findExisting(organizationId, input.key, input.environmentId);
      const timestamp = now();
      const entry: RuntimeConfigEntry = existing
        ? { ...existing, value: input.value, updatedAt: timestamp }
        : {
            id: generateId('admin-config'),
            organizationId,
            createdAt: timestamp,
            updatedAt: timestamp,
            environmentId: input.environmentId,
            key: input.key,
            value: input.value,
          };
      await repository.save(entry);
      eventBus?.publish('configuration.updated', { organizationId, runtimeConfigId: entry.id, key: entry.key });
      return entry;
    },

    async getEffectiveConfig(organizationId, key, environmentId) {
      if (environmentId) {
        const override = await findExisting(organizationId, key, environmentId);
        if (override) return override;
      }
      const orgWide = await findExisting(organizationId, key);
      return orgWide ?? null;
    },

    async listConfigs(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
