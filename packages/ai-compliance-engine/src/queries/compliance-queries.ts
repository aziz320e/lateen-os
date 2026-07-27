/** @module queries/compliance-queries */
import type {
  FindAssessmentsQuery,
  FindAssessmentsResult,
  FindAuditsQuery,
  FindAuditsResult,
  FindComplianceStatusQuery,
  FindComplianceStatusResult,
  FindControlsQuery,
  FindControlsResult,
  FindEvidenceQuery,
  FindEvidenceResult,
  FindFrameworksQuery,
  FindFrameworksResult,
  FindRemediationsQuery,
  FindRemediationsResult,
  FindReportsQuery,
  FindReportsResult,
  SearchComplianceQuery,
  SearchComplianceResult,
} from './types.js';

/** Real, read-only AI Compliance Engine query port. */
export interface ComplianceQueries {
  findFrameworks(query: FindFrameworksQuery): Promise<FindFrameworksResult>;
  findControls(query: FindControlsQuery): Promise<FindControlsResult>;
  findAssessments(query: FindAssessmentsQuery): Promise<FindAssessmentsResult>;
  findEvidence(query: FindEvidenceQuery): Promise<FindEvidenceResult>;
  findAudits(query: FindAuditsQuery): Promise<FindAuditsResult>;
  findReports(query: FindReportsQuery): Promise<FindReportsResult>;
  findRemediations(query: FindRemediationsQuery): Promise<FindRemediationsResult>;
  findComplianceStatus(query: FindComplianceStatusQuery): Promise<FindComplianceStatusResult>;
  searchCompliance(query: SearchComplianceQuery): Promise<SearchComplianceResult>;
}
