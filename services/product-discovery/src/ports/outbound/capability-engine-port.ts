/** @module ports/outbound/capability-engine-port */
import type { Capability } from '@lateen-os/capability-engine';
import type { CapabilityId, OrganizationId } from '../../domain/identifiers.js';

/** Outbound port to Capability Engine — manufacturing capability catalog. */
export interface CapabilityEnginePort {
  listCapabilities(organizationId: OrganizationId): Promise<readonly Capability[]>;

  getCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<Capability | null>;

  findCapabilitiesByTags(
    organizationId: OrganizationId,
    tags: readonly string[],
  ): Promise<readonly Capability[]>;
}
