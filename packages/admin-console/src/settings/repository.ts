/** @module settings/repository */
import type { SettingId } from '../shared/identifiers.js';
import type { Setting } from './types.js';

/**
 * Deliberately not organization-scoped like most of this package's
 * repositories — a `Setting` can be `'global'`, so this port is a
 * plain, platform-wide store; scope filtering happens in
 * `settings/engine.impl.ts`.
 */
export interface SettingRepository {
  findById(id: SettingId): Promise<Setting | null>;
  save(setting: Setting): Promise<void>;
  findAll(): Promise<readonly Setting[]>;
}
