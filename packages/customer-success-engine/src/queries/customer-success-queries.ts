/** @module queries/customer-success-queries */
import type {
  FindCustomersQuery,
  FindCustomersResult,
  FindExpansionQuery,
  FindExpansionResult,
  FindFeedbackQuery,
  FindFeedbackResult,
  FindHealthQuery,
  FindHealthResult,
  FindPlansQuery,
  FindPlansResult,
  FindRenewalsQuery,
  FindRenewalsResult,
  FindRisksQuery,
  FindRisksResult,
  SearchCustomerSuccessQuery,
  SearchCustomerSuccessResult,
} from './types.js';

/** Real, read-only Customer Success Engine query port. */
export interface CustomerSuccessQueries {
  findCustomers(query: FindCustomersQuery): Promise<FindCustomersResult>;
  findHealth(query: FindHealthQuery): Promise<FindHealthResult>;
  findRenewals(query: FindRenewalsQuery): Promise<FindRenewalsResult>;
  findPlans(query: FindPlansQuery): Promise<FindPlansResult>;
  findFeedback(query: FindFeedbackQuery): Promise<FindFeedbackResult>;
  findRisks(query: FindRisksQuery): Promise<FindRisksResult>;
  findExpansion(query: FindExpansionQuery): Promise<FindExpansionResult>;
  searchCustomerSuccess(query: SearchCustomerSuccessQuery): Promise<SearchCustomerSuccessResult>;
}
