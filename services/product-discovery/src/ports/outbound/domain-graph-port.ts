/** @module ports/outbound/domain-graph-port */
import type { GraphQueries } from '@lateen-os/domain-graph';
import type { GraphNodeId, OrganizationId } from '../../domain/identifiers.js';

/** Outbound port to Domain Graph — entity relationships and context. */
export interface DomainGraphPort extends GraphQueries {
  resolveProductContext(
    organizationId: OrganizationId,
    nodeId: GraphNodeId,
  ): Promise<Readonly<Record<string, unknown>> | null>;
}
