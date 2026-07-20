/**
 * Customer value objects (Enrichment v1).
 * @module customer/value-objects
 */

import type { SlaTier } from '../shared/enums.js';
import type { ISODate } from '../shared/primitives.js';
import type {
  AccountTier,
  ContractStatus,
  ContractType,
  RecurringOrderSchedule,
} from './types.js';

export type { RecurringOrderSchedule, ContractType, ContractStatus, AccountTier };

/** Enterprise contract terms on a B2B customer account. */
export interface EnterpriseContract {
  readonly contractType: ContractType;
  readonly contractStatus: ContractStatus;
  readonly contractReference?: string;
  readonly contractStartDate?: ISODate;
  readonly contractEndDate?: ISODate;
  readonly contractValue?: string;
  readonly slaTier?: SlaTier;
}
