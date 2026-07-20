/** @module provider/health */
import type { ProviderId } from '../shared/identifiers.js';
import type { ProviderHealthSnapshot, ProviderKind } from './types.js';

/** Health monitoring port for provider availability. */
export interface ProviderHealth {
  check(providerId: ProviderId): Promise<ProviderHealthSnapshot>;
  checkAll(): Promise<readonly ProviderHealthSnapshot[]>;
  checkByKind(kind: ProviderKind): Promise<readonly ProviderHealthSnapshot[]>;
  isAvailable(providerId: ProviderId): Promise<boolean>;
}
