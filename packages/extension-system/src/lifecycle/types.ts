/** @module lifecycle/types */
export type ExtensionLifecycleState =
  | 'installing'
  | 'installed'
  | 'loading'
  | 'loaded'
  | 'starting'
  | 'started'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'removed';

export type ExtensionRegistryStatus = 'enabled' | 'disabled' | 'failed' | 'pending';

export interface ExtensionLifecycleRecord {
  readonly id: string;
  readonly state: ExtensionLifecycleState;
  readonly status: ExtensionRegistryStatus;
  readonly updatedAt: string;
  readonly error?: string;
}
