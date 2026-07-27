/**
 * Real Report Engine — deterministic PDF/CSV/JSON report models.
 * Metadata only: no real file is ever generated. Page/row/column/byte
 * counts are computed deterministically from the given sections so
 * the model is genuinely useful without a rendering pipeline.
 *
 * @module report/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { AnalyticsReportId, OrganizationId } from '../shared/identifiers.js';
import type { AnalyticsReportRepository } from './repository.js';
import type { AnalyticsReport, ReportFormat, ReportSection } from './types.js';

const ROWS_PER_PAGE = 40;

/** Pure: estimated page count for a PDF model — a fixed rows-per-page density. */
export function computePdfPageCount(totalRows: number): number {
  return totalRows === 0 ? 1 : Math.ceil(totalRows / ROWS_PER_PAGE);
}

/** Pure: total row count and the widest column set across every section. */
export function computeCsvDimensions(sections: readonly ReportSection[]): { rowCount: number; columnCount: number } {
  const rowCount = sections.reduce((sum, section) => sum + section.rows.length, 0);
  const columnCount = sections.reduce((max, section) => {
    const columnsInSection = section.rows.reduce((cols, row) => Math.max(cols, Object.keys(row).length), 0);
    return Math.max(max, columnsInSection);
  }, 0);
  return { rowCount, columnCount };
}

export interface GenerateReportInput {
  readonly title: string;
  readonly format: ReportFormat;
  readonly sections: readonly ReportSection[];
}

export interface ReportEngine {
  generateReport(organizationId: OrganizationId, input: GenerateReportInput): Promise<AnalyticsReport>;
  get(organizationId: OrganizationId, reportId: AnalyticsReportId): Promise<AnalyticsReport | null>;
  findByFormat(organizationId: OrganizationId, format: ReportFormat): Promise<readonly AnalyticsReport[]>;
  list(organizationId: OrganizationId): Promise<readonly AnalyticsReport[]>;
}

/** Creates a real {@link ReportEngine} backed by an {@link AnalyticsReportRepository}. */
export function createReportEngine(
  repository: AnalyticsReportRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): ReportEngine {
  return {
    async generateReport(organizationId, input) {
      const totalRows = input.sections.reduce((sum, section) => sum + section.rows.length, 0);
      const timestamp = now();

      const report: AnalyticsReport = {
        id: generateId('analytics-report'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        format: input.format,
        sections: input.sections,
        pdfMetadata: input.format === 'pdf' ? { pageCount: computePdfPageCount(totalRows), sectionCount: input.sections.length } : undefined,
        csvMetadata: input.format === 'csv' ? computeCsvDimensions(input.sections) : undefined,
        jsonMetadata: input.format === 'json' ? { byteSizeEstimate: JSON.stringify(input.sections).length } : undefined,
        generatedAt: timestamp,
      };
      await repository.save(report);
      eventBus?.publish('report.generated', { organizationId, reportId: report.id, format: report.format });
      return report;
    },

    async get(organizationId, reportId) {
      return repository.findById(organizationId, reportId);
    },

    async findByFormat(organizationId, format) {
      return repository.findByFormat(organizationId, format);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
