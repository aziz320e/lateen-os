import { describe, expect, it } from 'vitest';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';

describe('createIntentRecognizer', () => {
  it('classifies trailing "?" input as a query with high confidence', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'What is our Q3 revenue?' });

    expect(intent.type).toBe('query');
    expect(intent.confidence.level).toBe('very_high');
    expect(intent.organizationId).toBe(ORG);
    expect(intent.sessionId).toBe(SESSION);
  });

  it('classifies mission keywords as a mission intent', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Start a new mission to grow revenue' });
    expect(intent.type).toBe('mission');
  });

  it('classifies collaboration keywords as a collaboration intent', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Coordinate with the sales team on this' });
    expect(intent.type).toBe('collaboration');
  });

  it('classifies workflow keywords as a workflow intent', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Update the onboarding workflow' });
    expect(intent.type).toBe('workflow');
  });

  it('classifies command keywords as a command intent', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Create a new product listing' });
    expect(intent.type).toBe('command');
  });

  it('falls back to "unknown" with very low confidence when nothing matches', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'purple elephants dance quietly' });
    expect(intent.type).toBe('unknown');
    expect(intent.confidence.level).toBe('very_low');
  });

  it('extracts quoted phrases as entities', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({
      organizationId: ORG,
      sessionId: SESSION,
      rawInput: 'Create a product called "Winter Banner"',
    });
    expect(intent.entities).toHaveLength(1);
    expect(intent.entities[0]?.value).toBe('Winter Banner');
    expect(intent.entities[0]?.intentId).toBe(intent.id);
  });

  it('extracts numeric literals as parameters', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({
      organizationId: ORG,
      sessionId: SESSION,
      rawInput: 'Order 42 units at 19.99 each',
    });
    expect(intent.parameters).toHaveLength(2);
    expect(intent.parameters[0]?.value).toBe(42);
    expect(intent.parameters[1]?.value).toBe(19.99);
  });
});
