/**
 * Real, deterministic intent recognition — no LLM. Classifies `rawInput` by
 * trailing punctuation and keyword vocabulary, and extracts quoted phrases
 * and numeric literals as entities/parameters.
 *
 * @module intent/recognizer.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { IntentRecognitionInput, IntentRecognizer } from './recognizer.js';
import type { Intent, IntentConfidenceLevel, IntentEntity, IntentParameter, IntentType } from './types.js';

const INTENT_KEYWORDS: ReadonlyArray<{ readonly type: IntentType; readonly keywords: readonly string[] }> = [
  { type: 'clarification', keywords: ['clarify', 'not sure', 'unclear', "don't understand", 'confused'] },
  { type: 'decision', keywords: ['decide', 'approve', 'reject', 'decision', 'go/no-go'] },
  { type: 'collaboration', keywords: ['collaborate', 'coordinate', 'team up', 'work together', 'align with'] },
  { type: 'mission', keywords: ['mission', 'objective'] },
  { type: 'workflow', keywords: ['workflow', 'pipeline'] },
  { type: 'automation', keywords: ['automate', 'automatically', 'schedule', 'trigger'] },
  { type: 'analysis', keywords: ['analyze', 'analyse', 'report on', 'forecast', 'compare', 'evaluate'] },
  { type: 'command', keywords: ['create', 'run ', 'start ', 'execute', 'build', 'launch', 'stop ', 'cancel', 'update', 'delete'] },
];

function levelFor(score: number): IntentConfidenceLevel {
  if (score >= 0.85) return 'very_high';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.3) return 'low';
  return 'very_low';
}

function classify(rawInput: string): { readonly type: IntentType; readonly score: number; readonly rationale: string } {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  if (text.endsWith('?')) {
    return { type: 'query', score: 0.95, rationale: 'Input ends with a question mark.' };
  }

  for (const { type, keywords } of INTENT_KEYWORDS) {
    const matched = keywords.filter((keyword) => lower.includes(keyword));
    if (matched.length > 0) {
      const score = Math.min(0.95, 0.55 + matched.length * 0.15);
      return { type, score, rationale: `Matched keyword(s): ${matched.map((keyword) => keyword.trim()).join(', ')}` };
    }
  }

  return { type: 'unknown', score: 0.2, rationale: 'No recognizable intent keywords found.' };
}

function extractEntities(rawInput: string, organizationId: string, intentId: string): readonly IntentEntity[] {
  const now = nowIso();
  return [...rawInput.matchAll(/"([^"]+)"|'([^']+)'/g)].map((match) => {
    const value = (match[1] ?? match[2] ?? '').trim();
    return {
      id: generateId('intent-entity'),
      organizationId,
      createdAt: now,
      updatedAt: now,
      intentId,
      kind: 'quoted_reference',
      label: value,
      value,
      sourceSpan: match[0],
    };
  });
}

function extractParameters(rawInput: string, organizationId: string, intentId: string): readonly IntentParameter[] {
  const now = nowIso();
  return [...rawInput.matchAll(/-?\d+(?:\.\d+)?/g)].map((match, index) => ({
    id: generateId('intent-parameter'),
    organizationId,
    createdAt: now,
    updatedAt: now,
    intentId,
    name: `number_${index + 1}`,
    value: Number(match[0]),
    required: false,
  }));
}

/** Creates a deterministic, offline {@link IntentRecognizer}. */
export function createIntentRecognizer(): IntentRecognizer {
  return {
    async recognize(input: IntentRecognitionInput): Promise<Intent> {
      const { type, score, rationale } = classify(input.rawInput);
      const intentId = generateId('intent');
      const now = nowIso();

      return {
        id: intentId,
        organizationId: input.organizationId,
        createdAt: now,
        updatedAt: now,
        sessionId: input.sessionId,
        type,
        summary: input.rawInput.trim().slice(0, 200),
        rawInput: input.rawInput,
        confidence: { level: levelFor(score), score: score.toFixed(2), rationale },
        entities: extractEntities(input.rawInput, input.organizationId, intentId),
        parameters: extractParameters(input.rawInput, input.organizationId, intentId),
        language: input.language,
      };
    },
  };
}
