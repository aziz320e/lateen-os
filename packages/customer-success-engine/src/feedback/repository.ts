/** @module feedback/repository */
import type { Repository } from '../shared/repository.js';
import type { FeedbackEntryId, OrganizationId } from '../shared/identifiers.js';
import type { FeedbackEntry, FeedbackType } from './types.js';

export interface FeedbackEntryRepository extends Repository<FeedbackEntry, FeedbackEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly FeedbackEntry[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly FeedbackEntry[]>;
  findByType(organizationId: OrganizationId, feedbackType: FeedbackType): Promise<readonly FeedbackEntry[]>;
}
