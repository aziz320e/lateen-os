import { describe, expect, it } from 'vitest';
import { PlanningError, ProviderError, TaskExecutionError, ToolExecutionError } from '../src/shared/errors.js';

describe('typed runtime errors', () => {
  it('ProviderError carries a cause and correct name', () => {
    const cause = new Error('network down');
    const error = new ProviderError('chat completion failed', cause);
    expect(error.name).toBe('ProviderError');
    expect(error.message).toBe('chat completion failed');
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(Error);
  });

  it('TaskExecutionError carries the failing taskId', () => {
    const error = new TaskExecutionError('handler threw', 'task-1');
    expect(error.name).toBe('TaskExecutionError');
    expect(error.taskId).toBe('task-1');
  });

  it('ToolExecutionError carries the failing toolId', () => {
    const error = new ToolExecutionError('handler threw', 'tool-1');
    expect(error.name).toBe('ToolExecutionError');
    expect(error.toolId).toBe('tool-1');
  });

  it('PlanningError carries an optional cause', () => {
    const error = new PlanningError('no task found');
    expect(error.name).toBe('PlanningError');
    expect(error.cause).toBeUndefined();
  });
});
