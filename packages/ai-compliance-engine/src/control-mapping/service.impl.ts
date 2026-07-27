/**
 * Real Control Mapping service — deterministic many-to-many mappings
 * between a compliance control and policies, governance rules,
 * security controls, workflows, or business processes.
 *
 * @module control-mapping/service.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceControlId, ControlMappingId, OrganizationId } from '../shared/identifiers.js';
import type { ControlMappingRepository } from './repository.js';
import type { ControlMapping, MappedRecordType } from './types.js';

export interface MapControlInput {
  readonly controlId: ComplianceControlId;
  readonly mappedType: MappedRecordType;
  readonly mappedId: string;
}

export interface ControlMappingService {
  mapControl(organizationId: OrganizationId, input: MapControlInput): Promise<ControlMapping>;
  unmapControl(organizationId: OrganizationId, mappingId: ControlMappingId): Promise<void>;
  findMappingsForControl(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<readonly ControlMapping[]>;
  findControlIdsForMappedRecord(organizationId: OrganizationId, mappedType: MappedRecordType, mappedId: string): Promise<readonly ComplianceControlId[]>;
}

/** Creates a real {@link ControlMappingService} backed by a {@link ControlMappingRepository}. */
export function createControlMappingService(
  repository: ControlMappingRepository,
  now: () => string = nowIso,
): ControlMappingService {
  return {
    async mapControl(organizationId, input) {
      const timestamp = now();
      const mapping: ControlMapping = {
        id: generateId('control-mapping'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        controlId: input.controlId,
        mappedType: input.mappedType,
        mappedId: input.mappedId,
      };
      await repository.save(mapping);
      return mapping;
    },

    async unmapControl(organizationId, mappingId) {
      await repository.delete(organizationId, mappingId);
    },

    async findMappingsForControl(organizationId, controlId) {
      return repository.findByControlId(organizationId, controlId);
    },

    async findControlIdsForMappedRecord(organizationId, mappedType, mappedId) {
      const mappings = await repository.findByMappedRecord(organizationId, mappedType, mappedId);
      return mappings.map((mapping) => mapping.controlId);
    },
  };
}
