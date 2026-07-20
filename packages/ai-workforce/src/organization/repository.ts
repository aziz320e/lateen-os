/** @module organization/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkforceOrgUnit, WorkforceOrgUnitId } from './types.js';

export type WorkforceOrgUnitRepository = Repository<WorkforceOrgUnit, WorkforceOrgUnitId>;
