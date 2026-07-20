/** @module lifecycle/manager */
import type { ExtensionLifecycleRecord, ExtensionLifecycleState, ExtensionRegistryStatus } from './types.js';

export class ExtensionLifecycleManager {
  private readonly records = new Map<string, ExtensionLifecycleRecord>();

  get(id: string): ExtensionLifecycleRecord | undefined {
    return this.records.get(id);
  }

  transition(id: string, state: ExtensionLifecycleState, status?: ExtensionRegistryStatus, error?: string): ExtensionLifecycleRecord {
    const current = this.records.get(id);
    const record: ExtensionLifecycleRecord = {
      id,
      state,
      status: state === 'failed' ? 'failed' : (status ?? current?.status ?? 'pending'),
      updatedAt: new Date().toISOString(),
      error,
    };
    this.records.set(id, record);
    return record;
  }

  setStatus(id: string, status: ExtensionRegistryStatus): ExtensionLifecycleRecord {
    const current = this.records.get(id);
    return this.transition(id, current?.state ?? 'installed', status, current?.error);
  }

  list(): readonly ExtensionLifecycleRecord[] {
    return [...this.records.values()];
  }

  listByStatus(status: ExtensionRegistryStatus): readonly ExtensionLifecycleRecord[] {
    return this.list().filter((record) => record.status === status);
  }

  remove(id: string): void {
    this.transition(id, 'removed', 'disabled');
    this.records.delete(id);
  }
}

export function createExtensionLifecycleManager(): ExtensionLifecycleManager {
  return new ExtensionLifecycleManager();
}
