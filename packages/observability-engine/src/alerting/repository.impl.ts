/** Real, in-memory {@link AlertRepository} implementation. @module alerting/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AlertRepository } from './repository.js';
import type { Alert } from './types.js';

/** Creates a real, in-memory {@link AlertRepository}. */
export function createAlertRepository(seed?: readonly Alert[]): AlertRepository {
  const repo = createInMemoryRepository<Alert>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((alert) => alert.status === status);
    },
    async findByType(organizationId, alertType) {
      return repo.list(organizationId).filter((alert) => alert.alertType === alertType);
    },
  };
}
