import { describe, expect, it } from 'vitest';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';
import { createWorkingMemory } from '../src/memory/working-memory.impl.js';
import { createBrainPlanner } from '../src/planner/planner.impl.js';
import { createEnterpriseReasoner } from '../src/reasoning/reasoner.impl.js';
import { createBrainReflector } from '../src/reflection/reflector.impl.js';
import { createPlatformRouter } from '../src/routing/router.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

async function reasoningFor(rawInput: string) {
  const intent = await createIntentRecognizer().recognize({ organizationId: ORG, sessionId: SESSION, rawInput });
  const context = await createEnterpriseContextAssembler().assemble({
    organizationId: ORG,
    sessionId: SESSION,
    correlationId: CORRELATION,
    intent,
  });
  const reasoning = await createEnterpriseReasoner({ workingMemory: createWorkingMemory() }).reason({
    organizationId: ORG,
    sessionId: 'reasoning-1',
    intent,
    context,
  });
  return { intent, context, reasoning };
}

describe('createBrainReflector', () => {
  it('reports strengths and no gaps for a successful reasoning result with a targeted plan', async () => {
    const { intent, context, reasoning } = await reasoningFor('Create a product');
    const routing = await createPlatformRouter().route({ organizationId: ORG, reasoningResult: reasoning });
    const plan = await createBrainPlanner().createPlan({
      organizationId: ORG,
      reasoningSessionId: 'reasoning-1',
      intent,
      context,
      routing,
    });
    const reflector = createBrainReflector();

    const reflection = await reflector.reflect({ organizationId: ORG, sessionId: 'reflection-1', reasoningResult: reasoning, plan });
    expect(reflection.evaluation.riskLevel).toBe('low');
    expect(reflection.shouldRevise).toBe(false);
    expect(reflection.evaluation.strengths.length).toBeGreaterThan(0);
  });

  it('flags a high risk and a clarification improvement when reasoning failed', async () => {
    const { reasoning } = await reasoningFor('purple elephants dance quietly');
    const reflector = createBrainReflector();

    const reflection = await reflector.reflect({ organizationId: ORG, sessionId: 'reflection-2', reasoningResult: reasoning });
    expect(reflection.evaluation.riskLevel).toBe('high');
    expect(reflection.shouldRevise).toBe(true);
    expect(reflection.evaluation.gaps).toContain('Intent could not be confidently classified.');
  });

  it('flags a medium risk and "no plan" gap when reasoning succeeded but no plan was given', async () => {
    const { reasoning } = await reasoningFor('Create a product');
    const reflector = createBrainReflector();

    const reflection = await reflector.reflect({ organizationId: ORG, sessionId: 'reflection-3', reasoningResult: reasoning });
    expect(reflection.evaluation.riskLevel).toBe('medium');
    expect(reflection.evaluation.gaps).toContain('No execution plan was produced.');
  });
});
