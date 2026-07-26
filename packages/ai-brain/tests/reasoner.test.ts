import { describe, expect, it } from 'vitest';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';
import { createEnterpriseReasoner } from '../src/reasoning/reasoner.impl.js';

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

describe('createEnterpriseReasoner', () => {
  it('produces a completed, ordered reasoning trace and succeeds for a recognized intent', async () => {
    const { intent, context } = await buildContext('Create a new product');
    const reasoner = createEnterpriseReasoner({ workingMemory: createWorkingMemory() });

    const result = await reasoner.reason({ organizationId: ORG, sessionId: 'reasoning-1', intent, context });

    expect(result.success).toBe(true);
    expect(result.intentType).toBe('command');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.every((step) => step.status === 'completed')).toBe(true);
    expect(result.steps.map((step) => step.order)).toEqual(result.steps.map((_, index) => index + 1));
  });

  it('fails when the intent could not be classified', async () => {
    const { intent, context } = await buildContext('purple elephants dance quietly');
    const reasoner = createEnterpriseReasoner({ workingMemory: createWorkingMemory() });

    const result = await reasoner.reason({ organizationId: ORG, sessionId: 'reasoning-2', intent, context });
    expect(result.success).toBe(false);
    expect(result.explanation.caveats).toBeDefined();
  });
});
