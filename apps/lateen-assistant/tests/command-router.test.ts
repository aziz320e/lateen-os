import { describe, expect, it } from 'vitest';
import { detectCommand, searchCommands, COMMAND_CATALOG } from '@/lib/api/command-router';

describe('command-router', () => {
  it('detects slash commands', () => {
    expect(detectCommand('/help')).toBe('help');
    expect(detectCommand('/launch-product')).toBe('launch-product');
    expect(detectCommand('run product discovery')).toBe('run-product-discovery');
    expect(detectCommand('show company health')).toBe('show-company-health');
  });

  it('returns unknown for unrecognized input', () => {
    expect(detectCommand('hello world')).toBe('unknown');
  });

  it('searches command catalog', () => {
    const results = searchCommands('customer');
    expect(results.some((c) => c.id === 'create-customer')).toBe(true);
  });

  it('catalog includes all required commands', () => {
    const ids = COMMAND_CATALOG.map((c) => c.id);
    expect(ids).toContain('create-customer');
    expect(ids).toContain('launch-product');
    expect(ids).toContain('run-product-discovery');
    expect(ids).toContain('approve-decision');
    expect(ids).toContain('generate-report');
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });
});
