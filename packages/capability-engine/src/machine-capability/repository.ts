/** @module machine-capability/repository */
import type {
  CapabilityId,
  MachineCapabilityId,
  MachineId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MachineCapability, MachineCapabilityStatus } from './types.js';

export interface MachineCapabilityRepository extends Repository<
  MachineCapability,
  MachineCapabilityId
> {
  findByMachine(
    organizationId: OrganizationId,
    machineId: MachineId,
  ): Promise<readonly MachineCapability[]>;
  findByCapability(
    organizationId: OrganizationId,
    capabilityId: CapabilityId,
  ): Promise<readonly MachineCapability[]>;
  findByMachineAndCapability(
    organizationId: OrganizationId,
    machineId: MachineId,
    capabilityId: CapabilityId,
  ): Promise<MachineCapability | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: MachineCapabilityStatus,
  ): Promise<readonly MachineCapability[]>;
}
