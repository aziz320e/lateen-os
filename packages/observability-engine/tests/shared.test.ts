import { describe, expect, it } from 'vitest';
import { generateId, nowIso } from '../src/shared/id.js';
import {
  LogEntryNotFoundError,
  TraceNotFoundError,
  SpanNotFoundError,
  AlertNotFoundError,
  ObservabilitySnapshotNotFoundError,
} from '../src/shared/errors.js';

describe('generateId (pure)', () => {
  it('prefixes the id with the given string', () => {
    expect(generateId('log-entry')).toMatch(/^log-entry-/);
  });

  it('generates unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('x')));
    expect(ids.size).toBe(50);
  });
});

describe('nowIso (pure)', () => {
  it('returns a valid ISO 8601 date-time string', () => {
    const value = nowIso();
    expect(new Date(value).toISOString()).toBe(value);
  });
});

describe('typed errors', () => {
  it('LogEntryNotFoundError carries the log entry id', () => {
    expect(new LogEntryNotFoundError('log-1').logEntryId).toBe('log-1');
  });

  it('TraceNotFoundError carries the trace id', () => {
    expect(new TraceNotFoundError('trace-1').traceId).toBe('trace-1');
  });

  it('SpanNotFoundError carries the span id', () => {
    expect(new SpanNotFoundError('span-1').spanId).toBe('span-1');
  });

  it('AlertNotFoundError carries the alert id', () => {
    expect(new AlertNotFoundError('alert-1').alertId).toBe('alert-1');
  });

  it('ObservabilitySnapshotNotFoundError carries the snapshot id', () => {
    expect(new ObservabilitySnapshotNotFoundError('snap-1').snapshotId).toBe('snap-1');
  });

  it('every typed error has a distinct .name matching its class', () => {
    expect(new LogEntryNotFoundError('x').name).toBe('LogEntryNotFoundError');
    expect(new TraceNotFoundError('x').name).toBe('TraceNotFoundError');
    expect(new SpanNotFoundError('x').name).toBe('SpanNotFoundError');
    expect(new AlertNotFoundError('x').name).toBe('AlertNotFoundError');
    expect(new ObservabilitySnapshotNotFoundError('x').name).toBe('ObservabilitySnapshotNotFoundError');
  });

  it('every typed error is a real Error instance with a readable message', () => {
    const error = new AlertNotFoundError('alert-42');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('alert-42');
  });
});
