import { describe, expect, it } from 'vitest';
import { createAnalyticsReportRepository } from '../src/report/repository.impl.js';
import { computeCsvDimensions, computePdfPageCount, createReportEngine } from '../src/report/engine.impl.js';
import { createAnalyticsEventBus } from '../src/events/index.js';

const ORG = 'org-1';

describe('computePdfPageCount (pure)', () => {
  it('computes a fixed rows-per-page density', () => {
    expect(computePdfPageCount(80)).toBe(2);
    expect(computePdfPageCount(41)).toBe(2);
  });

  it('returns 1 page for zero rows', () => {
    expect(computePdfPageCount(0)).toBe(1);
  });
});

describe('computeCsvDimensions (pure)', () => {
  it('computes total row count and the widest column set', () => {
    const dims = computeCsvDimensions([
      { title: 's1', rows: [{ a: 1, b: 2 }, { a: 1 }] },
      { title: 's2', rows: [{ a: 1, b: 2, c: 3 }] },
    ]);
    expect(dims).toEqual({ rowCount: 3, columnCount: 3 });
  });

  it('returns zeros for no sections', () => {
    expect(computeCsvDimensions([])).toEqual({ rowCount: 0, columnCount: 0 });
  });
});

function setup(eventBus = createAnalyticsEventBus()) {
  const repository = createAnalyticsReportRepository();
  const engine = createReportEngine(repository, eventBus);
  return { repository, engine, eventBus };
}

describe('createReportEngine — generateReport', () => {
  it('computes real pdfMetadata for a pdf report', async () => {
    const { engine } = setup();
    const report = await engine.generateReport(ORG, { title: 'Sales Report', format: 'pdf', sections: [{ title: 'Deals', rows: Array(45).fill({ a: 1 }) }] });
    expect(report.pdfMetadata).toEqual({ pageCount: 2, sectionCount: 1 });
    expect(report.csvMetadata).toBeUndefined();
    expect(report.jsonMetadata).toBeUndefined();
  });

  it('computes real csvMetadata for a csv report', async () => {
    const { engine } = setup();
    const report = await engine.generateReport(ORG, { title: 'Sales Report', format: 'csv', sections: [{ title: 'Deals', rows: [{ a: 1, b: 2 }] }] });
    expect(report.csvMetadata).toEqual({ rowCount: 1, columnCount: 2 });
  });

  it('computes real jsonMetadata for a json report', async () => {
    const { engine } = setup();
    const report = await engine.generateReport(ORG, { title: 'Sales Report', format: 'json', sections: [{ title: 'Deals', rows: [{ a: 1 }] }] });
    expect(report.jsonMetadata?.byteSizeEstimate).toBeGreaterThan(0);
  });

  it('never generates a real file — sections are preserved as data only', async () => {
    const { engine } = setup();
    const report = await engine.generateReport(ORG, { title: 't', format: 'json', sections: [] });
    expect(report.sections).toEqual([]);
  });

  it('publishes report.generated', async () => {
    const eventBus = createAnalyticsEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('report.generated', (payload) => (seen = payload));
    const report = await engine.generateReport(ORG, { title: 't', format: 'json', sections: [] });
    expect(seen).toEqual({ organizationId: ORG, reportId: report.id, format: 'json' });
  });
});

describe('createReportEngine — get / findByFormat / list / org scoping', () => {
  it('get() returns null for an unknown report', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByFormat() filters correctly', async () => {
    const { engine } = setup();
    await engine.generateReport(ORG, { title: 'a', format: 'pdf', sections: [] });
    await engine.generateReport(ORG, { title: 'b', format: 'csv', sections: [] });
    const pdfReports = await engine.findByFormat(ORG, 'pdf');
    expect(pdfReports).toHaveLength(1);
  });

  it('list() returns every report', async () => {
    const { engine } = setup();
    await engine.generateReport(ORG, { title: 'a', format: 'pdf', sections: [] });
    await engine.generateReport(ORG, { title: 'b', format: 'csv', sections: [] });
    expect(await engine.list(ORG)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const report = await engine.generateReport(ORG, { title: 'a', format: 'pdf', sections: [] });
    expect(await repository.findById('org-2', report.id)).toBeNull();
  });
});
