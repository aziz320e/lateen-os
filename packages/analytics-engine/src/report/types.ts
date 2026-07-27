/** @module report/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AnalyticsReportId } from '../shared/identifiers.js';

export type { AnalyticsReportId };

/** The three deterministic report models supported by the Report Engine — metadata only, no real file generation. */
export type ReportFormat = 'pdf' | 'csv' | 'json';

/** A single named section of tabular data within a report. */
export interface ReportSection {
  readonly title: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

export interface PdfReportMetadata {
  readonly pageCount: number;
  readonly sectionCount: number;
}

export interface CsvReportMetadata {
  readonly rowCount: number;
  readonly columnCount: number;
}

export interface JsonReportMetadata {
  readonly byteSizeEstimate: number;
}

/** A single, deterministic analytics report — metadata-only model, no real file is ever generated. */
export interface AnalyticsReport extends TenantAuditableEntity<AnalyticsReportId> {
  readonly title: string;
  readonly format: ReportFormat;
  readonly sections: readonly ReportSection[];
  readonly pdfMetadata?: PdfReportMetadata;
  readonly csvMetadata?: CsvReportMetadata;
  readonly jsonMetadata?: JsonReportMetadata;
  readonly generatedAt: string;
}
