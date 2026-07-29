/**
 * Real Extension Configuration engine — per-extension defaults and
 * overrides, with a minimal, deterministic field-level validator
 * (never an external JSON Schema library).
 *
 * @module extension-configuration/engine.impl
 */
import type { MarketplaceEventBus } from '../events/marketplace-event-bus.js';
import { ConfigValidationError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ExtensionId, OrganizationId } from '../shared/identifiers.js';
import type { ExtensionConfigRepository } from './repository.js';
import type { ConfigFieldSchema, ExtensionConfigEntry } from './types.js';

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

/** Deterministic field-level validation over an extension configuration payload. */
export function validateExtensionConfig(fields: readonly ConfigFieldSchema[], data: Readonly<Record<string, unknown>>): ValidationResult {
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

export interface SetConfigInput {
  readonly extensionId: ExtensionId;
  readonly key: string;
  readonly value: unknown;
  /** When given, `value` (which must be a `Record<string, unknown>`) is validated before being persisted. */
  readonly schema?: readonly ConfigFieldSchema[];
}

export interface ExtensionConfigurationEngine {
  setDefault(organizationId: OrganizationId, input: SetConfigInput): Promise<ExtensionConfigEntry>;
  setOverride(organizationId: OrganizationId, input: SetConfigInput): Promise<ExtensionConfigEntry>;
  getEffectiveConfig(organizationId: OrganizationId, extensionId: ExtensionId, key: string): Promise<ExtensionConfigEntry | null>;
  listConfigsForExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<readonly ExtensionConfigEntry[]>;
}

/** Creates a real {@link ExtensionConfigurationEngine}. */
export function createExtensionConfigurationEngine(repository: ExtensionConfigRepository, eventBus?: MarketplaceEventBus, now: () => string = nowIso): ExtensionConfigurationEngine {
  async function findExisting(organizationId: OrganizationId, extensionId: ExtensionId, key: string, isOverride: boolean): Promise<ExtensionConfigEntry | undefined> {
    const entries = await repository.findByExtension(organizationId, extensionId);
    return entries.find((entry) => entry.key === key && entry.isOverride === isOverride);
  }

  async function upsert(organizationId: OrganizationId, input: SetConfigInput, isOverride: boolean): Promise<ExtensionConfigEntry> {
    if (input.schema) {
      const result = validateExtensionConfig(input.schema, input.value as Readonly<Record<string, unknown>>);
      if (!result.valid) throw new ConfigValidationError(result.errors);
    }

    const existing = await findExisting(organizationId, input.extensionId, input.key, isOverride);
    const timestamp = now();
    const entry: ExtensionConfigEntry = existing
      ? { ...existing, value: input.value, updatedAt: timestamp }
      : {
          id: generateId('marketplace-config'),
          organizationId,
          createdAt: timestamp,
          updatedAt: timestamp,
          extensionId: input.extensionId,
          key: input.key,
          value: input.value,
          isOverride,
        };
    await repository.save(entry);
    eventBus?.publish('configuration.changed', { organizationId, extensionConfigId: entry.id, key: entry.key });
    return entry;
  }

  return {
    async setDefault(organizationId, input) {
      return upsert(organizationId, input, false);
    },

    async setOverride(organizationId, input) {
      return upsert(organizationId, input, true);
    },

    async getEffectiveConfig(organizationId, extensionId, key) {
      const entries = await repository.findByExtension(organizationId, extensionId);
      const override = entries.find((entry) => entry.key === key && entry.isOverride);
      if (override) return override;
      return entries.find((entry) => entry.key === key && !entry.isOverride) ?? null;
    },

    async listConfigsForExtension(organizationId, extensionId) {
      return repository.findByExtension(organizationId, extensionId);
    },
  };
}
