/** @module testing/mock-worker */
import type { WorkerProfile } from '../worker/types.js';

export function createMockWorker(overrides: Partial<WorkerProfile> = {}): WorkerProfile {
  return {
    code: 'mock-worker',
    name: 'Mock Worker',
    description: 'Test worker',
    role: 'analyst',
    skills: [{ id: 'analysis', name: 'Analysis', proficiency: '0.9' }],
    events: [{ name: 'worker.assigned' }],
    sdkVersion: '1.0.0',
    ...overrides,
  };
}
