import { randomUUID } from 'node:crypto';
import type { EntityMapping } from '../domain/types';
import type { MappingRepositoryPort } from '../domain/ports';

export class MappingService {
  constructor(private readonly mappings: MappingRepositoryPort) {}

  listMappings(connectorId: string, organizationId: string): Promise<EntityMapping[]> {
    return this.mappings.listMappings(connectorId, organizationId);
  }

  saveMapping(input: Omit<EntityMapping, 'id'> & { id?: string }): Promise<EntityMapping> {
    const mapping: EntityMapping = {
      id: input.id ?? randomUUID(),
      connectorId: input.connectorId,
      organizationId: input.organizationId,
      externalEntity: input.externalEntity,
      internalEntity: input.internalEntity,
      transformation: input.transformation,
      validation: input.validation,
      schemaVersion: input.schemaVersion,
    };
    return this.mappings.saveMapping(mapping);
  }
}
