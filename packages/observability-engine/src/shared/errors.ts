/** Typed errors used consistently across the Observability Platform runtime implementations. @module shared/errors */

export class LogEntryNotFoundError extends Error {
  constructor(readonly logEntryId: string) {
    super(`Log entry "${logEntryId}" not found`);
    this.name = 'LogEntryNotFoundError';
  }
}

export class TraceNotFoundError extends Error {
  constructor(readonly traceId: string) {
    super(`Trace "${traceId}" not found`);
    this.name = 'TraceNotFoundError';
  }
}

export class SpanNotFoundError extends Error {
  constructor(readonly spanId: string) {
    super(`Span "${spanId}" not found`);
    this.name = 'SpanNotFoundError';
  }
}

export class AlertNotFoundError extends Error {
  constructor(readonly alertId: string) {
    super(`Alert "${alertId}" not found`);
    this.name = 'AlertNotFoundError';
  }
}

export class ObservabilitySnapshotNotFoundError extends Error {
  constructor(readonly snapshotId: string) {
    super(`Observability snapshot "${snapshotId}" not found`);
    this.name = 'ObservabilitySnapshotNotFoundError';
  }
}
