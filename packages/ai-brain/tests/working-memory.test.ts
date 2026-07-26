import { describe, expect, it } from 'vitest';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

async function buildContext(rawInput: string) {
  const intent = await createIntentRecognizer().recognize({ organizationId: ORG, sessionId: SESSION, rawInput });
  const context = await createEnterpriseContextAssembler().assemble({
    organizationId: ORG,
    sessionId: SESSION,
    correlationId: CORRELATION,
    intent,
  });
  return { intent, context };
}

describe('createWorkingMemory', () => {
  it('retrieves a working context scoped to the organization and session', async () => {
    const { intent, context } = await buildContext('Create a report');
    const workingMemory = createWorkingMemory();

    const working = await workingMemory.retrieve({ organizationId: ORG, sessionId: SESSION, intent, context });
    expect(working.organizationId).toBe(ORG);
    expect(working.sessionId).toBe(SESSION);
    expect(working.activeHypotheses[0]).toContain(intent.type);
  });

  it('includes the query in notes when provided', async () => {
    const { intent, context } = await buildContext('What is our status?');
    const workingMemory = createWorkingMemory();

    const working = await workingMemory.retrieve({ organizationId: ORG, sessionId: SESSION, intent, context, query: 'status' });
    expect(working.notes.some((note) => note.includes('status'))).toBe(true);
  });
});
